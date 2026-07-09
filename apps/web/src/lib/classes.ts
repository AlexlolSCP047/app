// Clases guiadas por tiempo (sin material o material mínimo), para casa.
// Cada ejercicio se hace durante `segundos` y va seguido de `descanso` segundos.

export type ClassExercise = { nombre: string; segundos: number; descanso: number };

export type GuidedClass = {
  id: string;
  emoji: string;
  nombre: string;
  nivel: "principiante" | "intermedio" | "avanzado";
  minutos: number;
  descripcion: string;
  ejercicios: ClassExercise[];
};

export const GUIDED_CLASSES: GuidedClass[] = [
  {
    id: "core-express",
    emoji: "🔥",
    nombre: "Core Express",
    nivel: "principiante",
    minutos: 12,
    descripcion: "Abdomen y zona media en 12 minutos, sin material.",
    ejercicios: [
      { nombre: "Plancha frontal", segundos: 30, descanso: 15 },
      { nombre: "Crunch abdominal", segundos: 40, descanso: 15 },
      { nombre: "Plancha lateral (izquierda)", segundos: 25, descanso: 10 },
      { nombre: "Plancha lateral (derecha)", segundos: 25, descanso: 15 },
      { nombre: "Elevaciones de piernas", segundos: 40, descanso: 15 },
      { nombre: "Mountain climbers", segundos: 30, descanso: 15 },
      { nombre: "Puente de glúteos", segundos: 40, descanso: 15 },
      { nombre: "Plancha frontal (final)", segundos: 40, descanso: 0 },
    ],
  },
  {
    id: "fullbody-casa",
    emoji: "🏠",
    nombre: "Full Body en casa",
    nivel: "principiante",
    minutos: 20,
    descripcion: "Cuerpo completo con tu peso corporal: piernas, empuje, tracción y core.",
    ejercicios: [
      { nombre: "Sentadillas", segundos: 45, descanso: 20 },
      { nombre: "Flexiones (de rodillas si hace falta)", segundos: 40, descanso: 20 },
      { nombre: "Zancadas alternas", segundos: 45, descanso: 20 },
      { nombre: "Remo invertido con mesa o toalla", segundos: 40, descanso: 20 },
      { nombre: "Puente de glúteos", segundos: 45, descanso: 20 },
      { nombre: "Plancha frontal", segundos: 40, descanso: 20 },
      { nombre: "Sentadillas (2ª ronda)", segundos: 45, descanso: 20 },
      { nombre: "Flexiones (2ª ronda)", segundos: 40, descanso: 20 },
      { nombre: "Zancadas alternas (2ª ronda)", segundos: 45, descanso: 20 },
      { nombre: "Plancha con toques de hombro", segundos: 40, descanso: 0 },
    ],
  },
  {
    id: "hiit-quemagrasa",
    emoji: "⚡",
    nombre: "HIIT Quemagrasa",
    nivel: "intermedio",
    minutos: 15,
    descripcion: "Intervalos de alta intensidad para disparar el gasto calórico.",
    ejercicios: [
      { nombre: "Jumping jacks", segundos: 40, descanso: 20 },
      { nombre: "Sentadilla con salto", segundos: 30, descanso: 20 },
      { nombre: "Burpees", segundos: 30, descanso: 25 },
      { nombre: "Mountain climbers rápidos", segundos: 40, descanso: 20 },
      { nombre: "Skips en el sitio (rodillas altas)", segundos: 40, descanso: 20 },
      { nombre: "Burpees (2ª ronda)", segundos: 30, descanso: 25 },
      { nombre: "Sentadilla con salto (2ª ronda)", segundos: 30, descanso: 20 },
      { nombre: "Sprint en el sitio (final)", segundos: 30, descanso: 0 },
    ],
  },
  {
    id: "gluteos-piernas",
    emoji: "🍑",
    nombre: "Glúteos y piernas",
    nivel: "intermedio",
    minutos: 15,
    descripcion: "Sesión enfocada al tren inferior, ideal 2-3 veces por semana.",
    ejercicios: [
      { nombre: "Sentadillas profundas", segundos: 45, descanso: 20 },
      { nombre: "Puente de glúteos a una pierna (izq.)", segundos: 30, descanso: 10 },
      { nombre: "Puente de glúteos a una pierna (dcha.)", segundos: 30, descanso: 20 },
      { nombre: "Zancada inversa alterna", segundos: 45, descanso: 20 },
      { nombre: "Patada de glúteo (izq.)", segundos: 30, descanso: 10 },
      { nombre: "Patada de glúteo (dcha.)", segundos: 30, descanso: 20 },
      { nombre: "Sentadilla isométrica en pared", segundos: 40, descanso: 20 },
      { nombre: "Puente de glúteos con pausa", segundos: 45, descanso: 0 },
    ],
  },
  {
    id: "movilidad-manana",
    emoji: "🌅",
    nombre: "Movilidad de buenos días",
    nivel: "principiante",
    minutos: 10,
    descripcion: "Despierta articulaciones y espalda; perfecta antes de entrenar o al levantarte.",
    ejercicios: [
      { nombre: "Círculos de cuello y hombros", segundos: 40, descanso: 10 },
      { nombre: "Gato-camello", segundos: 45, descanso: 10 },
      { nombre: "Rotaciones de cadera", segundos: 40, descanso: 10 },
      { nombre: "Zancada con rotación torácica", segundos: 45, descanso: 10 },
      { nombre: "Perro boca abajo a cobra", segundos: 45, descanso: 10 },
      { nombre: "Sentadilla profunda mantenida", segundos: 40, descanso: 0 },
    ],
  },
  {
    id: "estiramientos-noche",
    emoji: "🌙",
    nombre: "Estiramientos para descansar",
    nivel: "principiante",
    minutos: 10,
    descripcion: "Relaja la musculatura al final del día y mejora tu descanso.",
    ejercicios: [
      { nombre: "Estiramiento de isquios sentado", segundos: 45, descanso: 10 },
      { nombre: "Estiramiento de cuádriceps (izq.)", segundos: 30, descanso: 5 },
      { nombre: "Estiramiento de cuádriceps (dcha.)", segundos: 30, descanso: 10 },
      { nombre: "Postura del niño", segundos: 45, descanso: 10 },
      { nombre: "Torsión espinal tumbado (izq.)", segundos: 30, descanso: 5 },
      { nombre: "Torsión espinal tumbado (dcha.)", segundos: 30, descanso: 10 },
      { nombre: "Respiración profunda tumbado", segundos: 60, descanso: 0 },
    ],
  },
];

/**
 * Vídeo demostrativo del ejercicio. De momento enlaza a una búsqueda curada de
 * YouTube; cuando generemos los clips propios (Seedance), bastará devolver aquí
 * la URL del vídeo alojado y toda la interfaz los usará automáticamente.
 */
export function exerciseVideoUrl(nombre: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`cómo hacer ${nombre} técnica correcta`)}`;
}
