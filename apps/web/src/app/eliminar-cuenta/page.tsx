"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Borrado de cuenta en autoservicio (requisito de Google Play y RGPD). */
export default function EliminarCuentaPage() {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setError("Primero inicia sesión con la cuenta que quieres eliminar.");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "No se pudo eliminar la cuenta. Inténtalo de nuevo.");
        return;
      }
      setDone(true);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 4000);
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-bg flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-bold">
          Fit<span className="text-brand-400">Coach</span> IA
        </Link>
        <Link href="/" className="btn-secondary">
          Volver
        </Link>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
        {done ? (
          <div className="card text-center">
            <p className="text-3xl">👋</p>
            <h1 className="mt-3 text-xl font-bold">Cuenta eliminada</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Hemos borrado tu cuenta y todos tus datos, y cancelado tu suscripción si estaba
              activa. Gracias por probar FitCoach IA.
            </p>
          </div>
        ) : (
          <div className="card">
            <h1 className="text-2xl font-bold">Eliminar mi cuenta</h1>
            <p className="mt-3 text-sm text-zinc-400">
              Esto borra de forma <strong className="text-zinc-200">inmediata e irreversible</strong>:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-400">
              <li>Tu cuenta (nombre, correo y acceso)</li>
              <li>Tu perfil de entrenamiento y tus planes</li>
              <li>Tus sesiones, progreso y conversaciones con la IA</li>
            </ul>
            <p className="mt-3 text-sm text-zinc-400">
              Si tienes una suscripción activa, se <strong className="text-zinc-200">cancela automáticamente</strong>{" "}
              y no se te vuelve a cobrar.
            </p>

            <p className="mt-6 text-sm text-zinc-300">
              Para confirmar, escribe <strong>ELIMINAR</strong>:
            </p>
            <input
              className="input mt-2"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="ELIMINAR"
            />

            {error && (
              <p className="mt-3 text-sm text-amber-300">
                {error}{" "}
                {error.includes("inicia sesión") && (
                  <Link href="/login" className="text-brand-400 underline">
                    Ir a iniciar sesión
                  </Link>
                )}
              </p>
            )}

            <button
              onClick={onDelete}
              disabled={confirmText.trim().toUpperCase() !== "ELIMINAR" || busy}
              className="mt-5 w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "Eliminando…" : "Eliminar mi cuenta definitivamente"}
            </button>
            <p className="mt-4 text-xs text-zinc-500">
              ¿Prefieres pedirlo por correo? Escríbenos a coredalex44@gmail.com desde el correo de tu
              cuenta. Más información en la{" "}
              <Link href="/privacidad" className="text-brand-400 hover:underline">
                política de privacidad
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
