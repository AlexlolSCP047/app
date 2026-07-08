import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAccessInfo } from "@/lib/access";
import { prisma } from "@/lib/db";
import { generateStructured, profileSummaryText, trainerSystemPrompt } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 120;

// Detalle de un ejercicio (técnica, músculos, errores) o su sustitución.
const detailSchema = {
  type: "object",
  properties: {
    nombre: { type: "string" },
    musculos: { type: "array", items: { type: "string" }, description: "Músculos principales" },
    tecnica: {
      type: "array",
      items: { type: "string" },
      description: "Pasos de ejecución, claros y ordenados",
    },
    errores: { type: "array", items: { type: "string" }, description: "Errores comunes a evitar" },
    consejo: { type: "string", description: "Un consejo clave para progresar de forma segura" },
  },
  required: ["nombre", "musculos", "tecnica", "errores", "consejo"],
  additionalProperties: false,
} as const;

const substituteSchema = {
  type: "object",
  properties: {
    original: { type: "string" },
    alternativa: { type: "string", description: "Ejercicio alternativo equivalente" },
    motivo: { type: "string", description: "Por qué es una buena sustitución" },
    musculos: { type: "array", items: { type: "string" } },
  },
  required: ["original", "alternativa", "motivo", "musculos"],
  additionalProperties: false,
} as const;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  if (!getAccessInfo(user).hasAccess) {
    return NextResponse.json(
      { error: "Activa tu prueba o suscripción para usar la biblioteca.", code: "PAYWALL" },
      { status: 402 },
    );
  }

  const body = await req.json().catch(() => null);
  const exercise = typeof body?.exercise === "string" ? body.exercise.trim() : "";
  const mode = body?.mode === "substitute" ? "substitute" : "detail";
  if (!exercise) return NextResponse.json({ error: "Falta el ejercicio." }, { status: 400 });

  const profile = await prisma.trainingProfile.findUnique({ where: { userId: user.id } });
  const system = trainerSystemPrompt(profile ? profileSummaryText(profile) : null);

  try {
    if (mode === "substitute") {
      const reason = typeof body?.reason === "string" && body.reason.trim() ? body.reason.trim() : "";
      const data = await generateStructured(
        system,
        `Propón UN ejercicio alternativo a "${exercise}" que trabaje los mismos músculos y sea viable ` +
          `con el material del cliente.${reason ? ` Motivo del cambio: ${reason}.` : ""}`,
        substituteSchema,
      );
      return NextResponse.json({ substitution: data });
    }
    const data = await generateStructured(
      system,
      `Explica el ejercicio "${exercise}": músculos que trabaja, técnica paso a paso, errores comunes y un consejo clave.`,
      detailSchema,
    );
    return NextResponse.json({ detail: data });
  } catch {
    return NextResponse.json(
      { error: "No se pudo obtener la información. Inténtalo de nuevo." },
      { status: 502 },
    );
  }
}
