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
  signup: (
    email: string,
    password: string,
    roleName: string,
    clinicaId: number | null,
    fotoURL: string,
    numeroTelefonico: string,
    usuarioNombre: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const router = useRouter();

  const fetchUserProfile = async (firebaseUser: FirebaseUser, retries = 5, delay = 1000) => {
    if (isFetching) return;
    setIsFetching(true);

    for (let i = 0; i < retries; i++) {
      try {
        const token = await firebaseUser.getIdToken();
        const response = await axios.post(
          `${BASE_URL}/api/auth/session`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = response.data;

        if (data.existsInDb) {
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
          router.replace("/HomeScreen"); // REDIRIGE AQUÍ
          setIsFetching(false);
          setLoading(false);
          return;
        } else {
          // Si no existe en DB → redirige a /register
          router.replace("/register");
          setIsFetching(false);
          setLoading(false);
          return;
        }
      } catch (error: any) {
        if (error.response?.status === 428 && i < retries - 1) {
          console.log(`Perfil no listo, reintentando... (${i + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Si es 428 y no hay más reintentos → no registrado
        if (error.response?.status === 428) {
          router.replace("/register");
          setIsFetching(false);
          setLoading(false);
          return;
        }

        console.error("Error en fetchUserProfile:", error);
        Alert.alert("Error", "No se pudo conectar al servidor.");
        setIsFetching(false);
        setLoading(false);
        return;
      }
    }

    // Si agotó reintentos → asumir no registrado
    router.replace("/register");
    setIsFetching(false);
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("Firebase user detected:", firebaseUser.email);
        await fetchUserProfile(firebaseUser);
      } else {
        setUser(null);
        setLoading(false);
        router.replace("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw error;
    }
  };

  const signup = async (
    email: string,
    password: string,
    roleName: string,
    clinicaId: number | null,
    fotoURL: string,
    numeroTelefonico: string,
    usuarioNombre: string
  ) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdToken();

      const body = {
        roleName,
        clinicaId,
        fotoURL,
        numeroTelefonico,
        usuarioNombre,
      };

      // LOG TEMPORAL PARA DEBUG
      console.log("🔄 ENVIANDO A BACKEND:", { body, url: `${BASE_URL}/api/auth/signup`, token: token.substring(0, 20) + "..." });

      await axios.post(`${BASE_URL}/api/auth/signup`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // NO REDIRIGIR AQUÍ
      // fetchUserProfile lo hará
    } catch (error: any) {
      console.error("Signup error:", error.response?.data || error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.warn("Logout backend error:", error);
    } finally {
      await signOut(auth);
      setUser(null);
      router.replace("/login");
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