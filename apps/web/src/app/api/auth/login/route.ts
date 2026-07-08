import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { getAccessInfo } from "@/lib/access";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !valid) {
    return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  }

  const token = await createSessionToken(user.id);
  const res = NextResponse.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
    access: getAccessInfo(user),
  });
  const cookie = sessionCookieOptions();
  res.cookies.set(cookie.name, token, cookie);
  return res;
}
