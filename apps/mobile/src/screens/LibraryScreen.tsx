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
import * as Linking from "expo-linking";
import { ExerciseDetail, Substitution, exerciseDetail, exerciseSubstitute, getPlan } from "../api";
import { exerciseVideoUrl } from "../classes";
import { colors } from "../theme";

/** Enciclopedia de ejercicios: la IA explica técnica, músculos y errores. */
export default function LibraryScreen() {
  const [query, setQuery] = useState("");
  const [planExercises, setPlanExercises] = useState<string[]>([]);
  const [detail, setDetail] = useState<ExerciseDetail | null>(null);
  const [substitution, setSubstitution] = useState<Substitution | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPlan()
      .then((data) => {
        const names = new Set<string>();
        data.plan?.data.dias.forEach((d) => d.ejercicios.forEach((e) => names.add(e.nombre)));
        setPlanExercises(Array.from(names));
      })
      .catch(() => {});
  }, []);

  async function search(name: string) {
    if (!name.trim()) return;
    setLoading("detail");
    setError(null);
    setSubstitution(null);
    try {
      const data = await exerciseDetail(name.trim());
      setDetail(data.detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo obtener la ficha.");
    } finally {
      setLoading(null);
    }
  }

  async function substitute() {
    if (!detail) return;
    setLoading("sub");
    setError(null);
    try {
      const data = await exerciseSubstitute(detail.nombre);
      setSubstitution(data.substitution);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo obtener la alternativa.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.hint}>
        Busca cualquier ejercicio y la IA te explica cómo hacerlo bien.
      </Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Ej.: press banca, sentadilla búlgara…"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => search(query)}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => search(query)} disabled={loading === "detail"}>
          {loading === "detail" ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchBtnText}>Buscar</Text>}
        </TouchableOpacity>
      </View>

      {planExercises.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>DE TU PLAN ACTUAL</Text>
          <View style={styles.chips}>
            {planExercises.map((name) => (
              <TouchableOpacity key={name} style={styles.chip} onPress={() => search(name)}>
                <Text style={styles.chipText}>{name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {error && <Text style={{ color: colors.danger, marginTop: 12 }}>{error}</Text>}

      {detail && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{detail.nombre}</Text>
          <Text style={styles.muscles}>💪 {detail.musculos.join(" · ")}</Text>

          <Text style={styles.subTitle}>Técnica</Text>
          {detail.tecnica.map((t, i) => (
            <Text key={i} style={styles.item}>
              {i + 1}. {t}
            </Text>
          ))}

          <Text style={styles.subTitle}>Errores comunes</Text>
          {detail.errores.map((t, i) => (
            <Text key={i} style={styles.item}>
              • {t}
            </Text>
          ))}

          <Text style={styles.tip}>💡 {detail.consejo}</Text>

          <TouchableOpacity style={styles.subBtn} onPress={() => Linking.openURL(exerciseVideoUrl(detail.nombre))}>
            <Text style={styles.subBtnText}>🎬 Ver vídeo del ejercicio</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.subBtn} onPress={substitute} disabled={loading === "sub"}>
            {loading === "sub" ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.subBtnText}>🔄 Proponme una alternativa</Text>
            )}
          </TouchableOpacity>

          {substitution && (
            <View style={styles.subCard}>
              <Text style={styles.subCardTitle}>Alternativa: {substitution.alternativa}</Text>
              <Text style={styles.subCardText}>{substitution.motivo}</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hint: { color: colors.muted, fontSize: 13, marginBottom: 12 },
  searchRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  searchBtnText: { color: "#fff", fontWeight: "700" },
  sectionLabel: { color: colors.muted, fontSize: 11, letterSpacing: 1, marginTop: 18, marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: { color: colors.text, fontSize: 12 },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginTop: 20,
    marginBottom: 30,
  },
  cardTitle: { color: colors.text, fontSize: 20, fontWeight: "800" },
  muscles: { color: colors.primary, fontSize: 13, marginTop: 6 },
  subTitle: { color: colors.text, fontWeight: "700", marginTop: 16, marginBottom: 6 },
  item: { color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 3 },
  tip: { color: colors.text, fontSize: 13, marginTop: 16, lineHeight: 20 },
  subBtn: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 18,
  },
  subBtnText: { color: colors.text, fontWeight: "600", textAlign: "center", fontSize: 13 },
  subCard: {
    backgroundColor: colors.background,
    borderColor: colors.primaryDark,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  subCardTitle: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  subCardText: { color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 18 },
});
