import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * URL del backend (la misma web de Next.js sirve la API).
 * En desarrollo con un emulador Android usa http://10.0.2.2:3000
 * En un dispositivo físico usa la IP local de tu ordenador, p. ej. http://192.168.1.50:3000
 */
export const API_URL = "https://app-jbst.vercel.app";

const TOKEN_KEY = "fitcoach_token";

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string | null): Promise<void> {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error ?? `Error ${res.status}`) as Error & { code?: string };
    error.code = data.code;
    throw error;
  }
  return data as T;
}

// ---- Tipos compartidos con el backend ----

export type Access = {
  hasAccess: boolean;
  status: string; // none | trialing | active | past_due | canceled
  trialEndsAt: string | null;
  trialActive: boolean;
};

export type Profile = {
  goal: string;
  level: string;
  daysPerWeek: number;
  equipment: string;
  injuries?: string | null;
  sex?: string | null;
  focusAreas?: string | null;
  sessionMins?: number | null;
  age?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
};

export type Exercise = {
  nombre: string;
  series: number;
  repeticiones: string;
  descansoSegundos: number;
  notas: string;
};

export type Plan = {
  resumen: string;
  dias: { dia: string; enfoque: string; ejercicios: Exercise[] }[];
  consejos: string[];
};

export type ChatMsg = { role: "user" | "assistant"; content: string };

export type WorkoutLog = {
  id: string;
  dayLabel: string;
  focus: string | null;
  difficulty: "facil" | "justo" | "dificil";
  completedAt: string;
};

export type ProgressEntry = {
  id: string;
  kind: "peso_corporal" | "ejercicio";
  label: string;
  value: number;
  reps?: number | null;
  createdAt: string;
};

export type ExerciseDetail = {
  nombre: string;
  musculos: string[];
  tecnica: string[];
  errores: string[];
  consejo: string;
};

export type Substitution = {
  original: string;
  alternativa: string;
  motivo: string;
  musculos: string[];
};

// ---- Llamadas a la API ----

export async function register(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const data = await request<{ token: string; access: Access }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  await setToken(data.token);
  return data;
}

export async function login(input: { email: string; password: string }) {
  const data = await request<{ token: string; access: Access }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  await setToken(data.token);
  return data;
}

export async function logout() {
  await setToken(null);
}

/** Envía el correo de "olvidé mi contraseña" (el enlace abre la web). */
export async function forgotPassword(email: string) {
  return request<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function me() {
  return request<{ user: { name: string; email: string }; access: Access; profile: Profile | null }>(
    "/api/me",
  );
}

export async function saveProfile(profile: Profile) {
  return request<{ profile: Profile }>("/api/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}

export async function getPlan() {
  return request<{ plan: { data: Plan } | null }>("/api/ai/plan");
}

export async function generatePlan() {
  return request<{ plan: { data: Plan } }>("/api/ai/plan", { method: "POST" });
}

export async function getWorkouts() {
  return request<{ workouts: WorkoutLog[] }>("/api/workouts");
}

export async function logWorkout(input: {
  dayLabel: string;
  difficulty: "facil" | "justo" | "dificil";
  focus?: string;
}) {
  return request<{ workout: WorkoutLog }>("/api/workouts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getProgress() {
  return request<{ entries: ProgressEntry[] }>("/api/progress");
}

export async function addProgress(input: {
  kind: "peso_corporal" | "ejercicio";
  label: string;
  value: number;
  reps?: number;
}) {
  return request<{ entry: ProgressEntry }>("/api/progress", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function exerciseDetail(exercise: string) {
  return request<{ detail: ExerciseDetail }>("/api/ai/exercise", {
    method: "POST",
    body: JSON.stringify({ exercise, mode: "detail" }),
  });
}

export async function exerciseSubstitute(exercise: string, reason?: string) {
  return request<{ substitution: Substitution }>("/api/ai/exercise", {
    method: "POST",
    body: JSON.stringify({ exercise, mode: "substitute", reason }),
  });
}

/** Abre el pago: el backend crea la sesión de Stripe y devuelve su URL. */
export async function createCheckout() {
  return request<{ url: string }>("/api/checkout", { method: "POST" });
}

/** Portal de facturación de Stripe (gestionar o cancelar la suscripción). */
export async function billingPortal() {
  return request<{ url: string }>("/api/billing/portal", { method: "POST" });
}

export async function getChat() {
  return request<{ messages: ChatMsg[] }>("/api/ai/chat");
}

export async function sendChat(message: string) {
  // stream: false → el backend devuelve la respuesta completa en JSON (más simple en móvil)
  return request<{ reply: string }>("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message, stream: false }),
  });
}
