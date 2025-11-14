// LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { login, loading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor ingresa un correo electrónico y una contraseña.");
      return;
    }

    try {
      await login(email, password);
      // NO redirigir aquí → AuthContext decide
    } catch (error: any) {
      Alert.alert("Error", "Credenciales inválidas. Inténtalo de nuevo.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.mainRectangle}>
          <Image
            style={styles.logo}
            source={require("../assets/images/medical_logo_placeholder.png")}
          />
          <Text style={styles.titleText}>¡Bienvenido!</Text>

          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Correo electrónico"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              style={styles.textInput}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              placeholder="Contraseña"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.textInput}
            />
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Cargando..." : "Iniciar Sesión"}
            </Text>
          </TouchableOpacity>

          {/* BOTÓN DE REGISTRO CENTRADO Y AJUSTADO */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.registerButtonText}>
              ¿No tienes una cuenta? Regístrate
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#007AFF',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  mainRectangle: {
    width: '90%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 15,
  },
  titleText: {
    fontSize: 24,
    color: '#333',
    marginBottom: 20,
    fontWeight: '600',
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  textInput: {
    width: '90%',
    height: 50,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  loginButton: {
    width: '90%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerButton: {
    width: '90%',
    height: 50, // ← MISMO ALTO QUE INPUTS
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: '#FFFFFF',
  },
  buttonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  registerButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default LoginScreen;