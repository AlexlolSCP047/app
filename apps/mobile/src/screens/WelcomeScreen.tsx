import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackParamList } from "../../App";
import { colors } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>
        Fit<Text style={{ color: colors.primary }}>Coach</Text> IA
      </Text>
      <Text style={styles.title}>Tu entrenador personal con inteligencia artificial</Text>
      <Text style={styles.subtitle}>
        Planes de entrenamiento a tu medida y un entrenador disponible 24/7. Prueba 1 día gratis
        y después 14,99 €/mes.
      </Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate("Register")}>
        <Text style={styles.primaryBtnText}>Empezar mi prueba gratis</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate("Login")}>
        <Text style={styles.secondaryBtnText}>Ya tengo cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: 24,
  },
  logo: { color: colors.text, fontSize: 28, fontWeight: "800", textAlign: "center" },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 24,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 40,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", textAlign: "center", fontSize: 16 },
  secondaryBtn: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 12,
  },
  secondaryBtnText: { color: colors.text, fontWeight: "600", textAlign: "center", fontSize: 16 },
});
