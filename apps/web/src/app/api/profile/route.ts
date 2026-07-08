import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  const profile = await prisma.trainingProfile.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ profile });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const goal = typeof body?.goal === "string" ? body.goal.trim() : "";
  const level = typeof body?.level === "string" ? body.level.trim() : "";
  const daysPerWeek = Number(body?.daysPerWeek);
  const equipment = typeof body?.equipment === "string" ? body.equipment.trim() : "";

  if (!goal || !level || !equipment || !Number.isInteger(daysPerWeek) || daysPerWeek < 1 || daysPerWeek > 7) {
    return NextResponse.json(
      { error: "Faltan datos: objetivo, nivel, material y días por semana (1-7)." },
      { status: 400 },
    );
  }

  const optional = {
    injuries: typeof body?.injuries === "string" && body.injuries.trim() ? body.injuries.trim() : null,
    age: Number.isFinite(Number(body?.age)) && Number(body?.age) > 0 ? Number(body.age) : null,
    weightKg: Number.isFinite(Number(body?.weightKg)) && Number(body?.weightKg) > 0 ? Number(body.weightKg) : null,
    heightCm: Number.isFinite(Number(body?.heightCm)) && Number(body?.heightCm) > 0 ? Number(body.heightCm) : null,
    sex: typeof body?.sex === "string" && body.sex.trim() ? body.sex.trim() : null,
    focusAreas: typeof body?.focusAreas === "string" && body.focusAreas.trim() ? body.focusAreas.trim() : null,
    sessionMins:
      Number.isFinite(Number(body?.sessionMins)) && Number(body?.sessionMins) > 0 ? Number(body.sessionMins) : null,
  };

  const profile = await prisma.trainingProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, goal, level, daysPerWeek, equipment, ...optional },
    update: { goal, level, daysPerWeek, equipment, ...optional },
  });

  return NextResponse.json({ profile });
}
