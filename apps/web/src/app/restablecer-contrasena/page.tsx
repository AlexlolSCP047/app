"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function RestablecerForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No se pudo actualizar la contraseña.");
        return;
      }
      setDone(true);
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="card w-full max-w-md text-center">
        <p className="text-sm text-zinc-300">
          Este enlace no es válido. Pide uno nuevo desde{" "}
          <Link href="/olvide-contrasena" className="text-brand-400 hover:underline">
            «Olvidé mi contraseña»
          </Link>
          .
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card w-full max-w-md text-center">
        <p className="text-3xl">✅</p>
        <h1 className="mt-3 text-xl font-bold">Contraseña actualizada</h1>
        <p className="mt-2 text-sm text-zinc-400">Ya puedes entrar con tu nueva contraseña.</p>
        <Link href="/login" className="btn-primary mt-6 inline-block px-8 py-3">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="card w-full max-w-md">
      <h1 className="text-2xl font-bold">Elige tu nueva contraseña</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-300">Nueva contraseña</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-300">Repite la contraseña</label>
          <input
            className="input"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="La misma contraseña"
            minLength={8}
            required
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="btn-primary w-full py-3" disabled={loading}>
          {loading ? "Guardando…" : "Guardar nueva contraseña"}
        </button>
      </form>
    </div>
  );
}

export default function RestablecerContrasenaPage() {
  return (
    <main className="app-bg flex min-h-screen items-center justify-center px-6">
      <Suspense>
        <RestablecerForm />
      </Suspense>
    </main>
  );
}
