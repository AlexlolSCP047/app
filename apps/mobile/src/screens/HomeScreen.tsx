import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  AppState,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { RootStackParamList } from "../../App";
import {
  API_URL,
  Access,
  Plan,
  WorkoutLog,
  billingPortal,
  createCheckout,
  getPlan,
  getWorkouts,
  logout,
  me,
} from "../api";
import { colors } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

/** Lunes 00:00 de la semana actual (igual que en la web). */
function startOfWeek(): Date {
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function streakWeeks(workouts: WorkoutLog[]): number {
  if (workouts.length === 0) return 0;
  let streak = 0;
  let cursor = startOfWeek();
  for (let i = 0; i < 52; i++) {
    const end = new Date(cursor.getTime() + 7 * 86_400_000);
    const any = workouts.some((w) => {
      const t = new Date(w.completedAt);
      return t >= cursor && t < end;
    });
    if (any) streak++;
    else if (i > 0) break; // la semana en curso sin sesiones aún no rompe la racha
    cursor = new Date(cursor.getTime() - 7 * 86_400_000);
  }
  return streak;
}

export default function HomeScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const [access, setAccess] = useState<Access | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return Promise.all([
      me().then((data) => {
        setName(data.user.name);
        setAccess(data.access);
        setHasProfile(Boolean(data.profile));
        if (data.profile?.daysPerWeek) setDaysPerWeek(data.profile.daysPerWeek);
      }),
      getPlan()
        .then((data) => setPlan(data.plan?.data ?? null))
        .catch(() => {}),
      getWorkouts()
        .then((data) => setWorkouts(data.workouts))
        .catch(() => {}),
    ]).catch(() => {
      navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load]),
  );

  // Al volver del navegador (pago de Stripe), recarga el estado de la cuenta
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") load();
    });
    return () => sub.remove();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function openCheckout(plan: "basico" | "pro") {
    setPaying(true);
    setError(null);
    try {
      const data = await createCheckout(plan);
      if (data.url) await Linking.openURL(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo abrir el pago.");
    } finally {
      setPaying(false);
    }
  }

  async function openPortal() {
    try {
      const data = await billingPortal();
      if (data.url) await Linking.openURL(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo abrir la gestión.");
    }
  }

  async function onLogout() {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const trialDaysLeft = access?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(access.trialEndsAt).getTime() - Date.now()) / 86_400_000))
    : 0;

  const weekStart = startOfWeek();
  const doneThisWeek = workouts.filter((w) => new Date(w.completedAt) >= weekStart);
  const doneLabels = new Set(doneThisWeek.map((w) => w.dayLabel));
  const nextDay = plan?.dias.find((d) => !doneLabels.has(d.dia)) ?? null;
  const target = daysPerWeek || plan?.dias.length || 3;
  const pct = Math.min(100, Math.round((doneThisWeek.length / target) * 100));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Text style={styles.greeting}>Hola, {name} 👋</Text>

      {/* Estado de la suscripción (sin enlaces de gestión: eso vive discreto abajo) */}
      {access?.status === "active" ? (
        <View style={[styles.banner, { borderColor: colors.primaryDark }]}>
          <Text style={{ color: colors.primary }}>✓ Suscripción activa — Plan Pro</Text>
        </View>
      ) : access?.trialActive ? (
        <View style={[styles.banner, { borderColor: colors.primaryDark }]}>
          <Text style={{ color: colors.primary }}>
            🎁 Prueba gratuita activa{trialDaysLeft > 0 ? ` — te ${trialDaysLeft === 1 ? "queda 1 día" : `quedan ${trialDaysLeft} días`}` : ""}. Después, 14,99 €/mes automáticamente.
          </Text>
        </View>
      ) : access?.status === "past_due" ? (
        <View style={[styles.banner, { borderColor: colors.warning }]}>
          <Text style={{ color: colors.warning }}>⚠️ Hay un problema con tu último pago.</Text>
          <TouchableOpacity style={styles.subscribeBtn} onPress={openPortal}>
            <Text style={styles.subscribeBtnText}>Actualizar tarjeta</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.banner, { borderColor: colors.primary }]}>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
            {access?.status === "canceled" ? "Reactiva tu Plan Pro 💪" : "Activa tu día de prueba gratis 🎁"}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            {access?.status === "canceled"
              ? "Recupera tu plan adaptativo, el modo entrenamiento y el chat por 14,99 €/mes."
              : "Sin cobro hasta mañana. Se abrirá el pago seguro de Stripe en tu navegador."}
          </Text>
          <TouchableOpacity style={styles.subscribeBtn} onPress={() => openCheckout("pro")} disabled={paying}>
            {paying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.subscribeBtnText}>💳 Plan Pro — 14,99 €/mes (con dieta)</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subscribeBtn, { backgroundColor: "transparent", borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => openCheckout("basico")}
            disabled={paying}
          >
            <Text style={[styles.subscribeBtnText, { color: colors.text }]}>Plan Básico — 9,99 €/mes (solo entrenamiento)</Text>
          </TouchableOpacity>
        </View>
      )}

      {error && <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text>}

      {/* Métricas de la semana */}
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>ESTA SEMANA</Text>
          <Text style={styles.metricValue}>
            {doneThisWeek.length}
            <Text style={styles.metricUnit}> / {target}</Text>
          </Text>
          <View style={styles.meter}>
            <View style={[styles.meterFill, { width: `${pct}%` }]} />
          </View>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>RACHA</Text>
          <Text style={styles.metricValue}>
            🔥 {streakWeeks(workouts)}
            <Text style={styles.metricUnit}> sem</Text>
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>TOTAL</Text>
          <Text style={styles.metricValue}>
            {workouts.length}
            <Text style={styles.metricUnit}> ses</Text>
          </Text>
        </View>
      </View>

      {/* Próxima sesión */}
      {!hasProfile ? (
        <TouchableOpacity style={[styles.card, styles.cardHighlight]} onPress={() => navigation.navigate("Profile")}>
          <Text style={styles.cardTitle}>Empecemos por conocerte 💚</Text>
          <Text style={styles.cardText}>Responde el cuestionario y la IA diseñará tu plan a medida.</Text>
        </TouchableOpacity>
      ) : !plan ? (
        <TouchableOpacity style={[styles.card, styles.cardHighlight]} onPress={() => navigation.navigate("Plan")}>
          <Text style={styles.cardTitle}>Genera tu primer plan 🧠</Text>
          <Text style={styles.cardText}>La IA diseñará tu semana de entrenamiento completa.</Text>
        </TouchableOpacity>
      ) : nextDay ? (
        <View style={[styles.card, styles.cardHighlight]}>
          <Text style={styles.nextLabel}>TU PRÓXIMA SESIÓN</Text>
          <Text style={styles.cardTitle}>
            {nextDay.dia} <Text style={{ color: colors.primary }}>· {nextDay.enfoque}</Text>
          </Text>
          <Text style={styles.cardText}>{nextDay.ejercicios.length} ejercicios</Text>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => navigation.navigate("Workout", { dia: nextDay })}
          >
            <Text style={styles.startBtnText}>▶ Empezar entrenamiento</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.card, styles.cardHighlight, { alignItems: "center" }]}>
          <Text style={{ fontSize: 32 }}>🏆</Text>
          <Text style={styles.cardTitle}>¡Semana completada!</Text>
          <Text style={[styles.cardText, { textAlign: "center" }]}>
            Descansa — o regenera tu plan desde "Mi plan": la IA usará tu feedback para progresar.
          </Text>
        </View>
      )}

      {/* Menú */}
      <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate("Plan")}>
        <Text style={styles.menuTitle}>📅 Mi plan de entrenamiento</Text>
        <Text style={styles.menuText}>Tu semana completa, adaptada a tu feedback.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate("Library")}>
        <Text style={styles.menuTitle}>📖 Biblioteca de ejercicios</Text>
        <Text style={styles.menuText}>Técnica, músculos y errores de cualquier ejercicio.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate("Classes")}>
        <Text style={styles.menuTitle}>🎥 Clases guiadas</Text>
        <Text style={styles.menuText}>Core, HIIT, movilidad… cronometradas, sin material.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate("Diet")}>
        <Text style={styles.menuTitle}>🍽️ Dieta y comidas</Text>
        <Text style={styles.menuText}>Tu dieta con macros y análisis de lo que comes.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate("Progress")}>
        <Text style={styles.menuTitle}>📈 Mi progreso</Text>
        <Text style={styles.menuText}>Peso corporal, marcas e historial de sesiones.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate("Chat")}>
        <Text style={styles.menuTitle}>💬 Chat con tu entrenador</Text>
        <Text style={styles.menuText}>Dudas de técnica, nutrición, motivación…</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate("Profile")}>
        <Text style={styles.menuTitle}>⚙️ Mi perfil</Text>
        <Text style={styles.menuText}>
          {hasProfile ? "Objetivo, nivel, material, zonas prioritarias…" : "Complétalo para que la IA diseñe tu plan."}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logout} onPress={onLogout}>
        <Text style={{ color: colors.muted }}>Cerrar sesión</Text>
      </TouchableOpacity>

      {/* Enlaces legales, discretos a propósito (abren la web) */}
      <View style={styles.legalRow}>
        <TouchableOpacity onPress={() => Linking.openURL(`${API_URL}/privacidad`)}>
          <Text style={styles.legalLink}>Política de privacidad</Text>
        </TouchableOpacity>
        <Text style={styles.legalDot}>·</Text>
        <TouchableOpacity onPress={() => Linking.openURL(`${API_URL}/eliminar-cuenta`)}>
          <Text style={styles.legalLink}>Eliminar cuenta</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  greeting: { color: colors.text, fontSize: 22, fontWeight: "700", marginBottom: 16 },
  banner: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  bannerLink: { color: colors.primary, textDecorationLine: "underline", fontSize: 13 },
  subscribeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
  },
  subscribeBtnText: { color: "#fff", fontWeight: "700", textAlign: "center" },
  metricsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  metric: {
    flex: 1,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  metricLabel: { color: colors.muted, fontSize: 10, letterSpacing: 1 },
  metricValue: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 4 },
  metricUnit: { color: colors.muted, fontSize: 13, fontWeight: "400" },
  meter: { height: 6, backgroundColor: colors.border, borderRadius: 99, marginTop: 8, overflow: "hidden" },
  meterFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 99 },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
  },
  cardHighlight: { borderColor: colors.primaryDark },
  nextLabel: { color: colors.primary, fontSize: 11, letterSpacing: 1, marginBottom: 4 },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  cardText: { color: colors.muted, marginTop: 4, fontSize: 13 },
  startBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, marginTop: 14 },
  startBtnText: { color: "#fff", fontWeight: "700", textAlign: "center", fontSize: 15 },
  menuCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  menuTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  menuText: { color: colors.muted, marginTop: 3, fontSize: 12 },
  logout: { alignItems: "center", marginTop: 20, padding: 12 },
  legalRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
    opacity: 0.6,
  },
  legalLink: { color: colors.muted, fontSize: 11, textDecorationLine: "underline" },
  legalDot: { color: colors.muted, fontSize: 11 },
});
