import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAccessInfo } from "@/lib/access";
import { prisma } from "@/lib/db";
import { generateStructured, profileSummaryText, trainerSystemPrompt } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 300;

// Plan de dieta diario con macros, adaptado al perfil y objetivo del cliente
const dietSchema = {
  type: "object",
  properties: {
    objetivoCalorias: { type: "integer", description: "Calorías diarias objetivo" },
    resumen: { type: "string", description: "Enfoque de la dieta en 2-3 frases" },
    comidas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nombre: { type: "string", description: "Ej.: Desayuno, Comida, Cena, Snack" },
          hora: { type: "string", description: "Hora orientativa, ej.: 08:00" },
          descripcion: { type: "string", description: "Platos y cantidades aproximadas" },
          kcal: { type: "integer" },
          proteinasG: { type: "integer" },
          carbohidratosG: { type: "integer" },
          grasasG: { type: "integer" },
        },
        required: ["nombre", "hora", "descripcion", "kcal", "proteinasG", "carbohidratosG", "grasasG"],
        additionalProperties: false,
      },
    },
    consejos: { type: "array", items: { type: "string" } },
  },
  required: ["objetivoCalorias", "resumen", "comidas", "consejos"],
  additionalProperties: false,
} as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  const diet = await prisma.dietPlan.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ diet: diet ? { id: diet.id, createdAt: diet.createdAt, data: JSON.parse(diet.dietJson) } : null });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const access = getAccessInfo(user);
  if (!access.hasAccess) {
    const error =
      access.status === "none"
        ? "Activa tu día de prueba gratis para usar la IA (botón del panel)."
        : "Tu suscripción no está activa. Reactívala para continuar.";
    return NextResponse.json({ error, code: "PAYWALL" }, { status: 402 });
  }

  if (user.planTier !== "pro") {
    return NextResponse.json(
      { error: "La dieta y el análisis de comidas son del plan Pro (14,99 €/mes). Mejora tu plan para usarlos.", code: "PLAN_BASIC" },
      { status: 402 },
    );
  }

  const profile = await prisma.trainingProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    return NextResponse.json({ error: "Completa primero tu perfil de entrenamiento.", code: "NO_PROFILE" }, { status: 400 });
  }

  let dietData: unknown;
  try {
    dietData = await generateStructured(
      trainerSystemPrompt(profileSummaryText(profile)),
      "Diseña mi plan de alimentación de UN día completo alineado con mi objetivo de entrenamiento. " +
        "OBLIGATORIO: el array \"comidas\" debe contener entre 4 y 5 elementos (desayuno, comida, cena y 1-2 snacks), " +
        "con platos concretos de cocina española/mediterránea, cantidades aproximadas y macros realistas. " +
        "Las calorías totales deben cuadrar con el objetivo (déficit para perder grasa, superávit ligero para ganar músculo).",
      dietSchema,
    );
  } catch {
    return NextResponse.json({ error: "No se pudo generar la dieta. Inténtalo de nuevo en unos segundos." }, { status: 502 });
  }

  const saved = await prisma.dietPlan.create({ data: { userId: user.id, dietJson: JSON.stringify(dietData) } });
  return NextResponse.json({ diet: { id: saved.id, createdAt: saved.createdAt, data: dietData } });
}
