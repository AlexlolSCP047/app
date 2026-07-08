import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Crea una sesión de Stripe Checkout para la suscripción mensual (14,99 €).
 * Stripe se encarga de recoger la dirección de facturación y el método de pago,
 * y puede mostrar el precio en la moneda local del cliente (Adaptive Pricing).
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const priceId = process.env.STRIPE_PRICE_ID;
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  if (!priceId) {
    return NextResponse.json({ error: "Pagos no configurados (STRIPE_PRICE_ID)." }, { status: 500 });
  }

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

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    billing_address_collection: "required",
    allow_promotion_codes: true,
    success_url: `${appUrl}/panel?checkout=success`,
    cancel_url: `${appUrl}/panel?checkout=cancel`,
    metadata: { userId: user.id },
  });

  return NextResponse.json({ url: session.url });
}
