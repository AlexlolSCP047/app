import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAccessInfo } from "@/lib/access";
import { prisma } from "@/lib/db";
import { chatChunks, chatOnce, profileSummaryText, trainerSystemPrompt, type AiMessage } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 300;

const HISTORY_LIMIT = 20;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const messages = await prisma.chatMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return NextResponse.json({
    messages: messages.map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.createdAt })),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const access = getAccessInfo(user);
  if (!access.hasAccess) {
    return NextResponse.json(
      { error: "Tu prueba gratuita ha terminado. Suscríbete para continuar.", code: "PAYWALL" },
      { status: 402 },
    );
  }

  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  // La app móvil pide la respuesta completa en JSON (stream: false); la web usa streaming.
  const wantsStream = body?.stream !== false;
  if (!message) return NextResponse.json({ error: "Mensaje vacío." }, { status: 400 });

  const [profile, history] = await Promise.all([
    prisma.trainingProfile.findUnique({ where: { userId: user.id } }),
    prisma.chatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: HISTORY_LIMIT,
    }),
  ]);

  await prisma.chatMessage.create({ data: { userId: user.id, role: "user", content: message } });

  const conversation: AiMessage[] = [
    ...history.reverse().map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  const system = trainerSystemPrompt(profile ? profileSummaryText(profile) : null);

  if (!wantsStream) {
    let reply: string;
    try {
      reply = await chatOnce(system, conversation);
    } catch {
      return NextResponse.json(
        { error: "No se pudo obtener respuesta. Inténtalo de nuevo." },
        { status: 502 },
      );
    }
    await prisma.chatMessage.create({ data: { userId: user.id, role: "assistant", content: reply } });
    return NextResponse.json({ reply });
  }

  // Streaming: se envía el texto según lo genera el modelo y al final se guarda en BD.
  const encoder = new TextEncoder();
  const userId = user.id;
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        for await (const text of chatChunks(system, conversation)) {
          full += text;
          controller.enqueue(encoder.encode(text));
        }
      } catch {
        controller.enqueue(encoder.encode("\n[Error al generar la respuesta]"));
      } finally {
        if (full) {
          await prisma.chatMessage
            .create({ data: { userId, role: "assistant", content: full } })
            .catch(() => {});
        }
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
