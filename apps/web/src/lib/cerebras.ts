// Cliente de la API de Cerebras (compatible con el formato OpenAI).
// Modelos disponibles: https://inference-docs.cerebras.ai/models

export type AiMessage = { role: "system" | "user" | "assistant"; content: string };

const CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions";

export const CEREBRAS_MODEL = process.env.CEREBRAS_MODEL ?? "gemma-4-31b";

function apiKey(): string {
  const key = process.env.CEREBRAS_API_KEY;
  if (!key) throw new Error("Falta CEREBRAS_API_KEY en las variables de entorno");
  return key;
}

async function request(body: Record<string, unknown>): Promise<Response> {
  const res = await fetch(CEREBRAS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`Error de Cerebras (${res.status}): ${detail}`);
  }
  return res;
}

/** Respuesta completa (sin streaming). Si se pasa un esquema, la salida es JSON garantizado. */
export async function cerebrasComplete(
  messages: AiMessage[],
  options?: { jsonSchema?: Record<string, unknown>; maxTokens?: number },
): Promise<string> {
  const body: Record<string, unknown> = {
    model: CEREBRAS_MODEL,
    messages,
    max_tokens: options?.maxTokens ?? 4000,
  };
  if (options?.jsonSchema) {
    body.response_format = {
      type: "json_schema",
      json_schema: { name: "respuesta", strict: true, schema: options.jsonSchema },
    };
  }
  const res = await request(body);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/** Respuesta en streaming: emite fragmentos de texto según los genera el modelo. */
export async function* cerebrasStream(
  messages: AiMessage[],
  maxTokens = 4000,
): AsyncGenerator<string> {
  const res = await request({ model: CEREBRAS_MODEL, messages, max_tokens: maxTokens, stream: true });
  const reader = res.body?.getReader();
  if (!reader) throw new Error("Cerebras no devolvió un stream");

  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Formato SSE: líneas "data: {json}" separadas por líneas en blanco
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // lo que quede incompleto se procesa en la siguiente vuelta
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const chunk = JSON.parse(payload);
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) yield text;
      } catch {
        // línea incompleta o keep-alive: se ignora
      }
    }
  }
}
