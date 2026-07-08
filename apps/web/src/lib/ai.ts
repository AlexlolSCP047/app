// Capa de IA con proveedor intercambiable:
//  - "cerebras" (gratis, modelo gemma-4-31b por defecto) — se usa si hay CEREBRAS_API_KEY
//  - "claude"  (Anthropic, claude-opus-4-8) — se usa si no, o forzando AI_PROVIDER=claude

import { anthropic, CLAUDE_MODEL } from "./anthropic";
import { cerebrasComplete, cerebrasStream, type AiMessage } from "./cerebras";

export type { AiMessage };

export function aiProvider(): "cerebras" | "claude" {
  const forced = process.env.AI_PROVIDER;
  if (forced === "claude" || forced === "cerebras") return forced;
  // Cerebras es el proveedor por defecto (lleva clave de pruebas integrada).
  return "cerebras";
}

/** Prompt de sistema compartido por el generador de planes y el chat. */
export function trainerSystemPrompt(profileSummary: string | null): string {
  return [
    "Eres FitCoach, un entrenador personal profesional con experiencia en ciencias del deporte.",
    "Diseñas planes de entrenamiento seguros, progresivos y adaptados a la persona.",
    "Respondes siempre en el idioma del usuario (por defecto, español).",
    "Principios: técnica antes que carga, sobrecarga progresiva, descanso adecuado y adherencia realista.",
    "No eres médico: ante dolor agudo, mareos o lesiones, recomienda consultar a un profesional sanitario.",
    profileSummary ? `Perfil del cliente:\n${profileSummary}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function profileSummaryText(profile: {
  goal: string;
  level: string;
  daysPerWeek: number;
  equipment: string;
  injuries?: string | null;
  age?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
}): string {
  const lines = [
    `- Objetivo: ${profile.goal}`,
    `- Nivel: ${profile.level}`,
    `- Días de entrenamiento por semana: ${profile.daysPerWeek}`,
    `- Material disponible: ${profile.equipment}`,
  ];
  if (profile.injuries) lines.push(`- Lesiones o limitaciones: ${profile.injuries}`);
  if (profile.age) lines.push(`- Edad: ${profile.age}`);
  if (profile.weightKg) lines.push(`- Peso: ${profile.weightKg} kg`);
  if (profile.heightCm) lines.push(`- Altura: ${profile.heightCm} cm`);
  return lines.join("\n");
}

/** Genera un objeto JSON que cumple el esquema dado (plan de entrenamiento). */
export async function generateStructured(
  system: string,
  userPrompt: string,
  schema: Record<string, unknown>,
): Promise<unknown> {
  if (aiProvider() === "cerebras") {
    const text = await cerebrasComplete(
      [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      { jsonSchema: schema, maxTokens: 8000 },
    );
    return JSON.parse(text);
  }

  const response = await anthropic().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system,
    output_config: { format: { type: "json_schema", schema } },
    messages: [{ role: "user", content: userPrompt }],
  });
  if (response.stop_reason === "refusal") {
    throw new Error("El modelo rechazó la petición");
  }
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Respuesta vacía del modelo");
  return JSON.parse(textBlock.text);
}

/** Respuesta de chat completa (sin streaming) — la usa la app móvil. */
export async function chatOnce(system: string, conversation: AiMessage[]): Promise<string> {
  if (aiProvider() === "cerebras") {
    return cerebrasComplete([{ role: "system", content: system }, ...conversation], {
      maxTokens: 4000,
    });
  }

  const response = await anthropic().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    system,
    messages: conversation.filter((m) => m.role !== "system"),
  });
  if (response.stop_reason === "refusal") {
    throw new Error("El modelo rechazó la petición");
  }
  return response.content
    .filter((b) => b.type === "text")
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");
}

/** Respuesta de chat en streaming: fragmentos de texto según se generan — la usa la web. */
export async function* chatChunks(
  system: string,
  conversation: AiMessage[],
): AsyncGenerator<string> {
  if (aiProvider() === "cerebras") {
    yield* cerebrasStream([{ role: "system", content: system }, ...conversation], 4000);
    return;
  }

  const stream = anthropic().messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    system,
    messages: conversation.filter((m) => m.role !== "system"),
  });
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }
}
