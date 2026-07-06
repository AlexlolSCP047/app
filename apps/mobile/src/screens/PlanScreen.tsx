import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { generatePlan, getPlan, Plan } from "../api";
import { colors } from "../theme";

export default function PlanScreen() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPlan()
      .then((data) => setPlan(data.plan?.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

          {plan.dias.map((dia) => (
            <View key={dia.dia} style={styles.card}>
              <Text style={styles.cardTitle}>
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
            </View>
          ))}

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
  cardTitle: { color: colors.text, fontWeight: "700", fontSize: 15, marginBottom: 8 },
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
