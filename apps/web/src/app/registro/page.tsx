"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function RegistroForm() {
  const router = useRouter();
  const plan = useSearchParams().get("plan") === "basico" ? "basico" : "pro";
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear la cuenta.");
        return;
      }
      // Cuenta creada: se abre Stripe para registrar la tarjeta y activar
      // el día de prueba (sin cobro hasta el segundo día).
      const checkout = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const checkoutData = await checkout.json().catch(() => ({}));
      if (checkout.ok && checkoutData.url) {
        window.location.href = checkoutData.url;
        return;
      }
      router.push("/panel");
      router.refresh();
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold">Crea tu cuenta</h1>
        <p className="mt-1 text-xs text-brand-400">
          Plan elegido: {plan === "basico" ? "Básico — 9,99 €/mes" : "Pro — 14,99 €/mes"}
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          1 día de prueba gratis. Te pediremos la tarjeta: no se cobra nada hasta el segundo día
          y puedes cancelar antes sin coste.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Nombre</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tu nombre"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Correo electrónico</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="tu@correo.com"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Contraseña</label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-300">
              Teléfono <span className="text-zinc-500">(opcional)</span>
            </label>
            <input
              className="input"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+34 600 000 000"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button className="btn-primary w-full py-3" disabled={loading}>
            {loading ? "Creando cuenta…" : "Crear cuenta y empezar mi día gratis"}
          </button>
          <p className="text-center text-xs text-zinc-500">
            Al crear tu cuenta aceptas nuestra{" "}
            <Link href="/privacidad" className="text-brand-400 hover:underline">
              política de privacidad
            </Link>
            .
          </p>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-brand-400 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function RegistroPage() {
  return (
    <Suspense>
      <RegistroForm />
    </Suspense>
  );
}
