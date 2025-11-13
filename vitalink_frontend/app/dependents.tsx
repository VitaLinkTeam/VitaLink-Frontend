import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { v4 as uuidv4 } from "uuid";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import axios from "axios";

const BASE_URL = "https://vitalink-backend-m2mm.onrender.com";

const DependentsScreen = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [nombreReal, setNombreReal] = useState<string>("Cargando...");
  const [loadingName, setLoadingName] = useState(true);

  const roleName = user?.roleName;
  const isPaciente = roleName === "Paciente";

  if (!isPaciente) {
    return (
      <SafeAreaView style={styles.deniedContainer}>
        <Text style={styles.deniedText}>Acceso denegado. Solo para pacientes.</Text>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    const fetchNombre = async () => {
      if (!user?.uid) {
        setNombreReal("Paciente");
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

        setNombreReal(response.data.nombre || "Paciente");
      } catch (error) {
        console.warn("Error al obtener nombre:", error);
        setNombreReal(user?.nombre || "Paciente");
      } finally {
        setLoadingName(false);
      }
    };

    fetchNombre();
  }, [user?.uid]);

  const parentezcos = [
    "Padre", "Madre", "Hijo", "Hija", "Abuelo", "Abuela", "Nieto", "Nieta",
    "Hermano", "Hermana", "Tío", "Tía", "Primo", "Prima", "Sobrino", "Sobrina",
    "Pareja", "Cónyuge", "Tutor", "Representante legal",
  ];

  const [dependents, setDependents] = useState("");

  const [newNombre, setNewNombre] = useState("");
  const [newCorreo, setNewCorreo] = useState("");
  const [newParentezco, setNewParentezco] = useState(parentezcos[0]);

  const addDependent = () => {
    if (!newNombre.trim() || !newCorreo.trim()) {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }

    const newDependent = {
      id: uuidv4(),
      nombre: newNombre.trim(),
      parentezco: newParentezco,
      correo: newCorreo.trim(),
    };

    setDependents((prev) => [...prev, newDependent]);
    setNewNombre("");
    setNewCorreo("");
    setNewParentezco(parentezcos[0]);
    Alert.alert("Éxito", "Dependiente agregado correctamente.");
  };

  const deleteDependent = (id: string) => {
    Alert.alert(
      "Eliminar Dependiente",
      "¿Estás seguro de eliminar este dependiente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => {
            setDependents((prev) => prev.filter((dep) => dep.id !== id));
            Alert.alert("Éxito", "Dependiente eliminado.");
          },
        },
      ]
    );
  };

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
          <Text style={styles.screenTitle}>Gestionar Dependientes</Text>

          <Text style={styles.sectionLabel}>Dependientes Actuales</Text>
          {dependents.length > 0 ? (
            dependents.map((dep) => (
              <View key={dep.id} style={styles.dependentCard}>
                <Text style={styles.dependentName}>{dep.nombre}</Text>
                <Text style={styles.dependentDetail}>Parentezco: {dep.parentezco}</Text>
                <Text style={styles.dependentDetail}>Correo: {dep.correo}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteDependent(dep.id)}
                >
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noDependents}>No tienes dependientes agregados.</Text>
          )}

          <Text style={styles.sectionLabel}>Agregar Nuevo Dependiente</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              value={newNombre}
              onChangeText={setNewNombre}
              style={styles.input}
              placeholder="Nombre del dependiente"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Correo</Text>
            <TextInput
              value={newCorreo}
              onChangeText={setNewCorreo}
              style={styles.input}
              placeholder="Correo del dependiente"
              keyboardType="email-address"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Parentezco</Text>
            <Picker
              selectedValue={newParentezco}
              onValueChange={setNewParentezco}
              style={styles.picker}
            >
              {parentezcos.map((par) => (
                <Picker.Item key={par} label={par} value={par} />
              ))}
            </Picker>
          </View>

          {/* BOTÓN CON MARGIN BOTTOM PARA QUE NO SE TAPE */}
          <TouchableOpacity style={styles.addButton} onPress={addDependent}>
            <Text style={styles.addButtonText}>Agregar Dependiente</Text>
          </TouchableOpacity>
          <View/>
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
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#007AFF",
    textAlign: "center",
    marginBottom: 25,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    marginTop: 25,
  },
  dependentCard: {
    backgroundColor: "#f2f2f2",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dependentName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  dependentDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: "flex-end",
    marginTop: 10,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  noDependents: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  field: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
  },
  picker: {
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    height: 50,
  },
  addButton: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deniedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  deniedText: {
    fontSize: 18,
    color: "#333",
    fontWeight: "600",
  },
});

export default DependentsScreen;