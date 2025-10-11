import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { Usuario } from "@/models/Usuario"; 
import  { auth } from "@/services/firebaseAuth"; 

type AuthContextType = {
  user: Usuario | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userData: Usuario = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
        };
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;

      const userData: Usuario = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
      };

      setUser(userData);
      console.log("✅ Usuario autenticado:", firebaseUser.email);
    } catch (error: any) {
      console.error("❌ Error al iniciar sesión:", error.message);
      throw new Error("Credenciales inválidas o usuario no encontrado");
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};
