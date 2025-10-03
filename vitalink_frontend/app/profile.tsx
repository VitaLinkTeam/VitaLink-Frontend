import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import Header from "../components/Header";
import Footer from "../components/Footer";

const ProfileScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const rol = user?.rol;

  const getNombrePorRol = () => {
    switch (rol) {
      case 1: return "Dra. Rafaela Amador";
      case 2: return "Administrador J";
      case 4: return "Asistente S";
      case 3: default: return "Fernando Lizano";
    }
  };

  const getDefaultProfile = () => {
    switch (rol) {
      case 1:
        return {
          titulo: "Dra",
          nombre: "Rafaela Amador",
          correo: "medico@gmail.com",
          clinica: "Multicentro Escazú",
        };
      case 2:
        return {
          titulo: "",
          nombre: "Administrador J",
          correo: "admin@gmail.com",
          clinica: "Multicentro Escazú",
        };
      case 4:
        return {
          titulo: "",
          nombre: "Asistente S",
          correo: "asistente@gmail.com",
          clinica: "Multicentro Escazú",
        };
      case 3:
      default:
        return {
          titulo: "",
          nombre: "Fernando Lizano",
          correo: "paciente@gmail.com",
          clinica: "",
        };
    }
  };

  const defaults = getDefaultProfile();

  const [titulo, setTitulo] = useState(defaults.titulo);
  const [nombre, setNombre] = useState(defaults.nombre);
  const [correo, setCorreo] = useState(defaults.correo);
  const [clinica, setClinica] = useState(defaults.clinica);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header nombre={getNombrePorRol()} />

      <ScrollView style={styles.container}>
        <Text style={styles.title}>Perfil</Text>

        {/* Imagen de perfil + icono para editar */}
        <View style={styles.avatarContainer}>
          <Image
            source={require("../assets/images/user_placeholder.png")}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editIcon}>
            <Ionicons name="create-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Campo: Titulo (solo medico puede ver esto) */}
        {rol === 1 && (
          <View style={styles.field}>
            <Text style={styles.label}>Título</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={titulo}
                onChangeText={setTitulo}
                style={styles.input}
              />
              <Ionicons name="create-outline" size={20} color="#007AFF" />
            </View>
          </View>
        )}

        {/* Campo: Nombre */}
        <View style={styles.field}>
          <Text style={styles.label}>Nombre</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={nombre}
              onChangeText={setNombre}
              style={styles.input}
            />
            <Ionicons name="create-outline" size={20} color="#007AFF" />
          </View>
        </View>

        {/* Campo: Correo */}
        <View style={styles.field}>
          <Text style={styles.label}>Correo</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={correo}
              onChangeText={setCorreo}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Ionicons name="create-outline" size={20} color="#007AFF" />
          </View>
        </View>

        {/* Campo de Clinica asociada (solo no se muestra a pacientes) */}
        {rol !== 3 && (
          <View style={styles.field}>
            <Text style={styles.label}>Clínica asociada</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={clinica}
                onChangeText={setClinica}
                style={styles.input}
              />
              <Ionicons name="create-outline" size={20} color="#007AFF" />
            </View>
          </View>
        )}

        {/* Boton para guardar cambios */}
        <TouchableOpacity style={styles.saveButton} onPress={() => console.log("Guardar cambios")}>
          <Text style={styles.saveText}>Guardar Cambios</Text>
        </TouchableOpacity>

        {/* Boton de horario */}
        {(rol === 1 || rol === 2) && (
          <TouchableOpacity style={styles.scheduleButton} onPress={() => router.push("/schedule")}>
            <Text style={styles.scheduleText}>Modificar Horario</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Footer */}
      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#007AFF",
    textAlign: "center",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 30,
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIcon: {
    position: "absolute",
    right: 100 / 2 - 10,
    bottom: -10,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 4,
    elevation: 3,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    color: "#000",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 30,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  scheduleButton: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 20,
  },
  scheduleText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ProfileScreen;