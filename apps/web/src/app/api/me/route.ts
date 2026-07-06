import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAccessInfo } from "@/lib/access";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const profile = await prisma.trainingProfile.findUnique({ where: { userId: user.id } });
  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    access: getAccessInfo(user),
    profile,
  });
}
