import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackParamList } from "../../App";
import { logWorkout } from "../api";
import { colors } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Workout">;

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}`;
}

const DIFFICULTIES: { key: "facil" | "justo" | "dificil"; label: string }[] = [
  { key: "facil", label: "😎 Fácil" },
  { key: "justo", label: "💪 Justo" },
  { key: "dificil", label: "🥵 Difícil" },
];

/** Sesión guiada: un ejercicio cada vez, con cuenta atrás de descanso. */
export default function WorkoutScreen({ navigation, route }: Props) {
  const dia = route.params.dia;
  const total = dia.ejercicios.length;

  const [idx, setIdx] = useState(0);
  const [setsDone, setSetsDone] = useState(0);
  const [restLeft, setRestLeft] = useState(0);
  const [finished, setFinished] = useState(false);
  const [difficulty, setDifficulty] = useState<"facil" | "justo" | "dificil">("justo");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ej = dia.ejercicios[idx];

  // Cuenta atrás del descanso (cadena de timeouts de 1 s)
  useEffect(() => {
    if (restLeft <= 0) return;
    const t = setTimeout(() => setRestLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [restLeft]);

  function goTo(newIdx: number) {
    setIdx(newIdx);
    setSetsDone(0);
    setRestLeft(0);
  }

  function markSet() {
    if (setsDone + 1 >= ej.series) {
      if (idx + 1 < total) {
        goTo(idx + 1);
        setRestLeft(ej.descansoSegundos);
      } else {
        setFinished(true);
      }
    } else {
      setSetsDone((s) => s + 1);
      setRestLeft(ej.descansoSegundos);
    }
  }

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      await logWorkout({ dayLabel: dia.dia, focus: dia.enfoque, difficulty });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la sesión.");
    } finally {
      setSaving(false);
    }
  }

  const progressPct = Math.round(((finished ? total : idx) / total) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
      {/* Progreso general */}
      <View style={styles.meter}>
        <View style={[styles.meterFill, { width: `${progressPct}%` }]} />
      </View>
      <Text style={styles.meterLabel}>
        {finished ? total : idx} / {total} ejercicios · {dia.dia} · {dia.enfoque}
      </Text>

      {finished ? (
        <View style={[styles.card, { alignItems: "center", marginTop: 20 }]}>
          <Text style={{ fontSize: 44 }}>🏆</Text>
          <Text style={styles.finishTitle}>¡Sesión completada!</Text>
          <Text style={styles.finishText}>
            ¿Cómo te ha resultado? La IA lo usará para ajustar tu próximo plan.
          </Text>
          <View style={styles.chipsRow}>
            {DIFFICULTIES.map((d) => (
              <TouchableOpacity
                key={d.key}
                style={[styles.chip, difficulty === d.key && styles.chipActive]}
                onPress={() => setDifficulty(d.key)}
              >
                <Text style={difficulty === d.key ? styles.chipTextActive : styles.chipText}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {error && <Text style={{ color: colors.danger, marginTop: 12 }}>{error}</Text>}
          <TouchableOpacity style={styles.primaryBtn} onPress={finish} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Guardar sesión ✓</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.exitText}>Salir sin guardar</Text>
          </TouchableOpacity>
        </View>
      ) : restLeft > 0 ? (
        <View style={[styles.card, styles.restCard]}>
          <Text style={styles.restLabel}>DESCANSO</Text>
          <Text style={styles.restTime}>{formatSeconds(restLeft)}</Text>
          <Text style={styles.restNext}>
            Siguiente: <Text style={{ color: colors.text, fontWeight: "600" }}>{ej.nombre}</Text>
            {setsDone > 0 ? ` · serie ${setsDone + 1} de ${ej.series}` : ""}
          </Text>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setRestLeft(0)}>
            <Text style={styles.secondaryBtnText}>Saltar descanso →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.card, { marginTop: 20 }]}>
          <Text style={styles.exLabel}>
            EJERCICIO {idx + 1} DE {total}
          </Text>
          <Text style={styles.exName}>{ej.nombre}</Text>
          <View style={styles.tagRow}>
            <Text style={styles.tag}>🔁 {ej.repeticiones} repeticiones</Text>
            <Text style={styles.tag}>⏱️ {ej.descansoSegundos} s descanso</Text>
          </View>
          {ej.notas ? <Text style={styles.notes}>💡 {ej.notas}</Text> : null}

          {/* Progreso de series */}
          <View style={styles.seriesRow}>
            {Array.from({ length: ej.series }, (_, i) => (
              <View key={i} style={[styles.seriesDot, i < setsDone && styles.seriesDotDone]} />
            ))}
          </View>
          <Text style={styles.seriesLabel}>
            Serie {Math.min(setsDone + 1, ej.series)} de {ej.series}
          </Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={markSet}>
            <Text style={styles.primaryBtnText}>✓ Serie completada</Text>
          </TouchableOpacity>

          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => idx > 0 && goTo(idx - 1)} disabled={idx === 0}>
              <Text style={[styles.navText, idx === 0 && { opacity: 0.3 }]}>← Anterior</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => (idx + 1 < total ? goTo(idx + 1) : setFinished(true))}>
              <Text style={styles.navText}>Saltar ejercicio →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  meter: { height: 8, backgroundColor: colors.border, borderRadius: 99, overflow: "hidden" },
  meterFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 99 },
  meterLabel: { color: colors.muted, fontSize: 12, marginTop: 6, textAlign: "right" },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  restCard: { alignItems: "center", marginTop: 20, paddingVertical: 48 },
  restLabel: { color: colors.muted, letterSpacing: 2, fontSize: 12 },
  restTime: { color: colors.primary, fontSize: 72, fontWeight: "800", marginVertical: 12, fontVariant: ["tabular-nums"] },
  restNext: { color: colors.muted, fontSize: 14, textAlign: "center" },
  exLabel: { color: colors.muted, fontSize: 11, letterSpacing: 1 },
  exName: { color: colors.text, fontSize: 24, fontWeight: "800", marginTop: 6 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  tag: {
    color: colors.text,
    fontSize: 13,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    overflow: "hidden",
  },
  notes: { color: colors.muted, fontSize: 13, marginTop: 12, lineHeight: 19 },
  seriesRow: { flexDirection: "row", gap: 6, marginTop: 20 },
  seriesDot: { flex: 1, height: 10, borderRadius: 99, backgroundColor: colors.border },
  seriesDotDone: { backgroundColor: colors.primary },
  seriesLabel: { color: colors.muted, fontSize: 13, marginTop: 8 },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 20,
    alignSelf: "stretch",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", textAlign: "center", fontSize: 16 },
  secondaryBtn: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  secondaryBtnText: { color: colors.text, fontWeight: "600" },
  navRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  navText: { color: colors.muted, fontSize: 14 },
  finishTitle: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 8 },
  finishText: { color: colors.muted, fontSize: 13, textAlign: "center", marginTop: 6 },
  chipsRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  chip: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontSize: 13 },
  chipTextActive: { color: "#fff", fontSize: 13, fontWeight: "700" },
  exitText: { color: colors.muted, fontSize: 12, marginTop: 14, textDecorationLine: "underline" },
});
