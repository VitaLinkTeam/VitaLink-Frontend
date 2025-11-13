import React, { useEffect, useState } from "react";
import { Text, View, ActivityIndicator } from "react-native";
import Header from "../components/Header";
import { useAuth } from "@/context/AuthContext";
import PacienteView from "../components/PacienteView";
import MedicoView from "../components/MedicoView";
import Footer from "../components/Footer";
import AdminView from "../components/AdminView";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = "https://vitalink-backend-m2mm.onrender.com";

const roleNameToRol = (roleName: string | undefined): number => {
  switch (roleName) {
    case "Medico": return 1;
    case "Administrador": return 2;
    case "Paciente": return 3;
    case "Asistente": return 4;
    default: return 0;
  }
};

const HomeScreen = () => {
  const { user } = useAuth();
  const [nombreReal, setNombreReal] = useState<string>("Cargando...");
  const [loadingName, setLoadingName] = useState(true);

  const rol = roleNameToRol(user?.roleName);

  useEffect(() => {
    const fetchNombre = async () => {
      if (!user?.uid) {
        setNombreReal("Usuario");
        setLoadingName(false);
        return;
      }

      try {
        const token = await import('firebase/auth').then(m => m.getAuth().currentUser?.getIdToken());
        if (!token) throw new Error("No token");

        const response = await axios.get(`${BASE_URL}/api/auth/getname`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = response.data;
        setNombreReal(data.nombre || "Usuario");
      } catch (error) {
        console.warn("Error al obtener nombre:", error);
        setNombreReal(user?.nombre || "Usuario");
      } finally {
        setLoadingName(false);
      }
    };

    fetchNombre();
  }, [user?.uid]);

  const renderContentByRole = () => {
    switch (rol) {
      case 1: return <MedicoView />;
      case 3: return <PacienteView />;
      case 2:
      case 4: return <AdminView />;
      default:
        return <Text style={{ padding: 20, textAlign: "center" }}>
          Rol no reconocido: {user?.roleName || "N/A"}
        </Text>;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header nombre={loadingName ? "Cargando..." : nombreReal} />
      {renderContentByRole()}
      <Footer />
    </SafeAreaView>
  );
};

export default HomeScreen;