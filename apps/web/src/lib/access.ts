import type { User } from "@prisma/client";

export type AccessInfo = {
  hasAccess: boolean;
  // none (registrado sin tarjeta) | trialing (7 días de prueba) | active |
  // past_due | canceled
  status: string;
  trialEndsAt: string | null; // fin de la prueba (solo cuando status = trialing)
  trialActive: boolean;
  currentPeriodEnd: string | null;
};

/**
 * El acceso lo da la suscripción de Stripe: "trialing" (7 días de prueba con
 * tarjeta ya introducida), "active" (pagando) o "past_due" (pago pendiente de
 * reintento). Registrarse sin introducir la tarjeta no da acceso.
 */
export function getAccessInfo(user: User): AccessInfo {
  const status = user.subscriptionStatus;
  const trialActive = status === "trialing";
  const hasAccess = status === "active" || status === "trialing" || status === "past_due";
  const periodEnd = user.currentPeriodEnd?.toISOString() ?? null;
  return {
    hasAccess,
    status,
    trialEndsAt: trialActive ? periodEnd : null,
    trialActive,
    currentPeriodEnd: periodEnd,
  };
}
