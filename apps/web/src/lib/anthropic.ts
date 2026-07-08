import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** Cliente de Claude con inicialización perezosa (usa ANTHROPIC_API_KEY del entorno). */
export function anthropic(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-opus-4-8";
