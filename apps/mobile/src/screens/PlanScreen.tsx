import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { generatePlan, getPlan, getWorkouts, logWorkout, Plan, WorkoutLog } from "../api";
import { colors } from "../theme";

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
  { key: "facil", label: "😌 Fácil" },
  { key: "justo", label: "💪 Justo" },
  { key: "dificil", label: "🥵 Difícil" },
];

export default function PlanScreen() {
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

  // Días ya completados esta semana → se marcan con ✅ en su tarjeta.
  const monday = startOfWeek();
  const doneThisWeek = new Set(
    workouts.filter((w) => new Date(w.completedAt) >= monday).map((w) => w.dayLabel),
  );

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

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <TouchableOpacity style={styles.btn} onPress={onGenerate} disabled={generating}>
        {generating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>{plan ? "Regenerar plan" : "Generar mi plan"}</Text>
        )}
      </TouchableOpacity>
      {generating && (
        <Text style={styles.hint}>La IA está diseñando tu plan; puede tardar un poco…</Text>
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
                  <View key={i} style={styles.exercise}>
                    <Text style={styles.exerciseName}>{ej.nombre}</Text>
                    <Text style={styles.exerciseDetail}>
                      {ej.series} series × {ej.repeticiones} · descanso {ej.descansoSegundos} s
                    </Text>
                    {ej.notas ? <Text style={styles.exerciseNotes}>{ej.notas}</Text> : null}
                  </View>
                ))}
                {!done && (
                  <View style={styles.chipsRow}>
                    <Text style={styles.chipsLabel}>¿Cómo fue? Marca para completar:</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {DIFFICULTIES.map((d) => (
                        <TouchableOpacity
                          key={d.key}
                          style={styles.chip}
                          disabled={saving === dia.dia}
                          onPress={() => onComplete(dia.dia, dia.enfoque, d.key)}
                        >
                          <Text style={styles.chipText}>{d.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
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
  cardDone: { borderColor: colors.primary },
  cardTitle: { color: colors.text, fontWeight: "700", fontSize: 15, marginBottom: 8 },
  chipsRow: { borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 12, marginTop: 4 },
  chipsLabel: { color: colors.muted, fontSize: 12, marginBottom: 8 },
  chip: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipText: { color: colors.text, fontSize: 13 },
  cardText: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  exercise: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  exerciseName: { color: colors.text, fontWeight: "600", fontSize: 14 },
  exerciseDetail: { color: colors.primary, fontSize: 13, marginTop: 2 },
  exerciseNotes: { color: colors.muted, fontSize: 12, marginTop: 4 },
});
