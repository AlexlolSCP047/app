import Link from "next/link";

const features = [
  {
    icon: "🧠",
    title: "Plan que se adapta a ti",
    text: "Marca cada sesión como fácil, justa o difícil y la IA ajusta tu siguiente semana: más carga cuando puedes, más descanso cuando lo necesitas.",
  },
  {
    icon: "📅",
    title: "Tu semana, organizada",
    text: "Ve de un vistazo qué toca hoy, completa sesiones con un toque y mantén tu racha semana tras semana.",
  },
  {
    icon: "📖",
    title: "Biblioteca de ejercicios",
    text: "Técnica paso a paso, músculos implicados y errores comunes de cualquier ejercicio. ¿No puedes hacer uno? La IA te da un sustituto al instante.",
  },
  {
    icon: "📈",
    title: "Progreso visible",
    text: "Registra tu peso y tus marcas para ver tu evolución en gráficas. Nada motiva más que ver la curva bajar (o la barra subir).",
  },
  {
    icon: "💬",
    title: "Chat con tu entrenador",
    text: "Resuelve dudas de técnica, nutrición o motivación hablando con la IA, disponible 24/7.",
  },
  {
    icon: "📱",
    title: "Web + móvil",
    text: "Entrena desde el navegador o desde la app para Android e iOS con la misma cuenta.",
  },
];

export default function LandingPage() {
  return (
    <main className="app-bg min-h-screen">
      {/* Barra de navegación */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-bold">
          Fit<span className="text-brand-400">Coach</span> IA
        </span>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary">
            Entrar
          </Link>
          <Link href="/registro" className="btn-primary">
            Prueba gratis
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 text-center">
        <p className="mb-4 inline-block rounded-full border border-brand-700 bg-brand-950 px-4 py-1 text-xs font-medium text-brand-300">
          7 días de prueba gratis · sin permanencia · cancela cuando quieras
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight sm:text-6xl">
          Tu entrenador personal con <span className="text-brand-400">inteligencia artificial</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          Cuéntale tu objetivo y tu material disponible. FitCoach IA diseña tu plan semanal de
          entrenamiento y te acompaña por chat como lo haría un entrenador de verdad.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link href="/registro" className="btn-primary px-8 py-3 text-base">
            Empezar mi prueba gratuita
          </Link>
        </div>
      </section>

      {/* Características */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card">
              <div className="mb-3 text-2xl">{f.icon}</div>
              <h3 className="mb-2 font-semibold text-brand-300">{f.title}</h3>
              <p className="text-sm text-zinc-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Precios */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-10 text-center text-3xl font-bold">Un precio simple</h2>
        <div className="mx-auto max-w-md">
          <div className="card border-brand-700 text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-brand-400">Plan Pro</p>
            <p className="mt-4 text-5xl font-extrabold">
              9,99 € <span className="text-base font-medium text-zinc-400">/ mes</span>
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              o el equivalente en tu moneda local, calculado al pagar
            </p>
            <ul className="mt-6 space-y-2 text-left text-sm text-zinc-300">
              <li>✓ 7 días de prueba totalmente gratis</li>
              <li>✓ No se cobra nada hasta el día 8</li>
              <li>✓ Planes semanales que se adaptan a tu feedback</li>
              <li>✓ Biblioteca de ejercicios y gráficas de progreso</li>
              <li>✓ Chat ilimitado con tu entrenador IA</li>
              <li>✓ App para Android e iOS incluida</li>
              <li>✓ Cancela cuando quieras desde tu panel</li>
            </ul>
            <Link href="/registro" className="btn-primary mt-8 w-full py-3">
              Probar 7 días gratis
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-900 py-8 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} FitCoach IA · La información generada no sustituye el consejo
        médico profesional.
      </footer>
    </main>
  );
}
