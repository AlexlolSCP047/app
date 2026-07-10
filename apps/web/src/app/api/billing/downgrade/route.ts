import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe, stripePriceId } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Bajada de plan Pro → Básico: cambia el precio de la suscripción sin
 * prorrateo (el nuevo precio se cobra a partir del siguiente ciclo) y
 * retira el acceso a dieta/comidas de inmediato.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (!user.subscriptionId) {
    return NextResponse.json({ error: "No tienes una suscripción activa." }, { status: 400 });
  }

  try {
    const sub = await stripe().subscriptions.retrieve(user.subscriptionId);
    const itemId = sub.items.data[0]?.id;
    if (!itemId) throw new Error("suscripción sin items");
    await stripe().subscriptions.update(user.subscriptionId, {
      items: [{ id: itemId, price: stripePriceId("basico") }],
      proration_behavior: "none",
    });
    await prisma.user.update({ where: { id: user.id }, data: { planTier: "basico" } });
    return NextResponse.json({ ok: true, message: "Plan cambiado a Básico. Desde el próximo ciclo pagarás 9,99 €/mes." });
  } catch (err) {
    console.error("Error bajando el plan:", err);
    return NextResponse.json({ error: "No se pudo cambiar el plan. Inténtalo de nuevo." }, { status: 503 });
  }
}
