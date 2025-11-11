import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
  SafeAreaView,
} from "react-native";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";

// Función para obtener nombre según rol
const getNombrePorRol = (rol: number) => {
  switch (rol) {
    case 1:
      return "Dra. Rafaela Amador";
    case 2:
      return "Administrador J";
    case 3:
      return "Fernando Lizano";
    case 4:
      return "Asistente S";
    default:
      return "Usuario";
  }
};

// 🔹 Datos quemados con solo "observaciones" como lista
const historialCitas = [
  {
    id: 1,
    title: "Consulta General",
    doctor: "Dr. Ramírez",
    clinic: "Clínica Central",
    date: "2025-09-10 08:00",
    status: "Completada",
    observaciones: [
      "Chequeo anual rutinario. Todo en perfectas condiciones.",
      "Continuar con dieta balanceada.",
      "Realizar 30 minutos de ejercicio 5 días a la semana.",
      "Volver en 1 año para control anual.",
      "Tomar vitamina D 1000 UI diaria (exposición solar insuficiente).",
      "Ninguna nueva prescripción.",
    ],
  },
  {
    id: 2,
    title: "Gastroenterología",
    doctor: "Dra. Amador",
    clinic: "Clínica Central",
    date: "2025-08-25 10:30",
    status: "Cancelada",
  },
  {
    id: 3,
    title: "Oftalmología",
    doctor: "Dr. López",
    clinic: "Clínica Norte",
    date: "2025-07-15 14:00",
    status: "Completada",
    observaciones: [
      "Leve miopía progresiva (-0.50 ambos ojos). Fondo de ojo normal.",
      "Uso de gafas para visión lejana o pantallas prolongadas.",
      "Regla 20-20-20: cada 20 min mirar 20 pies lejos por 20 segundos.",
      "Control en 12 meses.",
      "Gotas lubricantes si sensación de ojo seco.",
      "Lágrimas artificiales Systane Ultra según necesidad.",
    ],
  },
];

const HistorialCitasScreen = () => {
  const { user } = useAuth();
  const rol = user?.rol ?? 0;
  const nombre = getNombrePorRol(rol);

  const [modalVisible, setModalVisible] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<any>(null);

  const abrirModal = (cita: any) => {
    if (cita.status === "Completada" && cita.observaciones) {
      setCitaSeleccionada(cita);
      setModalVisible(true);
    }
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setCitaSeleccionada(null);
  };

  return (
    <View style={styles.container}>
      <Header nombre={nombre} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.mainCard}>
          <Text style={styles.title}>Historial de Citas</Text>
          <Text style={styles.subtitle}>
            Aquí puedes consultar tus citas anteriores y su estado.
          </Text>
        </View>

        <View style={styles.appointmentsCard}>
          <Text style={styles.sectionTitle}>Citas Registradas</Text>

          <FlatList
            data={historialCitas}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.appointmentsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => abrirModal(item)}
                disabled={item.status !== "Completada" || !item.observaciones}
              >
                <View
                  style={[
                    styles.appointmentCard,
                    item.status === "Cancelada" && styles.canceledAppointment,
                  ]}
                >
                  <View style={styles.appointmentInfo}>
                    <Text
                      style={[
                        styles.appointmentSpecialty,
                        item.status === "Cancelada" && styles.canceledText,
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.appointmentDoctor,
                        item.status === "Cancelada" && styles.canceledText,
                      ]}
                    >
                      {item.doctor}
                    </Text>
                    <Text
                      style={[
                        styles.appointmentClinic,
                        item.status === "Cancelada" && styles.canceledText,
                      ]}
                    >
                      {item.clinic}
                    </Text>
                    <Text
                      style={[
                        styles.appointmentDate,
                        item.status === "Cancelada" && styles.canceledText,
                      ]}
                    >
                      📅 {item.date}
                    </Text>
                    <Text
                      style={[
                        styles.appointmentStatus,
                        item.status === "Completada"
                          ? styles.completedStatus
                          : styles.canceledStatus,
                      ]}
                    >
                      {item.status === "Completada" ? "✅ Completada" : "❌ Cancelada"}
                    </Text>
                    {item.status === "Completada" && item.observaciones && (
                      <Text style={styles.verNotas}>👆 Toca para ver observaciones del médico</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </ScrollView>

      <Footer />

      {/* 🔹 MODAL SIMPLIFICADO: SOLO OBSERVACIONES */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={cerrarModal}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Observaciones del Médico</Text>
              <Pressable onPress={cerrarModal}>
                <Text style={styles.cerrarBtn}>✕</Text>
              </Pressable>
            </View>

            {citaSeleccionada && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.doctorName}>
                  {citaSeleccionada.doctor} • {citaSeleccionada.title}
                </Text>
                <Text style={styles.fechaModal}>
                  📅 {citaSeleccionada.date}
                </Text>

                <View style={styles.seccion}>
                  <Text style={styles.seccionTitulo}>Observaciones</Text>
                  {citaSeleccionada.observaciones.map((obs: string, i: number) => (
                    <Text key={i} style={styles.listaItem}>
                      • {obs}
                    </Text>
                  ))}
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

// 🔹 ESTILOS (mismos de antes + pequeños ajustes)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#007AFF",
  },
  scrollContainer: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  mainCard: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 12,
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 8,
    textAlign: "center",
    fontFamily: "Inter",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontFamily: "Inter",
  },
  appointmentsCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 16,
    fontFamily: "Inter",
    textAlign: "center",
  },
  appointmentsList: {
    paddingBottom: 12,
  },
  appointmentCard: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  canceledAppointment: {
    backgroundColor: "#f0f0f0",
    opacity: 0.7,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentSpecialty: {
    fontSize: 16,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 4,
    fontFamily: "Inter",
  },
  appointmentDoctor: {
    fontSize: 15,
    color: "#333",
    marginBottom: 2,
    fontFamily: "Inter",
  },
  appointmentClinic: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    fontFamily: "Inter",
  },
  appointmentDate: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
    fontFamily: "Inter",
  },
  appointmentStatus: {
    fontSize: 14,
    marginTop: 6,
    fontWeight: "700",
  },
  completedStatus: {
    color: "#28A745",
  },
  canceledStatus: {
    color: "#FF3B30",
  },
  canceledText: {
    textDecorationLine: "line-through",
    color: "#666",
  },
  verNotas: {
    marginTop: 8,
    fontSize: 13,
    color: "#007AFF",
    fontStyle: "italic",
  },

  // Modal estilos
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  cerrarBtn: {
    fontSize: 28,
    color: "#999",
  },
  modalBody: {
    padding: 20,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  fechaModal: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  seccion: {
    marginBottom: 24,
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 12,
  },
  listaItem: {
    fontSize: 15,
    color: "#333",
    lineHeight: 24,
    marginLeft: 8,
    marginBottom: 6,
  },
});

export default HistorialCitasScreen;