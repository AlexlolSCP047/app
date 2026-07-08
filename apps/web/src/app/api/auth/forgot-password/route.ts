import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

const TOKEN_MINUTES = 60;

/**
 * Paso 1 de "olvidé mi contraseña": genera un token de un solo uso y envía
 * el enlace por correo. La respuesta es SIEMPRE la misma exista o no la
 * cuenta, para no revelar qué correos están registrados.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ error: "Falta el correo." }, { status: 400 });

  const generic = {
    message: "Si ese correo tiene cuenta, te hemos enviado un enlace para restablecer la contraseña.",
  };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json(generic);

  // Token aleatorio: el valor real solo viaja en el correo; aquí guardamos su hash
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + TOKEN_MINUTES * 60_000) },
  });

  const appUrl = process.env.APP_URL ?? new URL(req.url).origin;
  const link = `${appUrl}/restablecer-contrasena?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: "Restablece tu contraseña de FitCoach IA",
    text:
      `Hola, ${user.name}:\n\n` +
      `Para elegir una contraseña nueva, abre este enlace (caduca en ${TOKEN_MINUTES} minutos):\n${link}\n\n` +
      "Si no pediste este cambio, ignora este correo: tu contraseña seguirá siendo la misma.",
    html:
      `<p>Hola, ${user.name}:</p>` +
      `<p>Para elegir una contraseña nueva, pulsa el botón (caduca en ${TOKEN_MINUTES} minutos):</p>` +
      `<p><a href="${link}" style="background:#2c9c6e;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Restablecer contraseña</a></p>` +
      `<p>O copia este enlace en tu navegador:<br>${link}</p>` +
      "<p>Si no pediste este cambio, ignora este correo: tu contraseña seguirá siendo la misma.</p>",
  });

  return NextResponse.json(generic);
}
