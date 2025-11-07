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
import { Alert, Platform } from "react-native";
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
  const [isFetching, setIsFetching] = useState(false); // Evita duplicados
  const router = useRouter();

  // === FUNCIÓN PARA OBTENER PERFIL DEL BACKEND ===
  const fetchUserProfile = async (firebaseUser: FirebaseUser) => {
    if (isFetching) return; // Evita calls duplicados
    setIsFetching(true);
    try {
      const token = await firebaseUser.getIdToken();
      console.log("🔍 Fetching profile from backend with token:", token.substring(0, 20) + "...");
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
      console.log("✅ Backend response:", data);
      const userData: Usuario = {
        uid: data.uid,
        email: data.email || firebaseUser.email || "",
        fotoURL: data.picture || undefined,
        numeroTelefonico: data.numeroTelefonico || undefined,
        emailVerificado: data.emailVerificado ?? false,
        roleName: data.roleName || undefined,
        clinicaId: data.clinicaId || null,
        existsInDb: data.existsInDb === true,
      };
      setUser(userData);
      console.log("🆕 User updated:", userData);
      if (!data.existsInDb) {
        console.warn("⚠️ No registrado. Redirigiendo a /register...");
        router.replace("/register");
        return;
      }
      if (!data.roleName) {
        Alert.alert("Error", "Rol no configurado. Contacta soporte.");
        return;
      }
      router.replace("/HomeScreen");
    } catch (error: any) {
      console.error("❌ Error fetching profile FULL DETAILS:");
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      console.error("Error config:", error.config);
      console.error("Error response:", error.response);
      console.error("Error stack:", error.stack);
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          await signOut(auth);
          setUser(null);
          Alert.alert("Sesión inválida", "Inicia sesión nuevamente.");
        } else if (error.response.data?.message?.includes("no está registrada")) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            existsInDb: false,
          });
          router.replace("/register");
        } else {
          Alert.alert("Error del servidor", `Código: ${error.response.status}. Mensaje: ${error.response.data?.message || "Desconocido"}`);
        }
      } else if (error.request) {
        Alert.alert("Error de red", "No se pudo conectar al backend. Intenta de nuevo.");
      } else {
        Alert.alert("Error", "No se pudo cargar el perfil. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  // === ESCUCHAR CAMBIOS DE AUTENTICACIÓN ===
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("🔄 Firebase user detected:", firebaseUser.email);
        await fetchUserProfile(firebaseUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // === LOGIN ===
  const login = async (email: string, password: string) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ Firebase login OK:", credential.user.email);
    } catch (error: any) {
      //solo para dev: console.error("❌ Login error:", error.message);
      throw error;
    }
  };

  // === SIGNUP ===
  const signup = async (email: string, password: string, roleName: string, clinicaId: number | null, fotoURL: string, numeroTelefonico: string) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdToken();
      console.log("✅ Firebase signup OK:", credential.user.email);

      const body = {
        roleName,
        clinicaId,
        fotoURL,
        numeroTelefonico,
      };

      const response = await axios.post(
        `${BASE_URL}/api/auth/signup`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("✅ Backend signup OK:", response.data);

      await fetchUserProfile(credential.user);
    } catch (error: any) {
      console.error("❌ Signup error:", error.response?.data || error.message);
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
      console.warn("⚠️ Logout backend error:", error);
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