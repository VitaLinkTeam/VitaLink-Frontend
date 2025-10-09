import React from "react";
import { View, Text, StyleSheet, ScrollView, FlatList } from "react-native";
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

// 🔹 Datos quemados (simulados)
const historialCitas = [
  {
    id: 1,
    title: "Consulta General",
    doctor: "Dr. Ramírez",
    clinic: "Clínica Central",
    date: "2025-09-10 08:00",
    status: "Completada",
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
  },
];

const HistorialCitasScreen = () => {
  const { user } = useAuth();
  const rol = user?.rol ?? 0;
  const nombre = getNombrePorRol(rol);

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
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.appointmentsList}
            renderItem={({ item }) => (
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
                </View>
              </View>
            )}
          />
        </View>
      </ScrollView>

      <Footer />
    </View>
  );
};

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
});

export default HistorialCitasScreen;