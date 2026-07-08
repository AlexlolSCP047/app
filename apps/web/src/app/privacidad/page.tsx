import Link from "next/link";

export const metadata = {
  title: "Política de privacidad — FitCoach IA",
  description: "Cómo tratamos tus datos en FitCoach IA.",
};

/** Página informativa exigida por el RGPD y por Google Play. */
export default function PrivacidadPage() {
  return (
    <main className="app-bg min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-bold">
          Fit<span className="text-brand-400">Coach</span> IA
        </Link>
        <Link href="/" className="btn-secondary">
          Volver
        </Link>
      </header>

      <article className="mx-auto max-w-3xl space-y-8 px-6 pb-24 pt-6 text-sm leading-relaxed text-zinc-300">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-100">Política de privacidad</h1>
          <p className="mt-2 text-zinc-500">Última actualización: 8 de julio de 2026</p>
          <p className="mt-4">
            Esta política explica qué datos recogemos en <strong>FitCoach IA</strong> (la web y la
            aplicación para Android e iOS), para qué los usamos y qué derechos tienes sobre ellos.
          </p>
        </div>

        <section>
          <h2 className="mb-2 text-xl font-bold text-zinc-100">1. Responsable</h2>
          <p>
            FitCoach IA. Contacto para cualquier cuestión de privacidad:{" "}
            <a href="mailto:coredalex44@gmail.com" className="text-brand-400 hover:underline">
              coredalex44@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold text-zinc-100">2. Qué datos recogemos</h2>
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong>Datos de cuenta:</strong> nombre, correo electrónico, teléfono (opcional) y tu
              contraseña, que guardamos únicamente como <em>hash</em> cifrado irreversible — nunca en
              texto legible.
            </li>
            <li>
              <strong>Perfil de entrenamiento (lo rellenas tú, de forma voluntaria):</strong>{" "}
              objetivo, nivel, días y duración de sesión, material disponible, zonas a priorizar y,
              opcionalmente, lesiones, sexo, edad, peso y altura.
            </li>
            <li>
              <strong>Tu actividad en la app:</strong> planes generados, sesiones completadas y cómo
              te resultaron, registros de peso y marcas, y los mensajes que intercambias con el
              entrenador de IA.
            </li>
            <li>
              <strong>Datos de pago:</strong> el pago lo procesa <strong>Stripe</strong>. Los datos de
              tu tarjeta van directamente a Stripe: <em>nunca</em> llegan a nuestros servidores ni los
              almacenamos. Nosotros solo guardamos tu identificador de cliente y el estado de tu
              suscripción.
            </li>
            <li>
              <strong>Cookies:</strong> usamos una única cookie esencial de sesión para mantenerte
              conectado. No usamos cookies de publicidad ni de seguimiento.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold text-zinc-100">3. Para qué los usamos</h2>
          <ul className="list-inside list-disc space-y-2">
            <li>Prestarte el servicio: generar tus planes, adaptarlos a tu progreso y responder en el chat.</li>
            <li>Gestionar tu cuenta, tu prueba gratuita y tu suscripción.</li>
            <li>Atender tus solicitudes de soporte.</li>
          </ul>
          <p className="mt-2">
            <strong>No vendemos tus datos</strong> ni los usamos para publicidad de terceros. Base
            legal: la ejecución del contrato contigo (art. 6.1.b RGPD) y tu consentimiento para los
            datos opcionales de salud, como lesiones o peso (art. 9.2.a RGPD), que puedes retirar
            borrándolos de tu perfil o eliminando tu cuenta.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold text-zinc-100">4. Con quién los compartimos</h2>
          <p>Trabajamos con proveedores que tratan datos por encargo nuestro:</p>
          <ul className="mt-2 list-inside list-disc space-y-2">
            <li><strong>Vercel</strong> — alojamiento de la web y la API.</li>
            <li><strong>Neon</strong> — base de datos.</li>
            <li><strong>Stripe</strong> — pagos y facturación.</li>
            <li>
              <strong>Proveedores de IA</strong> (actualmente Cerebras) — procesan tu perfil de
              entrenamiento y tus mensajes exclusivamente para generar tus planes y respuestas.
            </li>
          </ul>
          <p className="mt-2">
            Solo compartiríamos datos con autoridades si una obligación legal nos lo exigiera.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold text-zinc-100">5. Cuánto tiempo los conservamos</h2>
          <p>
            Mientras tu cuenta exista. Si la eliminas, borramos tu perfil, planes, sesiones,
            progreso y conversaciones de forma definitiva. Stripe conserva los registros de
            facturación durante los plazos que exige la normativa fiscal.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold text-zinc-100">6. Tus derechos</h2>
          <p>
            Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, supresión,
            oposición, limitación y portabilidad escribiendo a{" "}
            <a href="mailto:coredalex44@gmail.com" className="text-brand-400 hover:underline">
              coredalex44@gmail.com
            </a>
            . También tienes derecho a reclamar ante la Agencia Española de Protección de Datos
            (aepd.es).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold text-zinc-100">7. Eliminar tu cuenta</h2>
          <p>
            Puedes borrar tu cuenta y todos tus datos tú mismo desde{" "}
            <Link href="/eliminar-cuenta" className="text-brand-400 hover:underline">
              esta página
            </Link>{" "}
            (también disponible desde la app), o pedírnoslo por correo. El borrado es inmediato e
            irreversible, y cancela automáticamente tu suscripción si está activa.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold text-zinc-100">8. Menores de edad</h2>
          <p>
            FitCoach IA está dirigida a mayores de 18 años. No recogemos datos de menores de forma
            deliberada; si detectamos una cuenta de un menor, la eliminaremos.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold text-zinc-100">9. Cambios en esta política</h2>
          <p>
            Si cambiamos esta política, publicaremos aquí la nueva versión con su fecha. Si el
            cambio fuera importante, te avisaremos dentro de la app o por correo.
          </p>
        </section>

        <p className="border-t border-zinc-800 pt-6 text-zinc-500">
          ⚠️ Recuerda: la información generada por la IA no sustituye el consejo de un médico o
          profesional sanitario.
        </p>
      </article>
    </main>
  );
}
