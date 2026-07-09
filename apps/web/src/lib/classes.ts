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

// CDN de Higgsfield donde quedan alojados los clips generados por IA.
const VIDEO_CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_33T3QeUEhl4u6YPAFfsrpL331Ls";

/**
 * Clips demostrativos propios (generados con Higgsfield — Veo 3.1 / Seedance)
 * para los ejercicios de las clases guiadas. La clave es el nombre del
 * ejercicio normalizado con `normalizeExerciseName`.
 */
const EXERCISE_VIDEOS: Record<string, string> = {
  "sentadillas": `${VIDEO_CDN}/hf_20260709_133802_5e695417-4cac-4301-8e9d-787f736d1c03.mp4`,
  "plancha frontal": `${VIDEO_CDN}/hf_20260709_135247_8717a8b0-0e7a-409e-9ce8-d80197f5f7b3.mp4`,
  "plancha lateral": `${VIDEO_CDN}/hf_20260709_134047_04077101-0da7-4bd5-acca-82820b5fc6f9.mp4`,
  "plancha con toques de hombro": `${VIDEO_CDN}/hf_20260709_134049_80420a31-6050-4042-9d46-e12b5f6a3625.mp4`,
  "crunch abdominal": `${VIDEO_CDN}/hf_20260709_135238_e75c2942-32ac-4e1a-bcd0-8e6e9a9adcce.mp4`,
  "elevaciones de piernas": `${VIDEO_CDN}/hf_20260709_134054_5c5f22bc-4ed5-4e4a-903b-c948fe63c64b.mp4`,
  "mountain climbers": `${VIDEO_CDN}/hf_20260709_135304_dfa1e123-4eba-406d-bfc9-e42f3d652959.mp4`,
  "puente de gluteos": `${VIDEO_CDN}/hf_20260709_135638_a5221219-93be-4fc7-b625-36ed1a7a0eb5.mp4`,
  "puente de gluteos a una pierna": `${VIDEO_CDN}/hf_20260709_134227_bad61210-1f0f-4d72-bb82-b206ce950791.mp4`,
  "sentadilla con salto": `${VIDEO_CDN}/hf_20260709_134229_1c954d4f-3f43-4335-bb77-00489139619a.mp4`,
  "sentadilla isometrica en pared": `${VIDEO_CDN}/hf_20260709_135231_932850a1-f5c3-4f8e-ad36-7a37dbbee751.mp4`,
  "sentadilla profunda mantenida": `${VIDEO_CDN}/hf_20260709_135301_bc7b74f4-904b-4070-96cc-8b15406e87cf.mp4`,
  "flexiones": `${VIDEO_CDN}/hf_20260709_134828_572bb7fd-f82f-4945-95d7-e69336294931.mp4`,
  "zancadas alternas": `${VIDEO_CDN}/hf_20260709_134408_b79e1b7a-5823-481a-82f3-ba4d17420737.mp4`,
  "zancada inversa alterna": `${VIDEO_CDN}/hf_20260709_134411_80f8adbe-ab17-468d-9968-707daf9d87f0.mp4`,
  "zancada con rotacion toracica": `${VIDEO_CDN}/hf_20260709_134414_c0f99b51-ef9f-4dd9-88af-2bb2931f0209.mp4`,
  "remo invertido con mesa o toalla": `${VIDEO_CDN}/hf_20260709_134417_666c34a3-7e13-4333-be69-527ce0955615.mp4`,
  "jumping jacks": `${VIDEO_CDN}/hf_20260709_134419_3b94ea49-6aaa-4483-8f58-40e2f0454f60.mp4`,
  "burpees": `${VIDEO_CDN}/hf_20260709_134618_05b9f092-c82e-46fa-9263-350ae426a522.mp4`,
  "skips en el sitio": `${VIDEO_CDN}/hf_20260709_134621_31fc490d-32cb-4e57-b7cd-ca7c619ca458.mp4`,
  "sprint en el sitio": `${VIDEO_CDN}/hf_20260709_134623_5d83e397-ba64-4f5c-897d-07c17d4115dd.mp4`,
  "patada de gluteo": `${VIDEO_CDN}/hf_20260709_134626_e72af0b9-20c6-4542-809e-4e44895bd842.mp4`,
  "circulos de cuello y hombros": `${VIDEO_CDN}/hf_20260709_134829_af099cc7-19fe-4e4f-8392-b6207e9a4734.mp4`,
  "gato camello": `${VIDEO_CDN}/hf_20260709_134830_bbb3f35f-ab2a-44e9-b857-c0cad35683b6.mp4`,
  "rotaciones de cadera": `${VIDEO_CDN}/hf_20260709_134831_5b842e83-5560-4efc-959f-028a0e277c0b.mp4`,
  "perro boca abajo a cobra": `${VIDEO_CDN}/hf_20260709_135046_dcb4f7e9-b95a-4e44-80dc-b8f32b3e67cd.mp4`,
  "estiramiento de isquios sentado": `${VIDEO_CDN}/hf_20260709_135047_876ac316-908a-4986-8c0e-3da41d113522.mp4`,
  "estiramiento de cuadriceps": `${VIDEO_CDN}/hf_20260709_135050_96ac1f1c-fae4-4699-80a0-2e8d3a0a00a1.mp4`,
  "postura del nino": `${VIDEO_CDN}/hf_20260709_135053_1a6c1309-6cb8-40c2-9d06-f330b0762051.mp4`,
  "torsion espinal tumbado": `${VIDEO_CDN}/hf_20260709_140043_b0e7cb6d-62f1-467d-a5a1-ad641dc2c3d1.mp4`,
  "respiracion profunda tumbado": `${VIDEO_CDN}/hf_20260709_135058_ee5ecfe6-157b-4ba1-aa3f-8d779f25e69a.mp4`,
};

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
  const url = EXERCISE_VIDEOS[key] ?? EXERCISE_VIDEOS[EXERCISE_VIDEO_ALIASES[key] ?? ""];
  if (url) return url;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`cómo hacer ${nombre} técnica correcta`)}`;
}
