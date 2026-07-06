import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { getAccessInfo, trialHours } from "@/lib/access";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const phone = typeof body?.phone === "string" && body.phone.trim() ? body.phone.trim() : null;

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Introduce tu nombre." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "El correo electrónico no es válido." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres." },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese correo." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const trialEndsAt = new Date(Date.now() + trialHours() * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, trialEndsAt },
  });

  const token = await createSessionToken(user.id);
  const res = NextResponse.json(
    {
      token, // la app móvil lo guarda y lo envía como "Authorization: Bearer"
      user: { id: user.id, name: user.name, email: user.email },
      access: getAccessInfo(user),
    },
    { status: 201 },
  );
  const cookie = sessionCookieOptions();
  res.cookies.set(cookie.name, token, cookie);
  return res;
}
