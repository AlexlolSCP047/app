import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** Cliente de Claude con inicialización perezosa (usa ANTHROPIC_API_KEY del entorno). */
export function anthropic(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-opus-4-8";

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
