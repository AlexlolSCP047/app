import { NativeStackScreenProps } from "@react-navigation/native-stack";
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
import type { RootStackParamList } from "../../App";
import { me, saveProfile } from "../api";
import { colors } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

const GOALS = ["perder grasa", "ganar músculo", "mejorar resistencia", "fuerza general"];
const LEVELS = ["principiante", "intermedio", "avanzado"];
const EQUIPMENT = ["gimnasio completo", "mancuernas y bandas en casa", "sin material (peso corporal)"];
const MINUTES = ["30", "45", "60", "90"];
const AREAS = ["pecho", "espalda", "piernas", "glúteos", "brazos", "core", "cardio"];
const SEXES = ["hombre", "mujer", "prefiero no decirlo"];

function Chips(props: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.chips}>
      {props.options.map((opt) => (
        <TouchableOpacity
          key={opt}
          onPress={() => props.onChange(opt)}
          style={[styles.chip, props.value === opt && styles.chipActive]}
        >
          <Text style={props.value === opt ? styles.chipTextActive : styles.chipText}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/** Chips de selección múltiple (zonas a priorizar). */
function MultiChips(props: { options: string[]; values: string[]; onToggle: (v: string) => void }) {
  return (
    <View style={styles.chips}>
      {props.options.map((opt) => {
        const active = props.values.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => props.onToggle(opt)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={active ? styles.chipTextActive : styles.chipText}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function ProfileScreen({ navigation }: Props) {
  const [goal, setGoal] = useState(GOALS[0]);
  const [level, setLevel] = useState(LEVELS[0]);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [equipment, setEquipment] = useState(EQUIPMENT[0]);
  const [sessionMins, setSessionMins] = useState("45");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [sex, setSex] = useState("");
  const [age, setAge] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [injuries, setInjuries] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    me()
      .then((data) => {
        const p = data.profile;
        if (p) {
          setGoal(p.goal);
          setLevel(p.level);
          setDaysPerWeek(p.daysPerWeek);
          setEquipment(p.equipment);
          setInjuries(p.injuries ?? "");
          setSessionMins(p.sessionMins ? String(p.sessionMins) : "45");
          setFocusAreas(p.focusAreas ? p.focusAreas.split(",").map((s) => s.trim()).filter(Boolean) : []);
          setSex(p.sex ?? "");
          setAge(p.age ? String(p.age) : "");
          setWeightKg(p.weightKg ? String(p.weightKg) : "");
          setHeightCm(p.heightCm ? String(p.heightCm) : "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function toggleArea(area: string) {
    setFocusAreas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      await saveProfile({
        goal,
        level,
        daysPerWeek,
        equipment,
        injuries: injuries || null,
        sessionMins: Number(sessionMins) || null,
        focusAreas: focusAreas.join(", ") || null,
        sex: sex || null,
        age: Number(age) || null,
        weightKg: Number(weightKg.replace(",", ".")) || null,
        heightCm: Number(heightCm) || null,
      });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
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
      <Text style={styles.label}>🎯 Objetivo</Text>
      <Chips options={GOALS} value={goal} onChange={setGoal} />

      <Text style={styles.label}>📊 Nivel</Text>
      <Chips options={LEVELS} value={level} onChange={setLevel} />

      <Text style={styles.label}>📅 Días por semana</Text>
      <Chips
        options={["1", "2", "3", "4", "5", "6", "7"]}
        value={String(daysPerWeek)}
        onChange={(v) => setDaysPerWeek(Number(v))}
      />

      <Text style={styles.label}>⏱️ Minutos por sesión</Text>
      <Chips options={MINUTES} value={sessionMins} onChange={setSessionMins} />

      <Text style={styles.label}>🏋️ Material disponible</Text>
      <Chips options={EQUIPMENT} value={equipment} onChange={setEquipment} />

      <Text style={styles.label}>💪 Zonas a priorizar (opcional, varias)</Text>
      <MultiChips options={AREAS} values={focusAreas} onToggle={toggleArea} />

      <Text style={styles.label}>🧍 Sexo (opcional)</Text>
      <Chips options={SEXES} value={sex} onChange={setSex} />

      <Text style={styles.label}>Datos físicos (opcional)</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Edad"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          value={age}
          onChangeText={setAge}
        />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Peso (kg)"
          placeholderTextColor={colors.muted}
          keyboardType="decimal-pad"
          value={weightKg}
          onChangeText={setWeightKg}
        />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Altura (cm)"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          value={heightCm}
          onChangeText={setHeightCm}
        />
      </View>

      <Text style={styles.label}>🩹 Lesiones o limitaciones (opcional)</Text>
      <TextInput
        style={[styles.input, { minHeight: 60 }]}
        placeholder="Ej.: molestias en la rodilla derecha"
        placeholderTextColor={colors.muted}
        value={injuries}
        onChangeText={setInjuries}
        multiline
      />

      {error && <Text style={{ color: colors.danger, marginTop: 12 }}>{error}</Text>}
      <TouchableOpacity style={styles.btn} onPress={onSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Guardar perfil</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  label: { color: colors.text, fontWeight: "700", marginBottom: 8, marginTop: 16 },
  row: { flexDirection: "row", gap: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: "top",
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
    marginBottom: 40,
  },
  btnText: { color: "#fff", fontWeight: "700", textAlign: "center", fontSize: 16 },
});
