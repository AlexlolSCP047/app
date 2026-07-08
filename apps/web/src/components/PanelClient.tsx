"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AccessInfo } from "@/lib/access";

// ---------- Tipos ----------

type ProfileForm = {
  goal: string;
  level: string;
  daysPerWeek: number;
  equipment: string;
  injuries: string;
  age: string;
  weightKg: string;
  heightCm: string;
  sex: string;
  focusAreas: string;
  sessionMins: string;
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

type Workout = {
  id: string;
  dayLabel: string;
  focus?: string | null;
  difficulty: string;
  completedAt: string;
};

type ProgressRow = {
  id: string;
  kind: string;
  label: string;
  value: number;
  reps?: number | null;
  createdAt: string;
};

type ExerciseDetail = {
  nombre: string;
  musculos: string[];
  tecnica: string[];
  errores: string[];
  consejo: string;
};

const emptyProfile: ProfileForm = {
  goal: "perder grasa",
  level: "principiante",
  daysPerWeek: 3,
  equipment: "gimnasio completo",
  injuries: "",
  age: "",
  weightKg: "",
  heightCm: "",
  sex: "",
  focusAreas: "",
  sessionMins: "45",
};

const TABS = [
  ["hoy", "🔥 Hoy"],
  ["plan", "📅 Mi plan"],
  ["ejercicios", "📖 Ejercicios"],
  ["progreso", "📈 Progreso"],
  ["chat", "💬 Chat"],
  ["perfil", "⚙️ Perfil"],
] as const;

type TabKey = (typeof TABS)[number][0];

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // lunes = 0
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

// ---------- Componente principal ----------

export default function PanelClient(props: {
  userName: string;
  access: AccessInfo;
  initialProfile: ProfileForm | null;
  initialPlan: Plan | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>(props.initialProfile ? "hoy" : "perfil");
  const [profile, setProfile] = useState<ProfileForm>(props.initialProfile ?? emptyProfile);
  const [hasProfile, setHasProfile] = useState(Boolean(props.initialProfile));
  const [plan, setPlan] = useState<Plan | null>(props.initialPlan);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/ai/chat").then((r) => (r.ok ? r.json() : null)).then((d) => d && setMessages(d.messages ?? [])).catch(() => {});
    fetch("/api/workouts").then((r) => (r.ok ? r.json() : null)).then((d) => d && setWorkouts(d.workouts ?? [])).catch(() => {});
    fetch("/api/progress").then((r) => (r.ok ? r.json() : null)).then((d) => d && setProgress(d.entries ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const trialMsLeft = props.access.trialEndsAt
    ? new Date(props.access.trialEndsAt).getTime() - Date.now()
    : 0;
  const trialDaysLeft = Math.max(0, Math.ceil(trialMsLeft / 86_400_000));

  // ---------- Datos derivados para "Hoy" ----------

  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const doneThisWeek = useMemo(
    () => workouts.filter((w) => new Date(w.completedAt) >= weekStart),
    [workouts, weekStart],
  );
  const doneLabels = useMemo(() => new Set(doneThisWeek.map((w) => w.dayLabel)), [doneThisWeek]);
  const nextDay = useMemo(
    () => plan?.dias.find((d) => !doneLabels.has(d.dia)) ?? null,
    [plan, doneLabels],
  );
  const weeklyTarget = profile.daysPerWeek || plan?.dias.length || 3;
  const weeklyPct = Math.min(100, Math.round((doneThisWeek.length / weeklyTarget) * 100));

  const streakWeeks = useMemo(() => {
    if (workouts.length === 0) return 0;
    let streak = 0;
    let cursor = startOfWeek(new Date());
    for (let i = 0; i < 52; i++) {
      const end = new Date(cursor.getTime() + 7 * 86_400_000);
      const any = workouts.some((w) => {
        const t = new Date(w.completedAt);
        return t >= cursor && t < end;
      });
      if (any) streak++;
      else if (i > 0) break; // la semana actual sin sesiones aún no rompe la racha
      cursor = new Date(cursor.getTime() - 7 * 86_400_000);
    }
    return streak;
  }, [workouts]);

  // ---------- Acciones ----------

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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice(data.error ?? "No se pudo guardar el perfil.");
        return;
      }
      setHasProfile(true);
      setNotice("Perfil guardado. ¡Genera tu plan personalizado!");
      setTab(plan ? "hoy" : "plan");
    } finally {
      setBusy(null);
    }
  }

  async function generatePlan() {
    setBusy("plan");
    setNotice(null);
    try {
      const res = await fetch("/api/ai/plan", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice(data.error ?? "No se pudo generar el plan.");
        return;
      }
      setPlan(data.plan.data);
      setNotice(null);
    } catch {
      setNotice("Error de conexión al generar el plan.");
    } finally {
      setBusy(null);
    }
  }

  async function completeWorkout(dayLabel: string, focus: string, difficulty: string) {
    setBusy(`done-${dayLabel}`);
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayLabel, focus, difficulty }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice(data.error ?? "No se pudo registrar la sesión.");
        return;
      }
      setWorkouts((prev) => [data.workout, ...prev]);
      setNotice("💪 Sesión registrada. La IA la tendrá en cuenta en tu próximo plan.");
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
          next[next.length - 1] = { role: "assistant", content: data.error ?? "No se pudo obtener respuesta." };
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
      const data = await res.json().catch(() => ({}));
      if (data.url) window.location.href = data.url;
      else setNotice(data.error ?? "No se pudo abrir el pago. Inténtalo de nuevo en unos minutos.");
    } catch {
      setNotice("Error de conexión al abrir el pago. Inténtalo de nuevo.");
    } finally {
      setBusy(null);
    }
  }

  async function openPortal() {
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data.url) window.location.href = data.url;
      else setNotice(data.error ?? "No se pudo abrir la gestión de la suscripción.");
    } catch {
      setNotice("Error de conexión. Inténtalo de nuevo.");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  // ---------- Render ----------

  return (
    <main className="app-bg mx-auto min-h-screen max-w-5xl px-6 py-8">
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
          <span className="text-brand-300">✓ Suscripción activa — Plan Pro (9,99 €/mes)</span>
          <button onClick={openPortal} className="text-brand-400 hover:underline">
            Gestionar suscripción
          </button>
        </div>
      ) : props.access.trialActive ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-800 bg-brand-950/40 px-4 py-3 text-sm">
          <span className="text-brand-300">
            🎁 Prueba gratuita: te {trialDaysLeft === 1 ? "queda 1 día" : `quedan ${trialDaysLeft} días`}. Después, 9,99 €/mes.
          </span>
          <button onClick={openPortal} className="text-brand-400 hover:underline">
            Gestionar o cancelar
          </button>
        </div>
      ) : props.access.status === "past_due" ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm">
          <span className="text-amber-300">⚠️ Hay un problema con tu último pago.</span>
          <button onClick={openPortal} className="btn-primary">
            Actualizar tarjeta
          </button>
        </div>
      ) : (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm">
          <span className="text-amber-300">Activa tus 7 días de prueba gratis — sin cobro hasta el día 8.</span>
          <button onClick={goToCheckout} className="btn-primary" disabled={busy === "checkout"}>
            {busy === "checkout" ? "Abriendo…" : "Empezar 7 días gratis"}
          </button>
        </div>
      )}

      {notice && <p className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900/70 px-4 py-2 text-sm text-amber-300">{notice}</p>}

      {/* Pestañas */}
      <nav className="mb-6 flex flex-wrap gap-2">
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`tab ${tab === key ? "tab-active" : ""}`}>
            {label}
          </button>
        ))}
      </nav>

      {tab === "hoy" && (
        <TodayTab
          plan={plan}
          nextDay={nextDay}
          doneThisWeek={doneThisWeek.length}
          weeklyTarget={weeklyTarget}
          weeklyPct={weeklyPct}
          streakWeeks={streakWeeks}
          totalSessions={workouts.length}
          busy={busy}
          hasProfile={hasProfile}
          onComplete={completeWorkout}
          onGenerate={generatePlan}
          goPlan={() => setTab("plan")}
          goPerfil={() => setTab("perfil")}
        />
      )}

      {tab === "plan" && (
        <PlanTab
          plan={plan}
          hasProfile={hasProfile}
          busy={busy}
          doneLabels={doneLabels}
          hasFeedback={workouts.length > 0}
          onGenerate={generatePlan}
          onComplete={completeWorkout}
        />
      )}

      {tab === "ejercicios" && <LibraryTab plan={plan} />}

      {tab === "progreso" && (
        <ProgressTab progress={progress} workouts={workouts} onAdd={(e) => setProgress((p) => [...p, e])} setNotice={setNotice} />
      )}

      {tab === "chat" && (
        <section className="card flex h-[60vh] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {messages.length === 0 && (
              <p className="text-sm text-zinc-500">
                Pregúntame lo que quieras: técnica de un ejercicio, cómo ajustar tu plan, nutrición básica…
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

      {tab === "perfil" && (
        <ProfileTab profile={profile} setProfile={setProfile} busy={busy} onSave={saveProfile} isNew={!hasProfile} />
      )}
    </main>
  );
}

// ---------- Pestaña HOY ----------

function TodayTab(props: {
  plan: Plan | null;
  nextDay: Plan["dias"][number] | null;
  doneThisWeek: number;
  weeklyTarget: number;
  weeklyPct: number;
  streakWeeks: number;
  totalSessions: number;
  busy: string | null;
  hasProfile: boolean;
  onComplete: (day: string, focus: string, difficulty: string) => void;
  onGenerate: () => void;
  goPlan: () => void;
  goPerfil: () => void;
}) {
  const [difficulty, setDifficulty] = useState("justo");

  if (!props.hasProfile) {
    return (
      <div className="card text-center">
        <p className="text-lg font-semibold">Empecemos por conocerte 💚</p>
        <p className="mt-2 text-sm text-zinc-400">Responde el cuestionario inicial y la IA diseñará tu plan a medida.</p>
        <button onClick={props.goPerfil} className="btn-primary mt-6">
          Hacer el cuestionario
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Métricas rápidas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card py-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Esta semana</p>
          <p className="mt-1 text-2xl font-extrabold">
            {props.doneThisWeek}
            <span className="text-base font-medium text-zinc-400"> / {props.weeklyTarget} sesiones</span>
          </p>
          <div className="meter mt-3">
            <span style={{ width: `${props.weeklyPct}%` }} />
          </div>
        </div>
        <div className="card py-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Racha</p>
          <p className="mt-1 text-2xl font-extrabold">
            🔥 {props.streakWeeks}
            <span className="text-base font-medium text-zinc-400"> {props.streakWeeks === 1 ? "semana" : "semanas"}</span>
          </p>
        </div>
        <div className="card py-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total</p>
          <p className="mt-1 text-2xl font-extrabold">
            {props.totalSessions}
            <span className="text-base font-medium text-zinc-400"> sesiones</span>
          </p>
        </div>
      </div>

      {/* Sesión de hoy */}
      {!props.plan ? (
        <div className="card text-center">
          <p className="font-semibold">Aún no tienes plan.</p>
          <button onClick={props.onGenerate} className="btn-primary mt-4" disabled={props.busy === "plan"}>
            {props.busy === "plan" ? "La IA está diseñando tu plan…" : "Generar mi plan con IA"}
          </button>
        </div>
      ) : props.nextDay ? (
        <div className="card border-brand-800">
          <p className="text-xs uppercase tracking-wide text-brand-400">Tu próxima sesión</p>
          <h2 className="mt-1 text-xl font-bold">
            {props.nextDay.dia} <span className="font-normal text-brand-300">· {props.nextDay.enfoque}</span>
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            {props.nextDay.ejercicios.map((ej, i) => (
              <li key={i} className="flex items-baseline justify-between gap-4 border-b border-zinc-800/60 pb-2">
                <span className="font-medium">{ej.nombre}</span>
                <span className="shrink-0 text-zinc-400">
                  {ej.series} × {ej.repeticiones}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-sm text-zinc-400">¿Cómo ha ido?</span>
            {[
              ["facil", "😎 Fácil"],
              ["justo", "💪 Justo"],
              ["dificil", "🥵 Difícil"],
            ].map(([k, label]) => (
              <button key={k} onClick={() => setDifficulty(k)} className={`chip ${difficulty === k ? "chip-active" : ""}`}>
                {label}
              </button>
            ))}
            <button
              onClick={() => props.onComplete(props.nextDay!.dia, props.nextDay!.enfoque, difficulty)}
              className="btn-primary ml-auto"
              disabled={props.busy?.startsWith("done-") ?? false}
            >
              ✓ Completar sesión
            </button>
          </div>
        </div>
      ) : (
        <div className="card border-brand-800 text-center">
          <p className="text-2xl">🏆</p>
          <p className="mt-2 font-semibold">¡Semana completada!</p>
          <p className="mt-1 text-sm text-zinc-400">
            Descansa, y si quieres subir el nivel, regenera tu plan: la IA usará tu feedback para progresar.
          </p>
          <button onClick={props.onGenerate} className="btn-primary mt-4" disabled={props.busy === "plan"}>
            {props.busy === "plan" ? "Adaptando tu plan…" : "🧠 Adaptar mi plan con IA"}
          </button>
        </div>
      )}

      <button onClick={props.goPlan} className="btn-secondary w-full">
        Ver el plan semanal completo →
      </button>
    </section>
  );
}

// ---------- Pestaña PLAN ----------

function PlanTab(props: {
  plan: Plan | null;
  hasProfile: boolean;
  busy: string | null;
  doneLabels: Set<string>;
  hasFeedback: boolean;
  onGenerate: () => void;
  onComplete: (day: string, focus: string, difficulty: string) => void;
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <button onClick={props.onGenerate} className="btn-primary" disabled={props.busy === "plan" || !props.hasProfile}>
          {props.busy === "plan"
            ? "La IA está diseñando tu plan…"
            : props.plan
              ? props.hasFeedback
                ? "🧠 Adaptar plan a mi progreso"
                : "Regenerar plan"
              : "Generar mi plan"}
        </button>
        {!props.hasProfile && <p className="text-sm text-zinc-400">Completa primero tu perfil.</p>}
        {props.plan && props.hasFeedback && (
          <p className="text-xs text-zinc-500">La IA usará tus sesiones marcadas como fácil/justo/difícil.</p>
        )}
      </div>

      {props.plan && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="mb-2 font-semibold text-brand-300">Resumen</h2>
            <p className="text-sm text-zinc-300">{props.plan.resumen}</p>
          </div>
          {props.plan.dias.map((dia) => (
            <DayCard key={dia.dia} dia={dia} done={props.doneLabels.has(dia.dia)} busy={props.busy} onComplete={props.onComplete} />
          ))}
          <div className="card">
            <h2 className="mb-2 font-semibold text-brand-300">Consejos</h2>
            <ul className="list-inside list-disc space-y-1 text-sm text-zinc-300">
              {props.plan.consejos.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

function DayCard(props: {
  dia: Plan["dias"][number];
  done: boolean;
  busy: string | null;
  onComplete: (day: string, focus: string, difficulty: string) => void;
}) {
  const [openExercise, setOpenExercise] = useState<string | null>(null);

  return (
    <div className={`card ${props.done ? "border-brand-800/70 opacity-80" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">
          {props.done ? "✅ " : ""}
          {props.dia.dia} <span className="text-sm font-normal text-brand-400">· {props.dia.enfoque}</span>
        </h3>
        {!props.done && (
          <div className="flex gap-1">
            {[
              ["facil", "😎"],
              ["justo", "💪"],
              ["dificil", "🥵"],
            ].map(([k, emoji]) => (
              <button
                key={k}
                title={`Completar (me resultó ${k})`}
                onClick={() => props.onComplete(props.dia.dia, props.dia.enfoque, k)}
                className="chip px-3"
                disabled={props.busy?.startsWith("done-") ?? false}
              >
                ✓ {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
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
            {props.dia.ejercicios.map((ej, i) => (
              <ExerciseRow key={i} ej={ej} open={openExercise === ej.nombre} onToggle={() => setOpenExercise(openExercise === ej.nombre ? null : ej.nombre)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExerciseRow(props: { ej: Exercise; open: boolean; onToggle: () => void }) {
  const [detail, setDetail] = useState<ExerciseDetail | null>(null);
  const [substitution, setSubstitution] = useState<{ alternativa: string; motivo: string } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function loadDetail() {
    props.onToggle();
    if (detail || props.open) return;
    setLoading("detail");
    try {
      const res = await fetch("/api/ai/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercise: props.ej.nombre, mode: "detail" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setDetail(data.detail);
    } finally {
      setLoading(null);
    }
  }

  async function loadSubstitute() {
    setLoading("sub");
    try {
      const res = await fetch("/api/ai/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercise: props.ej.nombre, mode: "substitute" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setSubstitution(data.substitution);
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <tr className="border-t border-zinc-800">
        <td className="py-2 pr-4">
          <button onClick={loadDetail} className="text-left font-medium text-zinc-100 underline decoration-zinc-600 underline-offset-4 hover:decoration-brand-400">
            {props.ej.nombre}
          </button>
        </td>
        <td className="py-2 pr-4">{props.ej.series}</td>
        <td className="py-2 pr-4">{props.ej.repeticiones}</td>
        <td className="py-2 pr-4">{props.ej.descansoSegundos} s</td>
        <td className="py-2 text-zinc-400">{props.ej.notas}</td>
      </tr>
      {props.open && (
        <tr className="border-t border-zinc-800/50 bg-zinc-900/50">
          <td colSpan={5} className="p-4">
            {loading === "detail" && <p className="text-sm text-zinc-400">La IA está preparando la ficha…</p>}
            {detail && (
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-brand-300">Músculos: <span className="font-normal text-zinc-300">{detail.musculos.join(", ")}</span></p>
                  <p className="mt-2 font-semibold text-brand-300">Técnica</p>
                  <ol className="mt-1 list-inside list-decimal space-y-1 text-zinc-300">
                    {detail.tecnica.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ol>
                </div>
                <div>
                  <p className="font-semibold text-brand-300">Errores comunes</p>
                  <ul className="mt-1 list-inside list-disc space-y-1 text-zinc-300">
                    {detail.errores.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-zinc-300">💡 {detail.consejo}</p>
                </div>
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button onClick={loadSubstitute} className="btn-secondary text-xs" disabled={loading === "sub"}>
                {loading === "sub" ? "Buscando alternativa…" : "🔄 Sustituir este ejercicio"}
              </button>
              {substitution && (
                <span className="text-sm text-brand-300">
                  Alternativa: <strong>{substitution.alternativa}</strong>{" "}
                  <span className="text-zinc-400">— {substitution.motivo}</span>
                </span>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ---------- Pestaña EJERCICIOS (biblioteca) ----------

function LibraryTab(props: { plan: Plan | null }) {
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planExercises = useMemo(() => {
    const names = new Set<string>();
    props.plan?.dias.forEach((d) => d.ejercicios.forEach((e) => names.add(e.nombre)));
    return Array.from(names);
  }, [props.plan]);

  async function search(name: string) {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    setDetail(null);
    try {
      const res = await fetch("/api/ai/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercise: name.trim(), mode: "detail" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No se pudo cargar la ficha.");
        return;
      }
      setDetail(data.detail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          search(query);
        }}
        className="flex gap-2"
      >
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca cualquier ejercicio: sentadilla búlgara, remo con mancuerna…"
        />
        <button className="btn-primary" disabled={loading || !query.trim()}>
          Buscar
        </button>
      </form>

      {planExercises.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">De tu plan actual</p>
          <div className="flex flex-wrap gap-2">
            {planExercises.map((name) => (
              <button key={name} onClick={() => { setQuery(name); search(name); }} className="chip">
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-zinc-400">La IA está preparando la ficha del ejercicio…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {detail && (
        <div className="card">
          <h2 className="text-lg font-bold">{detail.nombre}</h2>
          <p className="mt-1 text-sm text-brand-300">{detail.musculos.join(" · ")}</p>
          <div className="mt-4 grid gap-6 text-sm sm:grid-cols-2">
            <div>
              <p className="font-semibold text-brand-300">Técnica paso a paso</p>
              <ol className="mt-2 list-inside list-decimal space-y-1 text-zinc-300">
                {detail.tecnica.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ol>
            </div>
            <div>
              <p className="font-semibold text-brand-300">Errores comunes</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-300">
                {detail.errores.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
              <p className="mt-4 rounded-lg border border-brand-900 bg-brand-950/50 p-3 text-zinc-200">💡 {detail.consejo}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ---------- Pestaña PROGRESO ----------

function ProgressTab(props: {
  progress: ProgressRow[];
  workouts: Workout[];
  onAdd: (e: ProgressRow) => void;
  setNotice: (s: string) => void;
}) {
  const [kind, setKind] = useState<"peso_corporal" | "ejercicio">("peso_corporal");
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [reps, setReps] = useState("");
  const [saving, setSaving] = useState(false);

  const bodyWeights = props.progress.filter((p) => p.kind === "peso_corporal");
  const exerciseMarks = props.progress.filter((p) => p.kind === "ejercicio").slice(-15).reverse();

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, label: kind === "ejercicio" ? label : undefined, value, reps }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        props.setNotice(data.error ?? "No se pudo guardar.");
        return;
      }
      props.onAdd(data.entry);
      setValue("");
      setReps("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <form onSubmit={add} className="card space-y-4">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setKind("peso_corporal")} className={`chip ${kind === "peso_corporal" ? "chip-active" : ""}`}>
            ⚖️ Peso corporal
          </button>
          <button type="button" onClick={() => setKind("ejercicio")} className={`chip ${kind === "ejercicio" ? "chip-active" : ""}`}>
            🏋️ Marca en ejercicio
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {kind === "ejercicio" && (
            <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ejercicio (ej. press banca)" required />
          )}
          <input
            className="input"
            type="number"
            step="0.1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={kind === "peso_corporal" ? "Peso (kg)" : "Carga (kg)"}
            required
          />
          {kind === "ejercicio" && (
            <input className="input" type="number" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="Repeticiones" />
          )}
        </div>
        <button className="btn-primary" disabled={saving}>
          {saving ? "Guardando…" : "Añadir registro"}
        </button>
      </form>

      {bodyWeights.length >= 2 && (
        <div className="card">
          <h2 className="mb-1 font-semibold text-brand-300">Peso corporal</h2>
          <p className="mb-3 text-xs text-zinc-500">
            {bodyWeights[0].value} kg → {bodyWeights[bodyWeights.length - 1].value} kg (
            {(bodyWeights[bodyWeights.length - 1].value - bodyWeights[0].value).toFixed(1)} kg)
          </p>
          <WeightChart points={bodyWeights.map((b) => b.value)} />
        </div>
      )}

      {exerciseMarks.length > 0 && (
        <div className="card">
          <h2 className="mb-3 font-semibold text-brand-300">Últimas marcas</h2>
          <ul className="space-y-2 text-sm">
            {exerciseMarks.map((m) => (
              <li key={m.id} className="flex items-baseline justify-between border-b border-zinc-800/60 pb-2">
                <span className="font-medium">{m.label}</span>
                <span className="text-zinc-300">
                  {m.value} kg{m.reps ? ` × ${m.reps}` : ""}{" "}
                  <span className="text-xs text-zinc-500">{new Date(m.createdAt).toLocaleDateString()}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {props.workouts.length > 0 && (
        <div className="card">
          <h2 className="mb-3 font-semibold text-brand-300">Historial de sesiones</h2>
          <ul className="space-y-2 text-sm">
            {props.workouts.slice(0, 10).map((w) => (
              <li key={w.id} className="flex items-baseline justify-between border-b border-zinc-800/60 pb-2">
                <span>
                  ✅ {w.dayLabel} {w.focus && <span className="text-zinc-500">· {w.focus}</span>}
                </span>
                <span className="text-xs text-zinc-500">
                  {{ facil: "😎 fácil", justo: "💪 justo", dificil: "🥵 difícil" }[w.difficulty] ?? w.difficulty} ·{" "}
                  {new Date(w.completedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {props.progress.length === 0 && props.workouts.length === 0 && (
        <p className="text-center text-sm text-zinc-500">
          Aún no hay registros. Completa sesiones y apunta tu peso para ver tu evolución aquí. 📈
        </p>
      )}
    </section>
  );
}

/** Gráfica de líneas minimalista en SVG (sin dependencias). */
function WeightChart(props: { points: number[] }) {
  const w = 600;
  const h = 120;
  const pad = 8;
  const min = Math.min(...props.points);
  const max = Math.max(...props.points);
  const range = max - min || 1;
  const coords = props.points.map((p, i) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(1, props.points.length - 1);
    const y = h - pad - ((p - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Evolución del peso corporal">
      <polyline points={coords.join(" ")} fill="none" stroke="#4fb789" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => {
        const [x, y] = c.split(",").map(Number);
        return <circle key={i} cx={x} cy={y} r="4" fill="#2c9c6e" />;
      })}
    </svg>
  );
}

// ---------- Pestaña PERFIL (onboarding tipo cuestionario) ----------

function ProfileTab(props: {
  profile: ProfileForm;
  setProfile: (p: ProfileForm) => void;
  busy: string | null;
  onSave: (e: React.FormEvent) => void;
  isNew: boolean;
}) {
  const p = props.profile;
  const set = (patch: Partial<ProfileForm>) => props.setProfile({ ...p, ...patch });

  const FOCUS = ["pecho", "espalda", "piernas", "glúteos", "brazos", "core", "cardio"];
  const selectedFocus = new Set(
    p.focusAreas
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  function toggleFocus(area: string) {
    const next = new Set(selectedFocus);
    if (next.has(area)) next.delete(area);
    else next.add(area);
    set({ focusAreas: Array.from(next).join(", ") });
  }

  return (
    <form onSubmit={props.onSave} className="card max-w-3xl space-y-6">
      {props.isNew && (
        <p className="rounded-lg border border-brand-900 bg-brand-950/50 p-3 text-sm text-brand-200">
          Cuanto mejor te conozca la IA, mejor será tu plan. Solo te llevará un minuto. ⏱️
        </p>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold text-zinc-200">1 · ¿Cuál es tu objetivo?</p>
        <div className="flex flex-wrap gap-2">
          {["perder grasa", "ganar músculo", "mejorar resistencia", "fuerza general", "mantenerme en forma"].map((g) => (
            <button type="button" key={g} onClick={() => set({ goal: g })} className={`chip ${p.goal === g ? "chip-active" : ""}`}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-zinc-200">2 · ¿Tu nivel?</p>
        <div className="flex flex-wrap gap-2">
          {["principiante", "intermedio", "avanzado"].map((l) => (
            <button type="button" key={l} onClick={() => set({ level: l })} className={`chip ${p.level === l ? "chip-active" : ""}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-zinc-200">3 · ¿Cuántos días por semana?</p>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button type="button" key={n} onClick={() => set({ daysPerWeek: n })} className={`chip ${p.daysPerWeek === n ? "chip-active" : ""}`}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-zinc-200">4 · ¿Cuánto tiempo por sesión?</p>
        <div className="flex flex-wrap gap-2">
          {["30", "45", "60", "90"].map((m) => (
            <button type="button" key={m} onClick={() => set({ sessionMins: m })} className={`chip ${p.sessionMins === m ? "chip-active" : ""}`}>
              {m} min
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-zinc-200">5 · ¿Con qué material cuentas?</p>
        <div className="flex flex-wrap gap-2">
          {["gimnasio completo", "mancuernas y bandas en casa", "sin material (peso corporal)"].map((eq) => (
            <button type="button" key={eq} onClick={() => set({ equipment: eq })} className={`chip ${p.equipment === eq ? "chip-active" : ""}`}>
              {eq}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-zinc-200">
          6 · ¿Zonas prioritarias? <span className="font-normal text-zinc-500">(opcional, varias)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {FOCUS.map((f) => (
            <button type="button" key={f} onClick={() => toggleFocus(f)} className={`chip ${selectedFocus.has(f) ? "chip-active" : ""}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-300">Sexo (opcional)</label>
          <select className="input" value={p.sex} onChange={(e) => set({ sex: e.target.value })}>
            <option value="">—</option>
            <option>hombre</option>
            <option>mujer</option>
            <option>otro</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-300">Edad</label>
          <input className="input" type="number" value={p.age} onChange={(e) => set({ age: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-300">Peso (kg)</label>
          <input className="input" type="number" step="0.1" value={p.weightKg} onChange={(e) => set({ weightKg: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-300">Altura (cm)</label>
          <input className="input" type="number" value={p.heightCm} onChange={(e) => set({ heightCm: e.target.value })} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-zinc-300">Lesiones o limitaciones (opcional)</label>
        <textarea
          className="input"
          rows={2}
          value={p.injuries}
          onChange={(e) => set({ injuries: e.target.value })}
          placeholder="Ej.: molestias en la rodilla derecha"
        />
      </div>

      <button className="btn-primary w-full py-3" disabled={props.busy === "perfil"}>
        {props.busy === "perfil" ? "Guardando…" : props.isNew ? "Guardar y diseñar mi plan 🚀" : "Guardar cambios"}
      </button>
    </form>
  );
}
