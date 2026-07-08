import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ProgressEntry, WorkoutLog, addProgress, getProgress, getWorkouts } from "../api";
import { colors } from "../theme";

const DIFF_EMOJI: Record<string, string> = { facil: "😎", justo: "💪", dificil: "🥵" };

/** Gráfica de barras del peso corporal hecha solo con Views (sin librerías). */
function WeightChart({ entries }: { entries: ProgressEntry[] }) {
  const weights = entries.filter((e) => e.kind === "peso_corporal").slice(-12);
  if (weights.length < 2) return null;
  const values = weights.map((w) => w.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return (
    <View style={chartStyles.wrap}>
      <View style={chartStyles.bars}>
        {weights.map((w) => {
          const h = 24 + ((w.value - min) / range) * 76; // 24-100 %
          return (
            <View key={w.id} style={chartStyles.barCol}>
              <Text style={chartStyles.barValue}>{w.value}</Text>
              <View style={[chartStyles.bar, { height: `${h}%` }]} />
            </View>
          );
        })}
      </View>
      <Text style={chartStyles.caption}>
        Peso corporal (kg) — de {values[0]} a {values[values.length - 1]}
      </Text>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  bars: { flexDirection: "row", alignItems: "flex-end", height: 140, gap: 6 },
  barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", height: "100%" },
  barValue: { color: colors.muted, fontSize: 9, marginBottom: 3 },
  bar: { width: "70%", backgroundColor: colors.primary, borderRadius: 4, opacity: 0.9 },
  caption: { color: colors.muted, fontSize: 11, marginTop: 8, textAlign: "center" },
});

export default function ProgressScreen() {
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState("");
  const [markName, setMarkName] = useState("");
  const [markKg, setMarkKg] = useState("");
  const [markReps, setMarkReps] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getProgress().then((d) => setEntries(d.entries)),
      getWorkouts().then((d) => setWorkouts(d.workouts)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveWeight() {
    const value = Number(weight.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setError("Escribe un peso válido, ej.: 74,5");
      return;
    }
    setSaving("peso");
    setError(null);
    try {
      const d = await addProgress({ kind: "peso_corporal", label: "Peso corporal", value });
      setEntries((prev) => [...prev, d.entry]);
      setWeight("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(null);
    }
  }

  async function saveMark() {
    const value = Number(markKg.replace(",", "."));
    const reps = Number(markReps);
    if (!markName.trim() || !Number.isFinite(value) || value <= 0) {
      setError("Rellena el ejercicio y el peso de la marca.");
      return;
    }
    setSaving("marca");
    setError(null);
    try {
      const d = await addProgress({
        kind: "ejercicio",
        label: markName.trim(),
        value,
        reps: Number.isInteger(reps) && reps > 0 ? reps : undefined,
      });
      setEntries((prev) => [...prev, d.entry]);
      setMarkName("");
      setMarkKg("");
      setMarkReps("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
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

  const marks = entries.filter((e) => e.kind === "ejercicio").slice(-15).reverse();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {/* Peso corporal */}
      <Text style={styles.sectionTitle}>⚖️ Peso corporal</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Ej.: 74,5"
          placeholderTextColor={colors.muted}
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
        />
        <TouchableOpacity style={styles.addBtn} onPress={saveWeight} disabled={saving === "peso"}>
          {saving === "peso" ? <ActivityIndicator color="#fff" /> : <Text style={styles.addBtnText}>Añadir</Text>}
        </TouchableOpacity>
      </View>
      <WeightChart entries={entries} />

      {/* Marcas */}
      <Text style={styles.sectionTitle}>🏋️ Marcas por ejercicio</Text>
      <TextInput
        style={styles.input}
        placeholder="Ejercicio, ej.: press banca"
        placeholderTextColor={colors.muted}
        value={markName}
        onChangeText={setMarkName}
      />
      <View style={[styles.row, { marginTop: 8 }]}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Peso (kg)"
          placeholderTextColor={colors.muted}
          keyboardType="decimal-pad"
          value={markKg}
          onChangeText={setMarkKg}
        />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Reps"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          value={markReps}
          onChangeText={setMarkReps}
        />
        <TouchableOpacity style={styles.addBtn} onPress={saveMark} disabled={saving === "marca"}>
          {saving === "marca" ? <ActivityIndicator color="#fff" /> : <Text style={styles.addBtnText}>Añadir</Text>}
        </TouchableOpacity>
      </View>

      {error && <Text style={{ color: colors.danger, marginTop: 10 }}>{error}</Text>}

      {marks.length > 0 && (
        <View style={styles.card}>
          {marks.map((m) => (
            <View key={m.id} style={styles.markRow}>
              <Text style={styles.markName}>{m.label}</Text>
              <Text style={styles.markValue}>
                {m.value} kg{m.reps ? ` × ${m.reps}` : ""}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Historial de sesiones */}
      <Text style={styles.sectionTitle}>📅 Últimas sesiones</Text>
      {workouts.length === 0 ? (
        <Text style={{ color: colors.muted, fontSize: 13 }}>
          Aún no has completado ninguna sesión. ¡La primera es la que cuenta!
        </Text>
      ) : (
        <View style={[styles.card, { marginBottom: 30 }]}>
          {workouts.slice(0, 15).map((w) => (
            <View key={w.id} style={styles.markRow}>
              <Text style={styles.markName}>
                {DIFF_EMOJI[w.difficulty] ?? "💪"} {w.dayLabel}
                {w.focus ? ` · ${w.focus}` : ""}
              </Text>
              <Text style={styles.markValue}>{new Date(w.completedAt).toLocaleDateString()}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionTitle: { color: colors.text, fontWeight: "700", fontSize: 16, marginTop: 20, marginBottom: 10 },
  row: { flexDirection: "row", gap: 8 },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "700" },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  markRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  markName: { color: colors.text, fontSize: 13, flex: 1, paddingRight: 8 },
  markValue: { color: colors.muted, fontSize: 13 },
});
