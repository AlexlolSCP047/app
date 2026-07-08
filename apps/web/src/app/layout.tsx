import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitCoach IA — Tu entrenador personal con inteligencia artificial",
  description:
    "Planes de entrenamiento personalizados generados por IA. Prueba gratis 7 días y después 9,99 €/mes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
