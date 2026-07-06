import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

/** Portal de cliente de Stripe: cambiar tarjeta, ver facturas o cancelar la suscripción. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: "Aún no tienes una suscripción." }, { status: 400 });
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const session = await stripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/panel`,
  });

  return NextResponse.json({ url: session.url });
}
