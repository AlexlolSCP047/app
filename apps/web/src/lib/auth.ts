import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { prisma } from "./db";

const SESSION_COOKIE = "session";
const SESSION_DAYS = 30;

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("Falta AUTH_SECRET en producción");
  }
  return new TextEncoder().encode(value ?? "secreto-solo-para-desarrollo");
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setSubject(userId)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export function sessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

/**
 * Obtiene el id de usuario de la petición actual. Acepta dos formas de
 * autenticación con el mismo JWT:
 *  - Cookie httpOnly "session" (web)
 *  - Cabecera "Authorization: Bearer <token>" (app móvil)
 */
export async function getUserIdFromRequest(): Promise<string | null> {
  const authHeader = headers().get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const id = await getUserIdFromRequest();
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}
