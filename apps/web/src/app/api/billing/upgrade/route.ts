import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe, stripePriceId } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Mejora del plan Básico al Pro (14,99 €): cambia el precio de la suscripción
 * existente en Stripe con prorrateo, sin pasar de nuevo por Checkout.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (!user.subscriptionId) {
    return NextResponse.json({ error: "No tienes una suscripción activa que mejorar." }, { status: 400 });
  }

  try {
    const sub = await stripe().subscriptions.retrieve(user.subscriptionId);
    const itemId = sub.items.data[0]?.id;
    if (!itemId) throw new Error("suscripción sin items");
    await stripe().subscriptions.update(user.subscriptionId, {
      items: [{ id: itemId, price: stripePriceId("pro") }],
      proration_behavior: "create_prorations",
    });
    await prisma.user.update({ where: { id: user.id }, data: { planTier: "pro" } });
    return NextResponse.json({ ok: true, message: "¡Ya tienes el plan Pro! Dieta y análisis de comidas desbloqueados." });
  } catch (err) {
    console.error("Error mejorando el plan:", err);
    return NextResponse.json({ error: "No se pudo mejorar el plan. Inténtalo de nuevo." }, { status: 503 });
  }
}
