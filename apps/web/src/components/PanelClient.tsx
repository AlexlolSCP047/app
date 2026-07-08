"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { AccessInfo } from "@/lib/access";

type ProfileForm = {
  goal: string;
  level: string;
  daysPerWeek: number;
  equipment: string;
  injuries: string;
  age: string;
  weightKg: string;
  heightCm: string;
};

type Exercise = {
  nombre: string;
  series: number;
  repeticiones: string;
  descansoSegundos: number;
  notas: string;
};

type Plan = {
  resumen: string;
  dias: { dia: string; enfoque: string; ejercicios: Exercise[] }[];
  consejos: string[];
};

type ChatMsg = { role: "user" | "assistant"; content: string };

const emptyProfile: ProfileForm = {
  goal: "perder grasa",
  level: "principiante",
  daysPerWeek: 3,
  equipment: "gimnasio completo",
  injuries: "",
  age: "",
  weightKg: "",
  heightCm: "",
};

export default function PanelClient(props: {
  userName: string;
  access: AccessInfo;
  initialProfile: ProfileForm | null;
  initialPlan: Plan | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"perfil" | "plan" | "chat">(props.initialProfile ? "plan" : "perfil");
  const [profile, setProfile] = useState<ProfileForm>(props.initialProfile ?? emptyProfile);
  const [hasProfile, setHasProfile] = useState(Boolean(props.initialProfile));
  const [plan, setPlan] = useState<Plan | null>(props.initialPlan);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/ai/chat")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setMessages(d.messages ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const trialMsLeft = new Date(props.access.trialEndsAt).getTime() - Date.now();
  const trialHoursLeft = Math.max(0, Math.ceil(trialMsLeft / 3_600_000));

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy("perfil");
    setNotice(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error ?? "No se pudo guardar el perfil.");
        return;
      }
      setHasProfile(true);
      setNotice("Perfil guardado. ¡Ya puedes generar tu plan!");
      setTab("plan");
    } finally {
      setBusy(null);
    }
  }

  async function generatePlan() {
    setBusy("plan");
    setNotice(null);
    try {
      const res = await fetch("/api/ai/plan", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error ?? "No se pudo generar el plan.");
        return;
      }
      setPlan(data.plan.data);
    } catch {
      setNotice("Error de conexión al generar el plan.");
    } finally {
      setBusy(null);
    }
  }

  async function sendChat(e: React.FormEvent) {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message || busy === "chat") return;
    setChatInput("");
    setMessages((prev) => [...prev, { role: "user", content: message }, { role: "assistant", content: "" }]);
    setBusy("chat");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: data.error ?? "No se pudo obtener respuesta.",
          };
          return next;
        });
        return;
      }
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: acc };
          return next;
        });
      }
    } finally {
      setBusy(null);
    }
  }

  async function goToCheckout() {
    setBusy("checkout");
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setNotice(data.error ?? "No se pudo abrir el pago.");
    } finally {
      setBusy(null);
    }
  }

  async function openPortal() {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Hola, {props.userName} 👋</h1>
          <p className="text-sm text-zinc-400">Tu entrenador personal con IA</p>
        </div>
        <button onClick={logout} className="btn-secondary">
          Salir
        </button>
      </header>

      {/* Estado de la suscripción */}
      {props.access.status === "active" ? (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-brand-800 bg-brand-950/60 px-4 py-3 text-sm">
          <span className="text-brand-300">✓ Suscripción activa — Plan Pro</span>
          <button onClick={openPortal} className="text-brand-400 hover:underline">
            Gestionar suscripción
          </button>
        </div>
      ) : props.access.trialActive ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm">
          <span className="text-amber-300">
            ⏳ Prueba gratuita: te quedan ~{trialHoursLeft} h
          </span>
          <button onClick={goToCheckout} className="btn-primary" disabled={busy === "checkout"}>
            {busy === "checkout" ? "Abriendo pago…" : "Suscribirme por 14,99 €/mes"}
          </button>
        </div>
      ) : (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm">
          <span className="text-red-300">Tu prueba gratuita ha terminado.</span>
          <button onClick={goToCheckout} className="btn-primary" disabled={busy === "checkout"}>
            {busy === "checkout" ? "Abriendo pago…" : "Suscribirme por 14,99 €/mes"}
          </button>
        </div>
      )}

      {notice && <p className="mb-4 text-sm text-amber-300">{notice}</p>}

      {/* Pestañas */}
      <nav className="mb-6 flex gap-2">
        {(
          [
            ["perfil", "Mi perfil"],
            ["plan", "Mi plan"],
            ["chat", "Chat con la IA"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={
              tab === key
                ? "rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
                : "rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-600"
            }
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Perfil */}
      {tab === "perfil" && (
        <form onSubmit={saveProfile} className="card max-w-2xl space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-zinc-300">Objetivo</label>
              <select
                className="input"
                value={profile.goal}
                onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
              >
                <option>perder grasa</option>
                <option>ganar músculo</option>
                <option>mejorar resistencia</option>
                <option>fuerza general</option>
                <option>mantenerme en forma</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-300">Nivel</label>
              <select
                className="input"
                value={profile.level}
                onChange={(e) => setProfile({ ...profile, level: e.target.value })}
              >
                <option>principiante</option>
                <option>intermedio</option>
                <option>avanzado</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-300">Días por semana</label>
              <select
                className="input"
                value={profile.daysPerWeek}
                onChange={(e) => setProfile({ ...profile, daysPerWeek: Number(e.target.value) })}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-300">Material disponible</label>
              <select
                className="input"
                value={profile.equipment}
                onChange={(e) => setProfile({ ...profile, equipment: e.target.value })}
              >
                <option>gimnasio completo</option>
                <option>mancuernas y bandas en casa</option>
                <option>sin material (peso corporal)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-300">Edad (opcional)</label>
              <input
                className="input"
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-300">Peso en kg (opcional)</label>
              <input
                className="input"
                type="number"
                step="0.1"
                value={profile.weightKg}
                onChange={(e) => setProfile({ ...profile, weightKg: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-300">
              Lesiones o limitaciones (opcional)
            </label>
            <textarea
              className="input"
              rows={2}
              value={profile.injuries}
              onChange={(e) => setProfile({ ...profile, injuries: e.target.value })}
              placeholder="Ej.: molestias en la rodilla derecha"
            />
          </div>
          <button className="btn-primary" disabled={busy === "perfil"}>
            {busy === "perfil" ? "Guardando…" : "Guardar perfil"}
          </button>
        </form>
      )}

      {/* Plan */}
      {tab === "plan" && (
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <button onClick={generatePlan} className="btn-primary" disabled={busy === "plan" || !hasProfile}>
              {busy === "plan" ? "La IA está diseñando tu plan…" : plan ? "Regenerar plan" : "Generar mi plan"}
            </button>
            {!hasProfile && (
              <p className="text-sm text-zinc-400">Completa primero tu perfil para generar el plan.</p>
            )}
          </div>

          {plan && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="mb-2 font-semibold text-brand-300">Resumen</h2>
                <p className="text-sm text-zinc-300">{plan.resumen}</p>
              </div>
              {plan.dias.map((dia) => (
                <div key={dia.dia} className="card">
                  <h3 className="font-semibold">
                    {dia.dia} <span className="text-sm font-normal text-brand-400">· {dia.enfoque}</span>
                  </h3>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-zinc-400">
                        <tr>
                          <th className="pb-2 pr-4">Ejercicio</th>
                          <th className="pb-2 pr-4">Series</th>
                          <th className="pb-2 pr-4">Reps</th>
                          <th className="pb-2 pr-4">Descanso</th>
                          <th className="pb-2">Notas</th>
                        </tr>
                      </thead>
                      <tbody className="text-zinc-200">
                        {dia.ejercicios.map((ej, i) => (
                          <tr key={i} className="border-t border-zinc-800">
                            <td className="py-2 pr-4 font-medium">{ej.nombre}</td>
                            <td className="py-2 pr-4">{ej.series}</td>
                            <td className="py-2 pr-4">{ej.repeticiones}</td>
                            <td className="py-2 pr-4">{ej.descansoSegundos} s</td>
                            <td className="py-2 text-zinc-400">{ej.notas}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              <div className="card">
                <h2 className="mb-2 font-semibold text-brand-300">Consejos</h2>
                <ul className="list-inside list-disc space-y-1 text-sm text-zinc-300">
                  {plan.consejos.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Chat */}
      {tab === "chat" && (
        <section className="card flex h-[60vh] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {messages.length === 0 && (
              <p className="text-sm text-zinc-500">
                Pregúntame lo que quieras: técnica de un ejercicio, cómo ajustar tu plan, nutrición
                básica…
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={
                    m.role === "user"
                      ? "inline-block max-w-[80%] rounded-2xl bg-brand-600 px-4 py-2 text-sm text-white"
                      : "inline-block max-w-[80%] whitespace-pre-wrap rounded-2xl bg-zinc-800 px-4 py-2 text-sm text-zinc-100"
                  }
                >
                  {m.content || "…"}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={sendChat} className="mt-4 flex gap-2">
            <input
              className="input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Escribe tu pregunta…"
              disabled={busy === "chat"}
            />
            <button className="btn-primary" disabled={busy === "chat" || !chatInput.trim()}>
              Enviar
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
