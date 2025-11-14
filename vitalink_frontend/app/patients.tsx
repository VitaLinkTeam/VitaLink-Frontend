// Patients.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

interface Patient {
  id: string;
  name: string;
  lastAppointment: string;
  nextAppointment: string;
  clinic: string;
}

// 🔹 Datos quemados
const DUMMY_PATIENTS: Patient[] = [
  {
    id: "1",
    name: "Juan Arce",
    lastAppointment: "25/08/2025",
    nextAppointment: "09/10/2025",
    clinic: "Multicentro Escazú",
  },
  {
    id: "2",
    name: "Bryan Rodríguez",
    lastAppointment: "10/09/2025",
    nextAppointment: "20/11/2025",
    clinic: "Clínica Santa Ana",
  },
  {
    id: "3",
    name: "Patricia López",
    lastAppointment: "02/10/2025",
    nextAppointment: "15/12/2025",
    clinic: "Hospital Metropolitano",
  },
];

const Patients = () => {
  const navigation = useNavigation<any>();

  const openPatientRecord = (patient: Patient) => {

    navigation.navigate("PatientRecord", {
       pacienteUid: patient.id,
       pacienteNombre: patient.name,
    });
    console.log("Abrir expediente de:", patient.name);
  };

  const renderPatient = ({ item }: { item: Patient }) => (
    <View style={styles.patientCard}>
      <View style={styles.leftRow}>
        <Ionicons name="person-circle-outline" size={40} color="#007AFF" />
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{item.name}</Text>
          <Text style={styles.patientText}>Última cita: {item.lastAppointment}</Text>
          <Text style={styles.patientText}>Próxima cita: {item.nextAppointment}</Text>
          <Text style={styles.patientText}>Clínica: {item.clinic}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.plusButton}
        onPress={() => openPatientRecord(item)}
      >
        <Ionicons name="add-circle-outline" size={30} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Nombre fijo tipo mock: Dra. como en el diseño */}
      <Header nombre="Dra. Rafaela Amador" />

      <View style={{ flex: 1 }}>
        <FlatList
          data={DUMMY_PATIENTS}
          keyExtractor={(item) => item.id}
          renderItem={renderPatient}
          contentContainerStyle={styles.contentContainer}
          ListHeaderComponent={
            <View style={styles.headerCard}>
              <Text style={styles.title}>Pacientes</Text>
              <Text style={styles.subtitle}>
                Selecciona un paciente para ver su expediente y agregar recomendaciones.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  contentContainer: { padding: 20, paddingBottom: 100 },

  headerCard: {
    backgroundColor: "#fff",
    marginBottom: 12,
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center" },

  patientCard: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  patientInfo: { marginLeft: 10, flexShrink: 1 },
  patientName: { fontSize: 18, fontWeight: "600", color: "#000" },
  patientText: { fontSize: 14, color: "#555" },

  plusButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
});

export default Patients;
