import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAccessInfo } from "@/lib/access";
import { prisma } from "@/lib/db";
import { generateStructured, profileSummaryText, trainerSystemPrompt } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 120;

// Análisis nutricional de una comida descrita por el cliente
const mealSchema = {
  type: "object",
  properties: {
    alimentos: { type: "array", items: { type: "string" }, description: "Alimentos identificados" },
    kcal: { type: "integer", description: "Calorías estimadas totales" },
    proteinasG: { type: "integer" },
    carbohidratosG: { type: "integer" },
    grasasG: { type: "integer" },
    valoracion: { type: "string", description: "Valoración breve respecto al objetivo del cliente" },
    sugerencia: { type: "string", description: "Un cambio concreto para mejorarla" },
  },
  required: ["alimentos", "kcal", "proteinasG", "carbohidratosG", "grasasG", "valoracion", "sugerencia"],
  additionalProperties: false,
} as const;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  if (!getAccessInfo(user).hasAccess) {
    return NextResponse.json(
      { error: "Activa tu prueba o suscripción para analizar comidas.", code: "PAYWALL" },
      { status: 402 },
    );
  }

  const body = await req.json().catch(() => null);
  const meal = typeof body?.meal === "string" ? body.meal.trim() : "";
  if (!meal) return NextResponse.json({ error: "Describe qué has comido." }, { status: 400 });

  if (user.planTier !== "pro") {
    return NextResponse.json(
      { error: "La dieta y el análisis de comidas son del plan Pro (14,99 €/mes). Mejora tu plan para usarlos.", code: "PLAN_BASIC" },
      { status: 402 },
    );
  }

  const profile = await prisma.trainingProfile.findUnique({ where: { userId: user.id } });
  try {
    const data = await generateStructured(
      trainerSystemPrompt(profile ? profileSummaryText(profile) : null),
      `Analiza nutricionalmente esta comida y estima sus macros con cantidades razonables: "${meal}". ` +
        "Valórala respecto a mi objetivo y proponme UNA mejora concreta.",
      mealSchema,
    );
    return NextResponse.json({ analysis: data });
  } catch {
    return NextResponse.json({ error: "No se pudo analizar la comida. Inténtalo de nuevo." }, { status: 502 });
  }
}
