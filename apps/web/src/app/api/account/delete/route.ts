import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Elimina la cuenta del usuario y todos sus datos (RGPD y requisito de
 * Google Play). Cancela antes la suscripción de Stripe para que no se
 * generen más cobros; el borrado del usuario arrastra en cascada perfil,
 * planes, sesiones, progreso y chat.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  if (user.subscriptionId) {
    try {
      await stripe().subscriptions.cancel(user.subscriptionId);
    } catch {
      // Si Stripe no responde (o la suscripción ya no existe), el borrado
      // de la cuenta no debe bloquearse por ello.
    }
  }

  await prisma.user.delete({ where: { id: user.id } });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
