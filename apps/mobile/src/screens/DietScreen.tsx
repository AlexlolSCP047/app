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
import { DietData, MealAnalysis, analyzeMeal, generateDiet, getDiet, upgradePlan } from "../api";
import { colors } from "../theme";

/** Dieta generada por IA + analizador de comidas. */
export default function DietScreen() {
  const [diet, setDiet] = useState<DietData | null>(null);
  const [meal, setMeal] = useState("");
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsPro, setNeedsPro] = useState(false);

  async function onUpgrade() {
    setBusy("upgrade");
    setError(null);
    try {
      await upgradePlan();
      setNeedsPro(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo mejorar el plan.");
    } finally {
      setBusy(null);
    }
  }

  function handleErr(e: unknown, fallback: string) {
    const err = e as Error & { code?: string };
    if (err?.code === "PLAN_BASIC") setNeedsPro(true);
    else setError(err instanceof Error ? err.message : fallback);
  }


  useEffect(() => {
    getDiet().then((d) => d.diet && setDiet(d.diet.data)).catch(() => {});
  }, []);

  async function onGenerate() {
    setBusy("diet");
    setError(null);
    try {
      const d = await generateDiet();
      setDiet(d.diet.data);
    } catch (e) {
      handleErr(e, "No se pudo generar la dieta.");
    } finally {
      setBusy(null);
    }
  }

  async function onAnalyze() {
    if (!meal.trim()) return;
    setBusy("meal");
    setError(null);
    setAnalysis(null);
    try {
      const d = await analyzeMeal(meal.trim());
      setAnalysis(d.analysis);
    } catch (e) {
      handleErr(e, "No se pudo analizar la comida.");
    } finally {
      setBusy(null);
    }
  }

  if (needsPro) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
        <View style={[styles.card, { alignItems: "center" }]}>
          <Text style={{ fontSize: 40 }}>⭐</Text>
          <Text style={[styles.cardTitle, { fontSize: 18, marginTop: 8 }]}>Dieta y comidas — plan Pro</Text>
          <Text style={[styles.cardText, { textAlign: "center" }]}>
            Tu plan Básico incluye todo el entrenamiento. Pásate al Pro por 14,99 €/mes y añade tu
            dieta con macros y el análisis de comidas. Solo pagas la diferencia prorrateada.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={onUpgrade} disabled={busy === "upgrade"}>
            {busy === "upgrade" ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>⭐ Pasar al plan Pro</Text>}
          </TouchableOpacity>
          {error && <Text style={{ color: colors.danger, marginTop: 10 }}>{error}</Text>}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {/* Analizador */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔍 Análisis de comidas</Text>
        <Text style={styles.cardText}>Cuéntale a la IA qué has comido y te dirá calorías, macros y cómo mejorarlo.</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej.: macarrones con tomate y atún, y un yogur"
          placeholderTextColor={colors.muted}
          value={meal}
          onChangeText={setMeal}
          multiline
        />
        <TouchableOpacity style={styles.btn} onPress={onAnalyze} disabled={busy === "meal"}>
          {busy === "meal" ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Analizar</Text>}
        </TouchableOpacity>
        {analysis && (
          <View style={styles.resultBox}>
            <View style={styles.tagRow}>
              <Text style={styles.tag}>🔥 {analysis.kcal} kcal</Text>
              <Text style={styles.tag}>🥩 {analysis.proteinasG} g</Text>
              <Text style={styles.tag}>🍞 {analysis.carbohidratosG} g</Text>
              <Text style={styles.tag}>🥑 {analysis.grasasG} g</Text>
            </View>
            <Text style={[styles.cardText, { marginTop: 8 }]}>{analysis.valoracion}</Text>
            <Text style={styles.tip}>💡 {analysis.sugerencia}</Text>
          </View>
        )}
      </View>

      {/* Dieta */}
      <TouchableOpacity style={[styles.btn, { marginTop: 16 }]} onPress={onGenerate} disabled={busy === "diet"}>
        {busy === "diet" ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>{diet ? "Regenerar mi dieta" : "🍽️ Generar mi dieta con IA"}</Text>
        )}
      </TouchableOpacity>
      {busy === "diet" && <Text style={styles.hint}>Diseñando tu día de alimentación…</Text>}
      {error && <Text style={{ color: colors.danger, marginTop: 10 }}>{error}</Text>}

      {diet && (
        <View style={{ marginTop: 16 }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎯 {diet.objetivoCalorias} kcal/día</Text>
            <Text style={styles.cardText}>{diet.resumen}</Text>
          </View>
          {diet.comidas.map((c, i) => (
            <View key={i} style={styles.card}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.cardTitle}>
                  {c.nombre} <Text style={{ color: colors.muted, fontWeight: "400", fontSize: 12 }}>· {c.hora}</Text>
                </Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>{c.kcal} kcal</Text>
              </View>
              <Text style={styles.cardText}>{c.descripcion}</Text>
              <Text style={styles.macros}>
                🥩 {c.proteinasG} g · 🍞 {c.carbohidratosG} g · 🥑 {c.grasasG} g
              </Text>
            </View>
          ))}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Consejos</Text>
            {diet.consejos.map((c, i) => (
              <Text key={i} style={styles.cardText}>• {c}</Text>
            ))}
          </View>
          <Text style={styles.disclaimer}>
            ⚠️ Orientativo: no sustituye el consejo de un dietista-nutricionista.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { color: colors.text, fontWeight: "700", fontSize: 15, marginBottom: 6 },
  cardText: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 10,
    minHeight: 48,
    textAlignVertical: "top",
  },
  btn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, marginTop: 12 },
  btnText: { color: "#fff", fontWeight: "700", textAlign: "center", fontSize: 15 },
  hint: { color: colors.muted, textAlign: "center", marginTop: 8, fontSize: 12 },
  resultBox: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    color: colors.text,
    fontSize: 12,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: "hidden",
  },
  tip: { color: colors.primary, fontSize: 13, marginTop: 8 },
  macros: { color: colors.muted, fontSize: 11, marginTop: 6 },
  disclaimer: { color: colors.muted, fontSize: 11, marginTop: 4, marginBottom: 30, opacity: 0.7 },
});
