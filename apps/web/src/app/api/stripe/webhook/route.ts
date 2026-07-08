import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { stripe, stripeWebhookSecret } from "@/lib/stripe";

export const runtime = "nodejs";

/** Traduce el estado de la suscripción de Stripe al estado interno de la app. */
function mapStatus(status: Stripe.Subscription.Status): string {
  if (status === "trialing") return "trialing";
  if (status === "active") return "active";
  if (status === "past_due") return "past_due";
  return "canceled";
}

async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      subscriptionStatus: mapStatus(sub.status),
      subscriptionId: sub.id,
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
    },
  });
}

/**
 * Webhook de Stripe: mantiene sincronizado el estado de la suscripción
 * (prueba de 7 días → activa → impago → cancelada). Eventos configurados:
 * checkout.session.completed, customer.subscription.created/updated/deleted.
 */
export async function POST(req: Request) {
  const secret = stripeWebhookSecret();
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook no configurado." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Firma inválida." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (subscriptionId) {
        // Se consulta la suscripción real para saber si está en prueba o activa
        const sub = await stripe().subscriptions.retrieve(subscriptionId);
        await syncSubscription(sub);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { subscriptionStatus: "canceled" },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
