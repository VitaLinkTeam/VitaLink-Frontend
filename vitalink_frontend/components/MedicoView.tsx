import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";

const MedicoView = () => {
  const [selectedDate, setSelectedDate] = useState<string>("");

  return (
    <ScrollView style={styles.container}>
      {/* Calendario */}
      <Text style={styles.sectionTitle}>Calendario</Text>
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={{
          [selectedDate]: {
            selected: true,
            marked: true,
            selectedColor: "#007AFF",
          },
        }}
        theme={{
          selectedDayBackgroundColor: "#007AFF",
          todayTextColor: "#FF5733",
          arrowColor: "#007AFF",
        }}
        style={styles.calendar}
      />
      {selectedDate ? (
        <Text style={styles.selectedDate}>Fecha seleccionada: {selectedDate}</Text>
      ) : null}

      {/* Citas próximas */}
      <Text style={styles.sectionTitle}>Pacientes con citas próximas</Text>
      <View style={styles.appointmentCard}>
        <Text style={styles.patientName}>Fernando L.</Text>
        <Text style={styles.appointmentDate}>Cita: 28/08/2025</Text>
      </View>
      <View style={styles.appointmentCard}>
        <Text style={styles.patientName}>Ana M.</Text>
        <Text style={styles.appointmentDate}>Cita: 27/08/2025</Text>
      </View>
      <View style={styles.appointmentCard}>
        <Text style={styles.patientName}>Marcelo J.</Text>
        <Text style={styles.appointmentDate}>Cita: 27/08/2025</Text>
      </View>
      <TouchableOpacity style={styles.moreButton}>
        <Ionicons name="ellipsis-horizontal" size={24} color="#007AFF" />
      </TouchableOpacity>

      {/* Recomendaciones */}
      <Text style={styles.sectionTitle}>Recomendaciones a paciente de la última cita</Text>
      <View style={styles.recommendationCard}>
        <View style={styles.recommendationHeader}>
          <Text style={styles.patientName}>Juan Arce</Text>
          <Text style={styles.appointmentDate}>Ult. cita: 25/08/2025</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={30} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#fff" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 16,
    color: "#000",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#007AFF",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  name: { fontSize: 18, fontWeight: "bold", color: "#000" },
  subtitle: { fontSize: 14, color: "#666" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#000",
  },
  calendar: {
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedDate: {
    fontSize: 14,
    color: "#007AFF",
    marginBottom: 20,
    textAlign: "center",
  },
  appointmentCard: {
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  patientName: { fontSize: 16, fontWeight: "bold", color: "#000" },
  appointmentDate: { fontSize: 14, color: "#555" },
  moreButton: {
    alignSelf: "center",
    marginVertical: 10,
  },
  recommendationCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recommendationHeader: {
    flex: 1,
  },
  addButton: {
    padding: 5,
  },
});

export default MedicoView;