import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { getToken, Plan } from "./src/api";
import { colors } from "./src/theme";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import PlanScreen from "./src/screens/PlanScreen";
import WorkoutScreen from "./src/screens/WorkoutScreen";
import LibraryScreen from "./src/screens/LibraryScreen";
import ProgressScreen from "./src/screens/ProgressScreen";
import ClassesScreen from "./src/screens/ClassesScreen";
import DietScreen from "./src/screens/DietScreen";
import ChatScreen from "./src/screens/ChatScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Plan: undefined;
  Workout: { dia: Plan["dias"][number] };
  Library: undefined;
  Classes: undefined;
  Diet: undefined;
  Progress: undefined;
  Chat: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    primary: colors.primary,
    border: colors.border,
  },
};

export default function App() {
  const [initialRoute, setInitialRoute] = useState<"Welcome" | "Home" | null>(null);

  useEffect(() => {
    getToken().then((token) => setInitialRoute(token ? "Home" : "Welcome"));
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme}>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Entrar" }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Crear cuenta" }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "FitCoach IA", headerBackVisible: false }} />
        <Stack.Screen name="Plan" component={PlanScreen} options={{ title: "Mi plan" }} />
        <Stack.Screen name="Workout" component={WorkoutScreen} options={{ title: "Entrenando 🔥" }} />
        <Stack.Screen name="Library" component={LibraryScreen} options={{ title: "Ejercicios" }} />
        <Stack.Screen name="Classes" component={ClassesScreen} options={{ title: "Clases guiadas" }} />
        <Stack.Screen name="Diet" component={DietScreen} options={{ title: "Dieta y comidas" }} />
        <Stack.Screen name="Progress" component={ProgressScreen} options={{ title: "Mi progreso" }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "Chat con la IA" }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Mi perfil" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
