import nodemailer from "nodemailer";

/**
 * Envío de correos transaccionales. Se configura con UNA de estas opciones
 * (variables de entorno en Vercel):
 *
 *  A) RESEND_API_KEY (+ EMAIL_FROM con dominio verificado en resend.com)
 *  B) SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS — p. ej. Gmail con
 *     "contraseña de aplicación" (SMTP_HOST=smtp.gmail.com, SMTP_PORT=587)
 *
 * Sin configuración, el correo no se envía y el enlace se imprime en el log
 * del servidor (útil en desarrollo).
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<boolean> {
  const from =
    process.env.EMAIL_FROM ??
    (process.env.SMTP_USER ? `FitCoach IA <${process.env.SMTP_USER}>` : "FitCoach IA <no-reply@fitcoach.app>");

  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: input.to, subject: input.subject, text: input.text, html: input.html }),
    });
    return res.ok;
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({ from, to: input.to, subject: input.subject, text: input.text, html: input.html });
    return true;
  }

  console.warn(`[email] Sin proveedor de correo configurado. Para ${input.to}: ${input.text}`);
  return false;
}
