import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAccessInfo } from "@/lib/access";
import { prisma } from "@/lib/db";
import PanelClient from "@/components/PanelClient";

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, lastPlan] = await Promise.all([
    prisma.trainingProfile.findUnique({ where: { userId: user.id } }),
    prisma.trainingPlan.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <PanelClient
      userName={user.name}
      access={getAccessInfo(user)}
      initialProfile={
        profile
          ? {
              goal: profile.goal,
              level: profile.level,
              daysPerWeek: profile.daysPerWeek,
              equipment: profile.equipment,
              injuries: profile.injuries ?? "",
              age: profile.age?.toString() ?? "",
              weightKg: profile.weightKg?.toString() ?? "",
              heightCm: profile.heightCm?.toString() ?? "",
              sex: profile.sex ?? "",
              focusAreas: profile.focusAreas ?? "",
              sessionMins: profile.sessionMins?.toString() ?? "45",
            }
          : null
      }
      initialPlan={lastPlan ? JSON.parse(lastPlan.planJson) : null}
    />
  );
}
