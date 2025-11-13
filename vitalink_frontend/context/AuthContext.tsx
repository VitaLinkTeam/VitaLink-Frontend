// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { Usuario } from "@/models/Usuario";
import { Alert } from "react-native";
import { auth } from "@/services/firebaseAuth";
import axios from "axios";
import { useRouter } from "expo-router";

const BASE_URL = "https://vitalink-backend-m2mm.onrender.com";

type AuthContextType = {
  user: Usuario | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, roleName: string, clinicaId: number | null, fotoURL: string, numeroTelefonico: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const router = useRouter();

  // === OBTENER PERFIL DEL BACKEND ===
  const fetchUserProfile = async (firebaseUser: FirebaseUser) => {
    if (isFetching) return;
    setIsFetching(true);

    try {
      const token = await firebaseUser.getIdToken();
      const response = await axios.post(
        `${BASE_URL}/api/auth/session`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;
      const userData: Usuario = {
        uid: data.uid,
        email: data.email || firebaseUser.email || "",
        fotoURL: data.picture || undefined,
        numeroTelefonico: data.numeroTelefonico || undefined,
        emailVerificado: data.emailVerificado ?? false,
        roleName: data.roleName || undefined,
        clinicaId: data.clinicaId || null,
        existsInDb: true,
      };

      setUser(userData);

      // Si no tiene rol o no existe en DB → redirigir a registro
      if (!data.roleName || !data.existsInDb) {
        router.replace("/register");
        return;
      }

      router.replace("/HomeScreen");

    } catch (error: any) {
      console.error("Error fetching profile:", error.response?.data || error.message);

      // CASO 1: 428 profile_not_found → usuario existe en Firebase, pero NO en backend
      if (error.response?.status === 428 && error.response?.data?.error === "profile_not_found") {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          existsInDb: false,
        });

        Alert.alert(
          "Completa tu registro",
          "Tu cuenta necesita configuración. Serás redirigido al registro.",
          [{ text: "OK", onPress: () => router.replace("/register") }]
        );
        return;
      }

      // CASO 2: 401/403 → token inválido
      if (error.response?.status === 401 || error.response?.status === 403) {
        await signOut(auth);
        setUser(null);
        Alert.alert("Sesión expirada", "Por favor, inicia sesión nuevamente.");
        return;
      }

      // CASO 3: Error de red
      if (error.request) {
        Alert.alert("Sin conexión", "No se pudo conectar al servidor. Revisa tu internet.");
        return;
      }

      // CASO 4: Error genérico
      Alert.alert("Error", "No se pudo cargar tu perfil. Intenta de nuevo.");
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  // === ESCUCHAR AUTENTICACIÓN DE FIREBASE ===
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // === LOGIN (solo Firebase) ===
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // NO redirigir aquí → fetchUserProfile decide
    } catch (error: any) {
      throw error;
    }
  };

  // === SIGNUP (Firebase + Backend) ===
  const signup = async (
    email: string,
    password: string,
    roleName: string,
    clinicaId: number | null,
    fotoURL: string,
    numeroTelefonico: string
  ) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdToken();

      const body = { roleName, clinicaId, fotoURL, numeroTelefonico };
      await axios.post(`${BASE_URL}/api/auth/signup`, body, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      await fetchUserProfile(credential.user);
    } catch (error: any) {
      console.error("Signup error:", error.response?.data || error.message);
      throw error;
    }
  };

  // === LOGOUT ===
  const logout = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        await axios.post(`${BASE_URL}/api/auth/logout`, {}, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (error) {
      console.warn("Logout backend error:", error);
    } finally {
      await signOut(auth);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};