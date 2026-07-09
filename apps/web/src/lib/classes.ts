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
 * Los clips demostrativos (generados con IA vía Higgsfield) viven en el propio
 * repositorio, en `apps/web/public/videos/ejercicios/`, y se sirven como
 * archivos estáticos desde la web desplegada; la app móvil usa la misma URL
 * absoluta. El archivo de cada ejercicio es su clave normalizada con guiones:
 * "press de banca" → press-de-banca.mp4.
 */
const VIDEO_BASE = "https://app-jbst.vercel.app/videos/ejercicios";

/** Ejercicios con clip propio (clave normalizada con `normalizeExerciseName`). */
const EXERCISE_VIDEO_KEYS = new Set([
  "sentadillas",
  "plancha frontal",
  "plancha lateral",
  "plancha con toques de hombro",
  "crunch abdominal",
  "elevaciones de piernas",
  "mountain climbers",
  "puente de gluteos",
  "puente de gluteos a una pierna",
  "sentadilla con salto",
  "sentadilla isometrica en pared",
  "sentadilla profunda mantenida",
  "flexiones",
  "zancadas alternas",
  "zancada inversa alterna",
  "zancada con rotacion toracica",
  "remo invertido con mesa o toalla",
  "jumping jacks",
  "burpees",
  "skips en el sitio",
  "sprint en el sitio",
  "patada de gluteo",
  "circulos de cuello y hombros",
  "gato camello",
  "rotaciones de cadera",
  "perro boca abajo a cobra",
  "estiramiento de isquios sentado",
  "estiramiento de cuadriceps",
  "postura del nino",
  "torsion espinal tumbado",
  "respiracion profunda tumbado",
  "press de banca",
  "press de banca con mancuernas",
  "press inclinado con mancuernas",
  "press militar",
  "press de hombros con mancuernas",
  "elevaciones laterales",
  "fondos en paralelas",
  "fondos de triceps en banco",
  "extension de triceps con mancuerna",
  "dominadas",
  "jalon al pecho",
  "remo en polea baja",
  "remo con mancuerna",
  "face pull",
  "curl de biceps con mancuernas",
  "curl martillo",
  "curl de biceps con barra",
  "sentadilla con barra",
  "sentadilla goblet",
  "sentadilla bulgara",
  "peso muerto",
  "peso muerto rumano",
  "prensa de piernas",
  "zancadas con mancuernas",
  "abdominales bicicleta",
  "russian twist",
  "remo con barra",
  "hip thrust",
  "elevaciones de gemelos",
  "bird dog",
  "superman",
]);

/** Variantes y sinónimos que comparten clip con un ejercicio de la lista. */
const EXERCISE_VIDEO_ALIASES: Record<string, string> = {
  "sentadilla": "sentadillas",
  "sentadillas profundas": "sentadillas",
  "sentadillas con salto": "sentadilla con salto",
  "sentadilla isometrica": "sentadilla isometrica en pared",
  "wall sit": "sentadilla isometrica en pared",
  "plancha": "plancha frontal",
  "plancha abdominal": "plancha frontal",
  "mountain climbers rapidos": "mountain climbers",
  "escaladores": "mountain climbers",
  "puente de gluteo": "puente de gluteos",
  "puente de gluteos con pausa": "puente de gluteos",
  "flexiones de brazos": "flexiones",
  "flexiones de pecho": "flexiones",
  "zancadas": "zancadas alternas",
  "zancada": "zancadas alternas",
  "crunch": "crunch abdominal",
  "crunches": "crunch abdominal",
  "elevacion de piernas": "elevaciones de piernas",
  "rodillas altas": "skips en el sitio",
  "high knees": "skips en el sitio",
  "remo invertido": "remo invertido con mesa o toalla",
  "jumping jack": "jumping jacks",
  "burpee": "burpees",
  "gato vaca": "gato camello",
  "torsion espinal": "torsion espinal tumbado",
  "press banca": "press de banca",
  "press de pecho": "press de banca",
  "press de banca plano": "press de banca",
  "press banca con mancuernas": "press de banca con mancuernas",
  "press de pecho con mancuernas": "press de banca con mancuernas",
  "press inclinado": "press inclinado con mancuernas",
  "press militar con barra": "press militar",
  "press militar de pie": "press militar",
  "press de hombros": "press de hombros con mancuernas",
  "press de hombro con mancuernas": "press de hombros con mancuernas",
  "elevaciones laterales con mancuernas": "elevaciones laterales",
  "elevacion lateral": "elevaciones laterales",
  "fondos": "fondos en paralelas",
  "dips": "fondos en paralelas",
  "fondos de triceps": "fondos de triceps en banco",
  "fondos en banco": "fondos de triceps en banco",
  "extension de triceps sobre la cabeza": "extension de triceps con mancuerna",
  "extension de triceps": "extension de triceps con mancuerna",
  "dominada": "dominadas",
  "pull ups": "dominadas",
  "pull up": "dominadas",
  "jalon en polea": "jalon al pecho",
  "jalon en polea alta": "jalon al pecho",
  "polea al pecho": "jalon al pecho",
  "remo sentado en polea": "remo en polea baja",
  "remo en polea": "remo en polea baja",
  "remo con mancuerna a una mano": "remo con mancuerna",
  "remo unilateral con mancuerna": "remo con mancuerna",
  "remo inclinado con barra": "remo con barra",
  "remo inclinado": "remo con barra",
  "curl de biceps": "curl de biceps con mancuernas",
  "curl con mancuernas": "curl de biceps con mancuernas",
  "curl de biceps alterno": "curl de biceps con mancuernas",
  "curl martillo con mancuernas": "curl martillo",
  "curl con barra": "curl de biceps con barra",
  "sentadilla trasera": "sentadilla con barra",
  "sentadillas con barra": "sentadilla con barra",
  "sentadilla goblet con mancuerna": "sentadilla goblet",
  "zancada bulgara": "sentadilla bulgara",
  "sentadilla bulgara con mancuernas": "sentadilla bulgara",
  "peso muerto convencional": "peso muerto",
  "peso muerto con barra": "peso muerto",
  "peso muerto rumano con barra": "peso muerto rumano",
  "peso muerto rumano con mancuernas": "peso muerto rumano",
  "prensa": "prensa de piernas",
  "prensa inclinada": "prensa de piernas",
  "zancadas con peso": "zancadas con mancuernas",
  "zancadas caminando": "zancadas con mancuernas",
  "abdominales en bicicleta": "abdominales bicicleta",
  "bicicleta abdominal": "abdominales bicicleta",
  "giros rusos": "russian twist",
  "russian twists": "russian twist",
  "hip thrust con barra": "hip thrust",
  "empuje de cadera": "hip thrust",
  "elevacion de talones": "elevaciones de gemelos",
  "elevaciones de talones": "elevaciones de gemelos",
  "elevacion de gemelos": "elevaciones de gemelos",
  "gemelos de pie": "elevaciones de gemelos",
  "perro de caza": "bird dog",
  "perro pajaro": "bird dog",
  "supermans": "superman",
  "superman en el suelo": "superman",
  "extension lumbar en el suelo": "superman",
};

/** "Plancha lateral (izq.)" → "plancha lateral"; "Gato-camello" → "gato camello". */
function normalizeExerciseName(nombre: string): string {
  return nombre
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Vídeo demostrativo del ejercicio: clip propio si existe y, si no, búsqueda
 * curada de YouTube como respaldo (p. ej. para ejercicios con material que la
 * IA añade a los planes personalizados).
 */
export function exerciseVideoUrl(nombre: string): string {
  const key = normalizeExerciseName(nombre);
  const canonical = EXERCISE_VIDEO_KEYS.has(key) ? key : EXERCISE_VIDEO_ALIASES[key];
  if (canonical && EXERCISE_VIDEO_KEYS.has(canonical)) {
    return `${VIDEO_BASE}/${canonical.replace(/ /g, "-")}.mp4`;
  }
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`cómo hacer ${nombre} técnica correcta`)}`;
}
