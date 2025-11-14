// PatientRecord.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

type RootStackParamList = {
  PatientRecord: {
    patientId: string;
    patientName: string;
  };
};

type PatientRecordRouteProp = RouteProp<RootStackParamList, "PatientRecord">;

interface Appointment {
  id: string;
  date: string;
  nextDate?: string;
  clinic: string;
  summary: string;
  observations: string;
}

// 🔹 Datos quemados del expediente
const DUMMY_APPOINTMENTS: Appointment[] = [
  {
    id: "1",
    date: "25/08/2025",
    nextDate: "09/10/2025",
    clinic: "Multicentro Escazú",
    summary:
      "Ultrasonido: El paciente refiere sensibilidad en la zona posterior superior derecha, se observa ligera inflamación gingival.",
    observations: "No hacer mucho esfuerzo en estos días.",
  },
  {
    id: "2",
    date: "09/10/2025",
    clinic: "Multicentro Escazú",
    summary: "Control de seguimiento. No se observan cambios significativos.",
    observations: "",
  },
];

const PatientRecord = () => {
  const route = useRoute<PatientRecordRouteProp>();
  const { patientName } = route.params;

  const [appointments, setAppointments] =
    useState<Appointment[]>(DUMMY_APPOINTMENTS);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [obsText, setObsText] = useState("");

  const openModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setObsText(appointment.observations || "");
    setModalVisible(true);
  };

  const saveObservation = () => {
    if (!selectedAppointment) return;

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === selectedAppointment.id
          ? { ...a, observations: obsText }
          : a
      )
    );

    setModalVisible(false);
    setSelectedAppointment(null);
  };

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Cita: {item.date}</Text>
      {item.nextDate && (
        <Text style={styles.text}>Próxima cita: {item.nextDate}</Text>
      )}
      <Text style={styles.text}>Clínica: {item.clinic}</Text>

      <Text style={styles.label}>Detalle / expediente:</Text>
      <Text style={styles.text}>{item.summary}</Text>

      <Text style={styles.label}>Recomendaciones / observaciones:</Text>
      <Text style={styles.text}>
        {item.observations.trim()
          ? item.observations
          : "Sin observaciones registradas."}
      </Text>

      <TouchableOpacity
        style={styles.obsButton}
        onPress={() => openModal(item)}
      >
        <Ionicons name="create-outline" size={18} color="#fff" />
        <Text style={styles.obsButtonText}>Agregar / editar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Puedes poner el nombre del doctor fijo o traerlo luego */}
      <Header nombre="Dra. Rafaela Amador" />

      <View style={{ flex: 1 }}>
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointment}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerCard}>
              <Text style={styles.title}>Expediente de {patientName}</Text>
              <Text style={styles.subtitle}>
                Revisa las citas del paciente y agrega recomendaciones.
              </Text>
            </View>
          }
        />
      </View>

      <Footer />

      {/* MODAL OBSERVACIONES */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Observaciones</Text>
            {selectedAppointment && (
              <Text style={styles.modalSubtitle}>
                Cita del {selectedAppointment.date}
              </Text>
            )}

            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={6}
              placeholder="Escribe aquí las observaciones o recomendaciones..."
              value={obsText}
              onChangeText={setObsText}
              textAlignVertical="top"
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={saveObservation}
              >
                <Text style={styles.modalSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: { fontSize: 15, color: "#666", textAlign: "center" },

  card: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    marginBottom: 14,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#007AFF" },
  text: { fontSize: 14, color: "#555", marginTop: 2 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginTop: 8,
  },

  obsButton: {
    marginTop: 10,
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  obsButtonText: {
    color: "#fff",
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 4,
  },
  modalSubtitle: { fontSize: 14, color: "#666", marginBottom: 10 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 10,
    fontSize: 14,
    minHeight: 120,
    backgroundColor: "#f9f9f9",
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 14,
  },
  modalButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 8,
  },
  modalCancelButton: { backgroundColor: "#eee" },
  modalSaveButton: { backgroundColor: "#007AFF" },
  modalCancelText: { color: "#333", fontWeight: "600" },
  modalSaveText: { color: "#fff", fontWeight: "600" },
});

export default PatientRecord;
