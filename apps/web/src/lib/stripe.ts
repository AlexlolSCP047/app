import Stripe from "stripe";

let client: Stripe | null = null;

/** Cliente de Stripe con inicialización perezosa para no exigir claves en build. */
export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Falta STRIPE_SECRET_KEY en las variables de entorno");
  if (!client) client = new Stripe(key);
  return client;
}
