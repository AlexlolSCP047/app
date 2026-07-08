"use client";

import Link from "next/link";
import { useState } from "react";

export default function OlvideContrasenaPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No se pudo enviar el correo. Inténtalo de nuevo.");
        return;
      }
      setMessage(data.message);
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-bg flex min-h-screen items-center justify-center px-6">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold">¿Olvidaste tu contraseña?</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Escribe el correo de tu cuenta y te enviaremos un enlace para elegir una nueva.
        </p>
        {message ? (
          <div className="mt-6 rounded-lg border border-brand-800 bg-brand-950/40 px-4 py-3 text-sm text-brand-300">
            📬 {message} Revisa también la carpeta de spam.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-zinc-300">Correo electrónico</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button className="btn-primary w-full py-3" disabled={loading}>
              {loading ? "Enviando…" : "Enviarme el enlace"}
            </button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-zinc-400">
          <Link href="/login" className="text-brand-400 hover:underline">
            ← Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
