import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { v4 as uuidv4 } from 'uuid';

const DependentsScreen = () => {
  const { user } = useAuth();
  const rol = user?.rol;
  const router = useRouter();

  // Nombre dinámico para el Header (similar a ProfileScreen)
  const getNombrePorRol = () => {
    switch (rol) {
      case 1:
        return "Dra. Rafaela Amador";
      case 2:
        return "Administrador J";
      case 4:
        return "Asistente S";
      case 3:
      default:
        return "Fernando Lizano";
    }
  };

  // Parentezcos de la tabla Parentezco (quemados)
  const parentezcos = [
    "Padre", "Madre", "Hijo", "Hija", "Abuelo", "Abuela", "Nieto", "Nieta",
    "Hermano", "Hermana", "Tío", "Tía", "Primo", "Prima", "Sobrino", "Sobrina",
    "Pareja", "Cónyuge", "Tutor", "Representante legal"
  ];

  // Estado para dependientes (quemados para simular)
  const [dependents, setDependents] = useState([
    { id: 1, nombre: "Juan Lizano", parentezco: "Hijo", correo: "juan@example.com" },
    { id: 2, nombre: "Maria Lizano", parentezco: "Hija", correo: "maria@example.com" },
  ]);

  // Estado para agregar nuevo dependiente
  const [newNombre, setNewNombre] = useState("");
  const [newCorreo, setNewCorreo] = useState("");
  const [newParentezco, setNewParentezco] = useState(parentezcos[0]);

  // Función para agregar dependiente (simulada, en backend usar sp_insert_paciente y tabla Dependiente)
   const addDependent = () => {
    if (!newNombre || !newCorreo) {
        Alert.alert("Error", "Por favor completa todos los campos.");
        return;
    }

    const newDependent = {
        id: uuidv4(), // Genera un ID único
        nombre: newNombre,
        parentezco: newParentezco,
        correo: newCorreo,
    };

    setDependents([...dependents, newDependent]);
    setNewNombre("");
    setNewCorreo("");
    setNewParentezco(parentezcos[0]);
    Alert.alert("Éxito", "Dependiente agregado correctamente.");
    };

  // Función para eliminar dependiente (simulada, en backend eliminar de Dependiente)
  const deleteDependent = (id) => {
  Alert.alert(
    "Eliminar Dependiente",
    "¿Estás seguro de eliminar este dependiente?",
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        onPress: () => {
          setDependents((prevDependents) => {
            const newDependents = prevDependents.filter((dep) => dep.id !== id);
            console.log("Nuevo estado de dependientes:", newDependents);
            return newDependents;
          });
          Alert.alert("Éxito", "Dependiente eliminado.");
        },
      },
    ]
  );
};

  // Solo permitir acceso para pacientes (rol 3)
  if (rol !== 3) {
    return (
      <View style={styles.deniedContainer}>
        <Text style={styles.deniedText}>Acceso denegado. Solo para pacientes.</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <Header nombre={getNombrePorRol()} />

      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.screenTitle}>Gestionar Dependientes</Text>

        {/* Lista de dependientes */}
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

        {/* Agregar nuevo dependiente */}
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
        <TouchableOpacity style={styles.addButton} onPress={addDependent}>
          <Text style={styles.addButtonText}>Agregar Dependiente</Text>
        </TouchableOpacity>
      </ScrollView>

      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
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
    paddingVertical: 12,
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