import { Stack } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import 'react-native-get-random-values'; // Agregar el polyfill aquí

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
      ) : (
        <>
          <Stack.Screen
            name="login"
            options={{
              title: "Iniciar Sesión",
              headerStyle: { backgroundColor: "#fff" },
              headerShown: false
            }}
          />
          <Stack.Screen
            name="register"
            options={{
              title: "Registro",
              headerStyle: { backgroundColor: "#fff" },
            }}
          />
        </>
      )}
    </Stack>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}