import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { RootStackParamList } from "../../App";
import { API_URL, Access, logout, me } from "../api";
import { colors } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const [access, setAccess] = useState<Access | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      me()
        .then((data) => {
          setName(data.user.name);
          setAccess(data.access);
          setHasProfile(Boolean(data.profile));
        })
        .catch(() => {
          navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
        })
        .finally(() => setLoading(false));
    }, [navigation]),
  );

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.greeting}>Hola, {name} 👋</Text>

      {/* Estado de acceso */}
      {access?.status === "active" ? (
        <View style={[styles.banner, { borderColor: colors.primaryDark }]}>
          <Text style={{ color: colors.primary }}>✓ Suscripción activa — Plan Pro</Text>
        </View>
      ) : access?.trialActive ? (
        <View style={[styles.banner, { borderColor: colors.primaryDark }]}>
          <Text style={{ color: colors.primary }}>
            🎁 Prueba gratuita: te {trialDaysLeft === 1 ? "queda 1 día" : `quedan ${trialDaysLeft} días`}. Después, 9,99 €/mes.
          </Text>
        </View>
      ) : (
        <View style={[styles.banner, { borderColor: colors.warning }]}>
          <Text style={{ color: colors.warning }}>
            Activa tus 7 días de prueba gratis (9,99 €/mes después).
          </Text>
          <TouchableOpacity
            style={styles.subscribeBtn}
            onPress={() => Linking.openURL(`${API_URL}/login`)}
          >
            <Text style={styles.subscribeBtnText}>Activar mi prueba en la web</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Menú principal */}
      <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate("Profile")}>
        <Text style={styles.menuTitle}>📋 Mi perfil</Text>
        <Text style={styles.menuText}>
          {hasProfile
            ? "Objetivo, nivel, material y lesiones."
            : "Complétalo para que la IA diseñe tu plan."}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate("Plan")}>
        <Text style={styles.menuTitle}>🏋️ Mi plan de entrenamiento</Text>
        <Text style={styles.menuText}>Tu semana completa generada por la IA.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate("Chat")}>
        <Text style={styles.menuTitle}>💬 Chat con tu entrenador</Text>
        <Text style={styles.menuText}>Dudas de técnica, cambios de ejercicios, nutrición…</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logout} onPress={onLogout}>
        <Text style={{ color: colors.muted }}>Cerrar sesión</Text>
      </TouchableOpacity>
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
    marginBottom: 20,
    gap: 10,
  },
  subscribeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
  },
  subscribeBtnText: { color: "#fff", fontWeight: "700", textAlign: "center" },
  menuCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
  },
  menuTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  menuText: { color: colors.muted, marginTop: 4, fontSize: 13 },
  logout: { alignItems: "center", marginTop: 24, padding: 12 },
});
