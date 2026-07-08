import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAccessInfo } from "@/lib/access";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** Registros de progreso (peso corporal y marcas por ejercicio). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const entries = await prisma.progressEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    take: 500,
  });
  return NextResponse.json({ entries });
}

/** Añade un registro de progreso. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  if (!getAccessInfo(user).hasAccess) {
    return NextResponse.json(
      { error: "Activa tu prueba o suscripción para registrar tu progreso.", code: "PAYWALL" },
      { status: 402 },
    );
  }

  const body = await req.json().catch(() => null);
  const kind = body?.kind === "ejercicio" ? "ejercicio" : "peso_corporal";
  const value = Number(body?.value);
  const label =
    typeof body?.label === "string" && body.label.trim()
      ? body.label.trim()
      : kind === "peso_corporal"
        ? "Peso corporal"
        : "";
  const reps = Number.isFinite(Number(body?.reps)) && Number(body?.reps) > 0 ? Number(body.reps) : null;

  if (!label || !Number.isFinite(value) || value <= 0) {
    return NextResponse.json({ error: "Introduce un valor válido." }, { status: 400 });
  }

  const entry = await prisma.progressEntry.create({
    data: { userId: user.id, kind, label, value, reps: kind === "ejercicio" ? reps : null },
  });
  return NextResponse.json({ entry });
}
