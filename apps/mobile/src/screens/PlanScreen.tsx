import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { RootStackParamList } from "../../App";
import {
  Exercise,
  ExerciseDetail,
  Plan,
  WorkoutLog,
  exerciseDetail,
  exerciseSubstitute,
  generatePlan,
  getPlan,
  getWorkouts,
  logWorkout,
} from "../api";
import * as Linking from "expo-linking";
import { exerciseVideoUrl } from "../classes";
import { colors } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Plan">;

/** Lunes 00:00 de la semana actual (igual que en la web). */
function startOfWeek(): Date {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // lunes = 0
  const monday = new Date(now);
  monday.setDate(now.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

const DIFFICULTIES: { key: "facil" | "justo" | "dificil"; label: string }[] = [
  { key: "facil", label: "😎" },
  { key: "justo", label: "💪" },
  { key: "dificil", label: "🥵" },
];

/** Fila de ejercicio: al tocarla, la IA muestra la ficha de técnica. */
function ExerciseRow({ ej }: { ej: Exercise }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ExerciseDetail | null>(null);
  const [sub, setSub] = useState<{ alternativa: string; motivo: string } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function toggle() {
    const willOpen = !open;
    setOpen(willOpen);
    if (!willOpen || detail) return;
    setLoading("detail");
    try {
      const data = await exerciseDetail(ej.nombre);
      setDetail(data.detail);
    } catch {
      // sin ficha: se mantiene la fila básica
    } finally {
      setLoading(null);
    }
  }

  async function substitute() {
    setLoading("sub");
    try {
      const data = await exerciseSubstitute(ej.nombre);
      setSub(data.substitution);
    } catch {
    } finally {
      setLoading(null);
    }
  }

  return (
    <View style={styles.exercise}>
      <TouchableOpacity onPress={toggle}>
        <Text style={styles.exerciseName}>{ej.nombre}</Text>
        <Text style={styles.exerciseDetail}>
          {ej.series} series × {ej.repeticiones} · descanso {ej.descansoSegundos} s
        </Text>
        {ej.notas ? <Text style={styles.exerciseNotes}>{ej.notas}</Text> : null}
      </TouchableOpacity>

      {open && (
        <View style={styles.detailBox}>
          {loading === "detail" && <Text style={styles.detailText}>La IA está preparando la ficha…</Text>}
          {detail && (
            <>
              <Text style={styles.detailMuscles}>💪 {detail.musculos.join(" · ")}</Text>
              {detail.tecnica.map((t, i) => (
                <Text key={i} style={styles.detailText}>
                  {i + 1}. {t}
                </Text>
              ))}
              <Text style={[styles.detailText, { marginTop: 6 }]}>💡 {detail.consejo}</Text>
            </>
          )}
          <TouchableOpacity onPress={() => Linking.openURL(exerciseVideoUrl(ej.nombre))}>
            <Text style={{ color: colors.primary, fontSize: 12, marginTop: 8, textDecorationLine: "underline" }}>
              🎬 Ver vídeo del ejercicio
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.subBtn} onPress={substitute} disabled={loading === "sub"}>
            {loading === "sub" ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <Text style={styles.subBtnText}>🔄 Sustituir este ejercicio</Text>
            )}
          </TouchableOpacity>
          {sub && (
            <View style={styles.subCard}>
              <Text style={styles.subCardTitle}>Alternativa: {sub.alternativa}</Text>
              <Text style={styles.subCardText}>{sub.motivo}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function PlanScreen({ navigation }: Props) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getPlan().then((data) => setPlan(data.plan?.data ?? null)),
      getWorkouts().then((data) => setWorkouts(data.workouts)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const monday = startOfWeek();
  const doneThisWeek = new Set(
    workouts.filter((w) => new Date(w.completedAt) >= monday).map((w) => w.dayLabel),
  );

  async function onGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const data = await generatePlan();
      setPlan(data.plan.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el plan.");
    } finally {
      setGenerating(false);
    }
  }

  async function onComplete(dayLabel: string, focus: string, difficulty: "facil" | "justo" | "dificil") {
    setSaving(dayLabel);
    setError(null);
    try {
      const data = await logWorkout({ dayLabel, focus, difficulty });
      setWorkouts((prev) => [data.workout, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la sesión.");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const hasFeedback = workouts.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <TouchableOpacity style={styles.btn} onPress={onGenerate} disabled={generating}>
        {generating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>
            {plan ? (hasFeedback ? "🧠 Adaptar plan a mi progreso" : "Regenerar plan") : "Generar mi plan"}
          </Text>
        )}
      </TouchableOpacity>
      {generating && (
        <Text style={styles.hint}>La IA está diseñando tu plan; puede tardar un poco…</Text>
      )}
      {plan && hasFeedback && !generating && (
        <Text style={styles.hint}>La IA usará tus sesiones marcadas como fácil/justo/difícil.</Text>
      )}
      {error && <Text style={{ color: colors.danger, marginTop: 12 }}>{error}</Text>}

      {plan && (
        <View style={{ marginTop: 20 }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resumen</Text>
            <Text style={styles.cardText}>{plan.resumen}</Text>
          </View>

          {plan.dias.map((dia) => {
            const done = doneThisWeek.has(dia.dia);
            return (
              <View key={dia.dia} style={[styles.card, done && styles.cardDone]}>
                <Text style={styles.cardTitle}>
                  {done ? "✅ " : ""}
                  {dia.dia} <Text style={{ color: colors.primary }}>· {dia.enfoque}</Text>
                </Text>
                {dia.ejercicios.map((ej, i) => (
                  <ExerciseRow key={i} ej={ej} />
                ))}
                {!done && (
                  <>
                    <TouchableOpacity
                      style={styles.trainBtn}
                      onPress={() => navigation.navigate("Workout", { dia })}
                    >
                      <Text style={styles.trainBtnText}>▶ Entrenar esta sesión</Text>
                    </TouchableOpacity>
                    <View style={styles.chipsRow}>
                      <Text style={styles.chipsLabel}>¿Ya la hiciste por tu cuenta? Marca cómo fue:</Text>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        {DIFFICULTIES.map((d) => (
                          <TouchableOpacity
                            key={d.key}
                            style={styles.chip}
                            disabled={saving === dia.dia}
                            onPress={() => onComplete(dia.dia, dia.enfoque, d.key)}
                          >
                            <Text style={styles.chipText}>✓ {d.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </>
                )}
              </View>
            );
          })}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Consejos</Text>
            {plan.consejos.map((c, i) => (
              <Text key={i} style={styles.cardText}>
                • {c}
              </Text>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  btn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16 },
  btnText: { color: "#fff", fontWeight: "700", textAlign: "center", fontSize: 16 },
  hint: { color: colors.muted, textAlign: "center", marginTop: 10, fontSize: 13 },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  cardDone: { borderColor: colors.primaryDark, opacity: 0.85 },
  cardTitle: { color: colors.text, fontWeight: "700", fontSize: 15, marginBottom: 8 },
  cardText: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  exercise: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  exerciseName: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 14,
    textDecorationLine: "underline",
    textDecorationColor: colors.border,
  },
  exerciseDetail: { color: colors.primary, fontSize: 13, marginTop: 2 },
  exerciseNotes: { color: colors.muted, fontSize: 12, marginTop: 4 },
  detailBox: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  detailMuscles: { color: colors.primary, fontSize: 12, marginBottom: 6 },
  detailText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  subBtn: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 10,
  },
  subBtnText: { color: colors.text, fontSize: 12, textAlign: "center", fontWeight: "600" },
  subCard: {
    borderColor: colors.primaryDark,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  subCardTitle: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  subCardText: { color: colors.muted, fontSize: 11, marginTop: 3, lineHeight: 16 },
  trainBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
  },
  trainBtnText: { color: "#fff", fontWeight: "700", textAlign: "center", fontSize: 14 },
  chipsRow: { borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 12, marginTop: 12 },
  chipsLabel: { color: colors.muted, fontSize: 12, marginBottom: 8 },
  chip: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipText: { color: colors.text, fontSize: 13 },
});
