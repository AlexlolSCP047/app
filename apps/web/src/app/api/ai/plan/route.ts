import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAccessInfo } from "@/lib/access";
import { prisma } from "@/lib/db";
import { anthropic, CLAUDE_MODEL, profileSummaryText, trainerSystemPrompt } from "@/lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 300; // la generación del plan puede tardar

// Esquema del plan semanal: salida estructurada garantizada por la API de Claude
const planSchema = {
  type: "object",
  properties: {
    resumen: { type: "string", description: "Resumen del enfoque del plan en 2-3 frases" },
    dias: {
      type: "array",
      items: {
        type: "object",
        properties: {
          dia: { type: "string", description: "Ej.: Día 1 - Lunes" },
          enfoque: { type: "string", description: "Grupo muscular o tipo de sesión" },
          ejercicios: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nombre: { type: "string" },
                series: { type: "integer" },
                repeticiones: { type: "string", description: "Ej.: 8-12, 30 s, al fallo" },
                descansoSegundos: { type: "integer" },
                notas: { type: "string", description: "Técnica, alternativas o progresión" },
              },
              required: ["nombre", "series", "repeticiones", "descansoSegundos", "notas"],
              additionalProperties: false,
            },
          },
        },
        required: ["dia", "enfoque", "ejercicios"],
        additionalProperties: false,
      },
    },
    consejos: {
      type: "array",
      items: { type: "string" },
      description: "Consejos de nutrición, descanso y progresión",
    },
  },
  required: ["resumen", "dias", "consejos"],
  additionalProperties: false,
} as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const plan = await prisma.trainingPlan.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    plan: plan ? { id: plan.id, createdAt: plan.createdAt, data: JSON.parse(plan.planJson) } : null,
  });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const access = getAccessInfo(user);
  if (!access.hasAccess) {
    return NextResponse.json(
      { error: "Tu prueba gratuita ha terminado. Suscríbete para continuar.", code: "PAYWALL" },
      { status: 402 },
    );
  }

  const profile = await prisma.trainingProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    return NextResponse.json(
      { error: "Completa primero tu perfil de entrenamiento.", code: "NO_PROFILE" },
      { status: 400 },
    );
  }

  const response = await anthropic().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: trainerSystemPrompt(profileSummaryText(profile)),
    output_config: { format: { type: "json_schema", schema: planSchema } },
    messages: [
      {
        role: "user",
        content:
          `Diseña mi plan de entrenamiento semanal completo para ${profile.daysPerWeek} días. ` +
          "Ajusta volumen e intensidad a mi nivel y material disponible, e incluye alternativas si algún ejercicio no es viable.",
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    return NextResponse.json(
      { error: "No se pudo generar el plan. Revisa los datos del perfil e inténtalo de nuevo." },
      { status: 502 },
    );
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "Respuesta vacía del modelo." }, { status: 502 });
  }

  const planData = JSON.parse(textBlock.text);
  const saved = await prisma.trainingPlan.create({
    data: { userId: user.id, planJson: JSON.stringify(planData) },
  });

  return NextResponse.json({
    plan: { id: saved.id, createdAt: saved.createdAt, data: planData },
  });
}
