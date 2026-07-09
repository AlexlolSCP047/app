import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { RootStackParamList } from "../../App";
import { forgotPassword, login } from "../api";
import { colors } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Modo "olvidé mi contraseña": mismo campo de correo, otro botón
  const [forgotMode, setForgotMode] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  async function onForgot() {
    if (!email.trim()) {
      setError("Escribe primero tu correo electrónico.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar el correo.");
    } finally {
      setLoading(false);
    }
  }

  if (forgotMode) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
        {sent ? (
          <View style={styles.sentBox}>
            <Text style={styles.sentText}>
              📬 Si ese correo tiene cuenta, te hemos enviado un enlace para elegir una contraseña
              nueva. Revisa también la carpeta de spam.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Escribe el correo de tu cuenta y te enviaremos un enlace para elegir una nueva.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            {error && <Text style={styles.error}>{error}</Text>}
            <TouchableOpacity style={styles.btn} onPress={onForgot} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Enviarme el enlace</Text>
              )}
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          onPress={() => {
            setForgotMode(false);
            setSent(false);
            setError(null);
          }}
        >
          <Text style={styles.link}>← Volver a iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor={colors.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.btn} onPress={onSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Entrar</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setForgotMode(true)}>
        <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24 },
  title: { color: colors.text, fontSize: 20, fontWeight: "800", marginBottom: 8 },
  subtitle: { color: colors.muted, fontSize: 13, marginBottom: 16, lineHeight: 19 },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  error: { color: colors.danger, marginBottom: 12 },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  btnText: { color: "#fff", fontWeight: "700", textAlign: "center", fontSize: 16 },
  link: {
    color: colors.muted,
    textAlign: "center",
    marginTop: 18,
    fontSize: 13,
    textDecorationLine: "underline",
  },
  sentBox: {
    backgroundColor: colors.card,
    borderColor: colors.primaryDark,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  sentText: { color: colors.text, fontSize: 13, lineHeight: 20 },
});
