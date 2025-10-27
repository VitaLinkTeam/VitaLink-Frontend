import React from "react";
import { Text, View } from "react-native";
import Header from "../components/Header";
import { useAuth } from "@/context/AuthContext";
import PacienteView from "../components/PacienteView";
import MedicoView from "../components/MedicoView";
import Footer from "../components/Footer";
import AdminView from "../components/AdminView";

const roleNameToRol = (roleName: string | undefined): number => {
  switch (roleName) {
    case "Medico":
      return 1;
    case "Administrador":
      return 2;
    case "Paciente":
      return 3;
    case "Asistente":
      return 4;
    default:
      return 0;
  }
};

const getNombrePorRol = (rol: number) => {
  switch (rol) {
    case 1: return "Dra. Rafaela Amador";
    case 2: return "Administrador J";
    case 3: return "Fernando Lizano"
    case 4: return "Asistente S";
    default: return "Usuario";
  }
};

const HomeScreen = () => {
  const { user } = useAuth();

  const rol = roleNameToRol(user?.roleName);

  const nombre = getNombrePorRol(rol);

  const renderContentByRole = () => {
    switch (rol) {
      case 1: // Médico
        return <MedicoView />;
      case 3: // Paciente
        return <PacienteView />;
      case 2: // Administrador
      case 4: // Asistente
        return <AdminView />;
      default:
        return <Text style={{ padding: 20, textAlign: "center" }}>
          Rol no reconocido: {user?.roleName || "N/A"}
        </Text>;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header nombre={nombre} />
      {renderContentByRole()}
      <Footer />
    </View>
  );
};

export default HomeScreen;