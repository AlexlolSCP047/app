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
import { API_URL, Access, billingPortal, downgradePlan, me, upgradePlan } from "../api";
import { colors } from "../theme";

const PLAN_INFO: Record<string, { nombre: string; precio: string; desc: string }> = {
  basico: { nombre: "Básico", precio: "9,99 €/mes", desc: "Entrenamiento completo con IA" },
  pro: { nombre: "Pro", precio: "14,99 €/mes", desc: "Entrenamiento + dieta y análisis de comidas" },
};

/** Plan actual, cambio de plan y datos de pago/cuenta. */
export default function AccountScreen() {
  const [access, setAccess] = useState<Access | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDown, setConfirmDown] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    me()
      .then((d) => {
        setAccess(d.access);
        setName(d.user.name);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tier = access?.planTier === "basico" ? "basico" : "pro";
  const hasSub = access?.status === "active" || access?.status === "trialing" || access?.status === "past_due";
  const nextBilling = access?.currentPeriodEnd
    ? new Date(access.currentPeriodEnd).toLocaleDateString("es-ES", { day: "numeric", month: "long" })
    : null;

  async function changePlan(target: "basico" | "pro") {
    setBusy(target);
    setNotice(null);
    try {
      const d = target === "pro" ? await upgradePlan() : await downgradePlan();
      setAccess((a) => (a ? { ...a, planTier: target } : a));
      setConfirmDown(false);
      setNotice(d.message ?? "Plan actualizado.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "No se pudo cambiar el plan.");
    } finally {
      setBusy(null);
    }
  }

  async function openPortal() {
    try {
      const d = await billingPortal();
      if (d.url) await Linking.openURL(d.url);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "No se pudo abrir la gestión de pago.");
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
      {/* Plan actual */}
      <View style={[styles.card, { borderColor: colors.primaryDark }]}>
        <Text style={styles.label}>TU PLAN</Text>
        {hasSub ? (
          <>
            <Text style={styles.planName}>
              {PLAN_INFO[tier].nombre} <Text style={styles.planPrice}>· {PLAN_INFO[tier].precio}</Text>
            </Text>
            <Text style={styles.cardText}>{PLAN_INFO[tier].desc}</Text>
            {nextBilling && (
              <Text style={styles.small}>
                {access?.trialActive ? "Primer cobro" : "Próximo cobro"}: {nextBilling}
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.planName}>Sin suscripción activa</Text>
        )}
      </View>

      {notice && <Text style={{ color: colors.primary, marginBottom: 12 }}>{notice}</Text>}

      {/* Cambio de plan */}
      {hasSub && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Cambiar de plan</Text>
          {(["basico", "pro"] as const).map((k) => (
            <View key={k} style={[styles.planOption, tier === k && styles.planOptionActive]}>
              <Text style={styles.planOptionName}>
                {PLAN_INFO[k].nombre} <Text style={styles.small}>· {PLAN_INFO[k].precio}</Text>
              </Text>
              <Text style={styles.small}>{PLAN_INFO[k].desc}</Text>
              {tier === k ? (
                <Text style={styles.current}>✓ Tu plan actual</Text>
              ) : k === "pro" ? (
                <TouchableOpacity style={styles.btn} onPress={() => changePlan("pro")} disabled={busy !== null}>
                  {busy === "pro" ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>⭐ Subir a Pro</Text>}
                </TouchableOpacity>
              ) : confirmDown ? (
                <>
                  <Text style={[styles.small, { color: colors.warning, marginTop: 8 }]}>
                    Perderás la dieta y el análisis de comidas. ¿Seguro?
                  </Text>
                  <TouchableOpacity style={styles.btnOutline} onPress={() => changePlan("basico")} disabled={busy !== null}>
                    {busy === "basico" ? <ActivityIndicator color={colors.text} /> : <Text style={styles.btnOutlineText}>Sí, bajar a Básico</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.btnOutline} onPress={() => setConfirmDown(true)}>
                  <Text style={styles.btnOutlineText}>Bajar a Básico</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <Text style={styles.small}>
            La subida se aplica al momento (pagas solo la diferencia); la bajada entra en el próximo ciclo.
          </Text>
        </View>
      )}

      {/* Pago y cuenta */}
      {hasSub && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Datos de pago</Text>
          <TouchableOpacity style={styles.btnOutline} onPress={openPortal}>
            <Text style={styles.btnOutlineText}>💳 Cambiar tarjeta</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Cuenta</Text>
        <Text style={styles.cardText}>Nombre: {name}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          <TouchableOpacity onPress={() => Linking.openURL(`${API_URL}/olvide-contrasena`)}>
            <Text style={styles.link}>Cambiar contraseña</Text>
          </TouchableOpacity>
          <Text style={styles.small}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`${API_URL}/privacidad`)}>
            <Text style={styles.link}>Privacidad</Text>
          </TouchableOpacity>
          <Text style={styles.small}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`${API_URL}/eliminar-cuenta`)}>
            <Text style={styles.link}>Eliminar cuenta</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    marginBottom: 14,
  },
  label: { color: colors.primary, fontSize: 11, letterSpacing: 1 },
  planName: { color: colors.text, fontSize: 22, fontWeight: "800", marginTop: 4 },
  planPrice: { color: colors.muted, fontSize: 15, fontWeight: "400" },
  cardText: { color: colors.muted, fontSize: 13, marginTop: 4 },
  small: { color: colors.muted, fontSize: 11, marginTop: 6 },
  sectionTitle: { color: colors.text, fontWeight: "700", fontSize: 15, marginBottom: 8 },
  planOption: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  planOptionActive: { borderColor: colors.primary, backgroundColor: "rgba(44,156,110,0.08)" },
  planOptionName: { color: colors.text, fontWeight: "700", fontSize: 14 },
  current: { color: colors.primary, fontSize: 12, fontWeight: "700", marginTop: 8 },
  btn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, marginTop: 10 },
  btnText: { color: "#fff", fontWeight: "700", textAlign: "center", fontSize: 13 },
  btnOutline: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 10,
  },
  btnOutlineText: { color: colors.text, fontWeight: "600", textAlign: "center", fontSize: 13 },
  link: { color: colors.muted, fontSize: 11, textDecorationLine: "underline", marginTop: 6 },
});
