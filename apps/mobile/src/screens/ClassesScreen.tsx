import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GUIDED_CLASSES, GuidedClass, exerciseVideoUrl } from "../classes";
import { logWorkout } from "../api";
import { colors } from "../theme";

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

/** Reproductor cronometrado de una clase (trabajo → descanso → siguiente). */
function ClassPlayer(props: { clase: GuidedClass; onClose: () => void }) {
  const total = props.clase.ejercicios.length;
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"trabajo" | "descanso" | "fin">("trabajo");
  const [left, setLeft] = useState(props.clase.ejercicios[0].segundos);
  const [difficulty, setDifficulty] = useState<"facil" | "justo" | "dificil">("justo");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ej = props.clase.ejercicios[Math.min(idx, total - 1)];

  useEffect(() => {
    if (phase === "fin") return;
    if (left > 0) {
      const t = setTimeout(() => setLeft((s) => s - 1), 1000);
      return () => clearTimeout(t);
    }
    if (phase === "trabajo") {
      if (ej.descanso > 0 && idx + 1 < total) {
        setPhase("descanso");
        setLeft(ej.descanso);
      } else if (idx + 1 < total) {
        setIdx(idx + 1);
        setLeft(props.clase.ejercicios[idx + 1].segundos);
      } else {
        setPhase("fin");
      }
    } else {
      setIdx(idx + 1);
      setPhase("trabajo");
      setLeft(props.clase.ejercicios[idx + 1].segundos);
    }
  }, [left, phase, idx, ej.descanso, total, props.clase.ejercicios]);

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      await logWorkout({ dayLabel: `Clase: ${props.clase.nombre}`, focus: props.clase.nombre, difficulty });
      props.onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la sesión.");
    } finally {
      setSaving(false);
    }
  }

  const pct = Math.round(((phase === "fin" ? total : idx) / total) * 100);
  const siguiente = idx + 1 < total ? props.clase.ejercicios[idx + 1].nombre : null;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.meter}>
        <View style={[styles.meterFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.meterLabel}>
        {phase === "fin" ? total : idx} / {total} · {props.clase.emoji} {props.clase.nombre}
      </Text>

      {phase === "fin" ? (
        <View style={[styles.card, { alignItems: "center", marginTop: 20 }]}>
          <Text style={{ fontSize: 44 }}>🏆</Text>
          <Text style={styles.finishTitle}>¡Clase completada!</Text>
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
          {error && <Text style={{ color: colors.danger, marginTop: 10 }}>{error}</Text>}
          <TouchableOpacity style={styles.primaryBtn} onPress={finish} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Guardar sesión ✓</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={props.onClose}>
            <Text style={styles.exitText}>Salir sin guardar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.card, styles.playerCard, phase === "trabajo" && { borderColor: colors.primaryDark }]}>
          <Text style={styles.phaseLabel}>{phase === "trabajo" ? "¡DALE!" : "DESCANSO"}</Text>
          <Text style={[styles.time, { color: phase === "trabajo" ? colors.primary : colors.muted }]}>
            {formatSeconds(left)}
          </Text>
          <Text style={styles.exName}>
            {phase === "trabajo" ? ej.nombre : `Siguiente: ${siguiente ?? "final"}`}
          </Text>
          {phase === "trabajo" && (
            <TouchableOpacity onPress={() => Linking.openURL(exerciseVideoUrl(ej.nombre))}>
              <Text style={styles.videoLink}>🎬 Ver vídeo</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setLeft(0)}>
            <Text style={styles.secondaryBtnText}>Saltar →</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={props.onClose}>
            <Text style={styles.exitText}>✕ Salir de la clase</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function ClassesScreen() {
  const [active, setActive] = useState<GuidedClass | null>(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
      {active ? (
        <ClassPlayer clase={active} onClose={() => setActive(null)} />
      ) : (
        <>
          <Text style={styles.hint}>
            Sesiones guiadas para casa, sin material: cada ejercicio con su cuenta atrás y sus
            descansos. Cuentan para tu racha 🔥.
          </Text>
          {GUIDED_CLASSES.map((c) => (
            <View key={c.id} style={styles.card}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ fontSize: 28 }}>{c.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{c.nombre}</Text>
                  <Text style={styles.cardMeta}>
                    {c.minutos} min · {c.nivel} · {c.ejercicios.length} ejercicios
                  </Text>
                </View>
              </View>
              <Text style={styles.cardText}>{c.descripcion}</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setActive(c)}>
                <Text style={styles.primaryBtnText}>▶ Empezar clase</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hint: { color: colors.muted, fontSize: 13, marginBottom: 14, lineHeight: 19 },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { color: colors.text, fontWeight: "700", fontSize: 15 },
  cardMeta: { color: colors.muted, fontSize: 11, marginTop: 2 },
  cardText: { color: colors.muted, fontSize: 13, marginTop: 8, lineHeight: 19 },
  meter: { height: 8, backgroundColor: colors.border, borderRadius: 99, overflow: "hidden" },
  meterFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 99 },
  meterLabel: { color: colors.muted, fontSize: 12, marginTop: 6, textAlign: "right" },
  playerCard: { alignItems: "center", marginTop: 20, paddingVertical: 40, flex: 1, justifyContent: "center" },
  phaseLabel: { color: colors.muted, letterSpacing: 2, fontSize: 12 },
  time: { fontSize: 72, fontWeight: "800", marginVertical: 12, fontVariant: ["tabular-nums"] },
  exName: { color: colors.text, fontSize: 18, fontWeight: "700", textAlign: "center" },
  videoLink: { color: colors.primary, fontSize: 13, marginTop: 8, textDecorationLine: "underline" },
  secondaryBtn: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  secondaryBtnText: { color: colors.text, fontWeight: "600" },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, marginTop: 14, alignSelf: "stretch" },
  primaryBtnText: { color: "#fff", fontWeight: "700", textAlign: "center", fontSize: 15 },
  chipsRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  chip: { borderColor: colors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontSize: 13 },
  chipTextActive: { color: "#fff", fontSize: 13, fontWeight: "700" },
  exitText: { color: colors.muted, fontSize: 12, marginTop: 14, textDecorationLine: "underline" },
  finishTitle: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 8 },
});
