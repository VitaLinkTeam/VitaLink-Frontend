import React from "react";
import { Text, View } from "react-native";
import Header from "../components/Header";
import { useAuth } from "@/context/AuthContext";
import PacienteView from "../components/PacienteView";
import MedicoView from "../components/MedicoView";
import Footer from "../components/Footer";
import AdminView from "../components/AdminView";


const HomeScreen = () => {
  const { user } = useAuth();
  const nombre = getNombrePorRol(user?.rol ?? 0);

  const renderContentByRole = () => {
    switch (user?.rol) {
      case 1: // Médico
        return <MedicoView />;
      case 3: // Paciente
        return <PacienteView />;
      case 2: // Administrador
      case 4: // Asistente
        return <AdminView />;
      default:
        return <Text>Rol no reconocido</Text>;
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

const getNombrePorRol = (rol: number) => {
  switch (rol) {
    case 1: return "Dra. Rafaela Amador";
    case 2: return "Administrador J";
    case 3: return "Fernando Lizano";
    case 4: return "Asistente S";
    default: return "Usuario";
  }
};

export default HomeScreen;