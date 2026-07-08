import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAccessInfo } from "@/lib/access";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** Historial de sesiones completadas (para el calendario, la racha y el progreso). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const workouts = await prisma.workoutLog.findMany({
    where: { userId: user.id },
    orderBy: { completedAt: "desc" },
    take: 120,
  });
  return NextResponse.json({ workouts });
}

/** Marca una sesión como completada con la percepción de esfuerzo del cliente. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  if (!getAccessInfo(user).hasAccess) {
    return NextResponse.json(
      { error: "Activa tu prueba o suscripción para registrar tus sesiones.", code: "PAYWALL" },
      { status: 402 },
    );
  }

  const body = await req.json().catch(() => null);
  const dayLabel = typeof body?.dayLabel === "string" ? body.dayLabel.trim() : "";
  const difficulty = ["facil", "justo", "dificil"].includes(body?.difficulty) ? body.difficulty : "";
  const focus = typeof body?.focus === "string" && body.focus.trim() ? body.focus.trim() : null;
  const notes = typeof body?.notes === "string" && body.notes.trim() ? body.notes.trim() : null;

  if (!dayLabel || !difficulty) {
    return NextResponse.json(
      { error: "Falta el día o la dificultad (facil/justo/dificil)." },
      { status: 400 },
    );
  }

  const workout = await prisma.workoutLog.create({
    data: { userId: user.id, dayLabel, focus, difficulty, notes },
  });
  return NextResponse.json({ workout });
}
