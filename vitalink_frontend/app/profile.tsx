import React, { useState, useEffect } from "react";
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
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = "https://vitalink-backend-m2mm.onrender.com";

const ProfileScreen = () => {
  const { user } = useAuth();
  const router = useRouter();

  // === ESTADO NOMBRE REAL ===
  const [nombreReal, setNombreReal] = useState<string>("Cargando...");
  const [loadingName, setLoadingName] = useState(true);

  // === ROL ===
  const roleName = user?.roleName;
  const isPaciente = roleName === "Paciente";
  const isMedico = roleName === "Médico";
  const isAdmin = roleName === "Administrador";
  const isAsistente = roleName === "Asistente";

  // === CARGAR NOMBRE REAL ===
  useEffect(() => {
    const fetchNombre = async () => {
      if (!user?.uid) {
        setNombreReal("Usuario");
        setLoadingName(false);
        return;
      }

      try {
        const { getAuth } = await import("firebase/auth");
        const token = await getAuth().currentUser?.getIdToken();
        if (!token) throw new Error("No token");

        const response = await axios.get(`${BASE_URL}/api/auth/getname`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const nombre = response.data.nombre || user?.nombre || "Usuario";
        setNombreReal(nombre);
      } catch (error) {
        console.warn("Error al obtener nombre:", error);
        setNombreReal(user?.nombre || "Usuario");
      } finally {
        setLoadingName(false);
      }
    };

    fetchNombre();
  }, [user?.uid]);

  // === DATOS DEL PERFIL (iniciales) ===
  const [titulo, setTitulo] = useState(isMedico ? "Dra." : "");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState(user?.email || "");
  const [clinica, setClinica] = useState("");

  // === CARGAR DATOS INICIALES DESDE BACKEND O DEFAULTS ===
  useEffect(() => {
    if (loadingName) return;

    // Valores por defecto según rol
    const defaults: any = {
      Médico: { titulo: "Dra.", nombre: "Rafaela Amador", correo: "medico@gmail.com", clinica: "Multicentro Escazú" },
      Administrador: { titulo: "", nombre: "Administrador J", correo: "admin@gmail.com", clinica: "Multicentro Escazú" },
      Asistente: { titulo: "", nombre: "Asistente S", correo: "asistente@gmail.com", clinica: "Multicentro Escazú" },
      Paciente: { titulo: "", nombre: nombreReal, correo: user?.email || "", clinica: "" },
    };

    const rolActual = roleName || "Paciente";
    const data = defaults[rolActual] || defaults.Paciente;

    setTitulo(data.titulo);
    setNombre(data.nombre);
    setCorreo(data.correo);
    setClinica(data.clinica);
  }, [loadingName, nombreReal, roleName, user?.email]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header nombre={loadingName ? "Cargando..." : nombreReal} />

      {/* CONTENEDOR FLEXIBLE */}
      <View style={styles.contentContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Perfil</Text>

          {/* AVATAR */}
          <View style={styles.avatarContainer}>
            <Image
              source={require("../assets/images/user_placeholder.png")}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editIcon}>
              <Ionicons name="create-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {/* TÍTULO (solo médico) */}
          {isMedico && (
            <View style={styles.field}>
              <Text style={styles.label}>Título</Text>
              <View style={styles.inputRow}>
                <TextInput
                  value={titulo}
                  onChangeText={setTitulo}
                  style={styles.input}
                  placeholder="Ej: Dra."
                />
                <Ionicons name="create-outline" size={20} color="#007AFF" />
              </View>
            </View>
          )}

          {/* NOMBRE */}
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

          {/* CORREO */}
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

          {/* CLÍNICA (no pacientes) */}
          {!isPaciente && (
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

          {/* GUARDAR */}
          <TouchableOpacity style={styles.saveButton} onPress={() => console.log("Guardar cambios")}>
            <Text style={styles.saveText}>Guardar Cambios</Text>
          </TouchableOpacity>

          {/* HORARIO (médico o admin) */}
          {(isMedico || isAdmin) && (
            <TouchableOpacity style={styles.scheduleButton} onPress={() => router.push("/schedule")}>
              <Text style={styles.scheduleText}>Modificar Horario</Text>
            </TouchableOpacity>
          )}

          {/* ESPACIO FINAL */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120, // Espacio para Footer
  },
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