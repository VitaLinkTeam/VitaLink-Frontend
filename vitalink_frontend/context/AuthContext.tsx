import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { usuariosMock } from "@/datasource/datasource";

type User = {
  id: string;
  email: string;
  rol: number;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      setTimeout(() => {
        setUser(null); 
        setLoading(false);
      }, 1000);
    };
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
  const user = usuariosMock.find(
    (u) => u.VA_email === email && u.password === password
  );

  if (user) {
    setUser({
      id: user.VA_uid,
      email: user.VA_email,
      rol: user.IN_FK_role,
    });
    console.log("¡Usuario logueado con éxito!", user); // Añade esta línea
  } else {
    throw new Error("Credenciales inválidas");
  }
};

  const logout = () => {
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
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};