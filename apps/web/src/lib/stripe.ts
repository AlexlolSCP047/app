import Stripe from "stripe";

// ID del precio de prueba (modo test de Stripe) integrado para la fase de
// pruebas; la variable de entorno STRIPE_PRICE_ID tiene prioridad si se define.
// Las claves secretas (STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET) nunca van en
// el código: se definen como variables de entorno en Vercel.
const TEST_PRICE_ID = "price_1TqsX7Ixw4PibaK17HIK7Fhc"; // FitCoach IA — Plan Pro, 9,99 EUR/mes

/** Días de prueba gratuita con tarjeta (Stripe no cobra hasta que terminan). */
export const TRIAL_DAYS = 7;

let client: Stripe | null = null;

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Falta STRIPE_SECRET_KEY en las variables de entorno");
  if (!client) client = new Stripe(key);
  return client;
}

/** ID del precio de la suscripción mensual (9,99 €). */
export function stripePriceId(): string {
  return process.env.STRIPE_PRICE_ID ?? TEST_PRICE_ID;
}

/** Secreto para verificar la firma de los webhooks de Stripe (null si falta). */
export function stripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET ?? null;
}
