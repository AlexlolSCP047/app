import Stripe from "stripe";

// ID del precio de prueba (modo test de Stripe) integrado para la fase de
// pruebas; la variable de entorno STRIPE_PRICE_ID tiene prioridad si se define.
// Las claves secretas (STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET) nunca van en
// el código: se definen como variables de entorno en Vercel.
const TEST_PRICE_BASIC = "price_1TqsX7Ixw4PibaK17HIK7Fhc"; // Plan Básico, 9,99 EUR/mes (test)
const TEST_PRICE_PRO = "price_1TqrfeIxw4PibaK1F2Bt7nVq"; // Plan Pro, 14,99 EUR/mes (test)

/** Días de prueba gratuita con tarjeta (Stripe no cobra hasta que terminan). */
export const TRIAL_DAYS = 1;

let client: Stripe | null = null;

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Falta STRIPE_SECRET_KEY en las variables de entorno");
  if (!client) client = new Stripe(key);
  return client;
}

export type PlanTier = "basico" | "pro";

/** ID del precio según el plan: Básico 9,99 € (solo entrenamiento) o Pro 14,99 € (+ dieta). */
export function stripePriceId(plan: PlanTier): string {
  if (plan === "basico") return process.env.STRIPE_PRICE_ID_BASIC ?? TEST_PRICE_BASIC;
  return process.env.STRIPE_PRICE_ID_PRO ?? process.env.STRIPE_PRICE_ID ?? TEST_PRICE_PRO;
}

/** Deduce el plan a partir del precio de la suscripción (para el webhook). */
export function planFromPriceId(priceId: string): PlanTier {
  return priceId === (process.env.STRIPE_PRICE_ID_BASIC ?? TEST_PRICE_BASIC) ? "basico" : "pro";
}

/** Secreto para verificar la firma de los webhooks de Stripe (null si falta). */
export function stripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET ?? null;
}
