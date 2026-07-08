import type { User } from "@prisma/client";

export type AccessInfo = {
  hasAccess: boolean;
  status: string; // trial | active | past_due | canceled
  trialEndsAt: string;
  trialActive: boolean;
  currentPeriodEnd: string | null;
};

/** Un usuario tiene acceso si su suscripción está activa o si sigue dentro de la prueba gratuita. */
export function getAccessInfo(user: User): AccessInfo {
  const now = new Date();
  const trialActive = user.subscriptionStatus === "trial" && user.trialEndsAt > now;
  const subscribed = user.subscriptionStatus === "active" || user.subscriptionStatus === "past_due";
  return {
    hasAccess: subscribed || trialActive,
    status: user.subscriptionStatus,
    trialEndsAt: user.trialEndsAt.toISOString(),
    trialActive,
    currentPeriodEnd: user.currentPeriodEnd?.toISOString() ?? null,
  };
}

export function trialHours(): number {
  const parsed = Number(process.env.TRIAL_HOURS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 24;
}
