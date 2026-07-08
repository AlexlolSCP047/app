import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAccessInfo } from "@/lib/access";
import { prisma } from "@/lib/db";
import { adaptiveContext, generateStructured, profileSummaryText, trainerSystemPrompt } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 300; // la generación del plan puede tardar

// Esquema del plan semanal: salida estructurada garantizada por la API del modelo
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
    const error =
      access.status === "none"
        ? "Activa tus 7 días de prueba gratis para usar la IA (botón del panel)."
        : "Tu suscripción no está activa. Reactívala para continuar.";
    return NextResponse.json({ error, code: "PAYWALL" }, { status: 402 });
  }

  const profile = await prisma.trainingProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    return NextResponse.json(
      { error: "Completa primero tu perfil de entrenamiento.", code: "NO_PROFILE" },
      { status: 400 },
    );
  }

  // Feedback de las últimas sesiones → sobrecarga progresiva adaptada.
  const recentLogs = await prisma.workoutLog.findMany({
    where: { userId: user.id },
    orderBy: { completedAt: "desc" },
    take: 8,
  });
  const adaptive = adaptiveContext(recentLogs);

  // Anclar la lista de días en el prompt garantiza que el modelo genere todos
  // los elementos del array (los modelos pequeños tienden a quedarse en uno).
  const dayList = Array.from({ length: profile.daysPerWeek }, (_, i) => `"Día ${i + 1}"`).join(", ");

  let planData: unknown;
  try {
    planData = await generateStructured(
      trainerSystemPrompt(profileSummaryText(profile)),
      `Diseña mi plan de entrenamiento semanal completo para ${profile.daysPerWeek} días. ` +
        `OBLIGATORIO: el array "dias" debe contener exactamente ${profile.daysPerWeek} elementos, ` +
        `en este orden: ${dayList} (añade el día de la semana sugerido a cada etiqueta). ` +
        "Cada día debe incluir entre 4 y 7 ejercicios. " +
        "Ajusta volumen e intensidad a mi nivel y material disponible, e incluye alternativas si algún ejercicio no es viable." +
        (adaptive ? `\n\n${adaptive}` : ""),
      planSchema,
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudo generar el plan. Inténtalo de nuevo en unos segundos." },
      { status: 502 },
    );
  }

  const saved = await prisma.trainingPlan.create({
    data: { userId: user.id, planJson: JSON.stringify(planData) },
  });

  return NextResponse.json({
    plan: { id: saved.id, createdAt: saved.createdAt, data: planData },
  });
}
