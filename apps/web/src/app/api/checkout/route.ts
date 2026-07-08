import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe, stripePriceId, TRIAL_DAYS } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Crea una sesión de Stripe Checkout para la suscripción mensual (9,99 €) con
 * 7 días de prueba: se pide la tarjeta por adelantado pero no se cobra nada
 * hasta que termina la prueba. Stripe recoge la dirección de facturación y
 * puede mostrar el precio en la moneda local del cliente (Adaptive Pricing).
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const priceId = stripePriceId();
  // URL de retorno tras el pago: APP_URL si está definida; si no, el dominio actual.
  const appUrl = process.env.APP_URL ?? new URL(req.url).origin;

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe().customers.create({
      email: user.email,
      name: user.name,
      phone: user.phone ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  // Los 7 días de prueba solo se ofrecen a quien nunca ha tenido suscripción
  // (evita reactivar la prueba cancelando y volviendo a suscribirse).
  const firstSubscription = !user.subscriptionId;

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: firstSubscription ? { trial_period_days: TRIAL_DAYS } : undefined,
    billing_address_collection: "required",
    allow_promotion_codes: true,
    success_url: `${appUrl}/panel?checkout=success`,
    cancel_url: `${appUrl}/panel?checkout=cancel`,
    metadata: { userId: user.id },
  });

  return NextResponse.json({ url: session.url });
}
