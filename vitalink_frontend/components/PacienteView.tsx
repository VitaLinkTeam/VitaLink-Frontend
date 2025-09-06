import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import Footer from "../components/Footer";

const PacienteView = () => {
  const [selectedDate, setSelectedDate] = useState<string>("");

  return (
    <ScrollView style={styles.container}>
      {/* Buscador */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#999" />
        <TextInput
          placeholder="Buscar"
          style={styles.searchInput}
          placeholderTextColor="#999"
        />
        <Ionicons name="filter-outline" size={20} color="#999" />
      </View>

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

      {/* Especialidades */}
      <Text style={styles.sectionTitle}>Especialidades</Text>
      <View style={styles.specialties}>
        <View style={styles.specialty}>
          <Ionicons name="eye-outline" size={30} color="#007AFF" />
          <Text style={styles.specialtyText}>Ophthalmology</Text>
        </View>
        <View style={styles.specialty}>
          <Ionicons name="medkit-outline" size={30} color="#007AFF" />
          <Text style={styles.specialtyText}>Dentist</Text>
        </View>
        <View style={styles.specialty}>
          <Ionicons name="heart-outline" size={30} color="#007AFF" />
          <Text style={styles.specialtyText}>Gastroenterology</Text>
        </View>
        <View style={styles.specialty}>
          <Ionicons name="ellipsis-horizontal" size={30} color="#007AFF" />
          <Text style={styles.specialtyText}>More</Text>
        </View>
      </View>

      {/* Recomendaciones */}
      <Text style={styles.sectionTitle}>Recomendaciones</Text>
      <View style={styles.recommendationCard}>
        <Image
          source={require("../assets/images/dentist_placeholder.png")}
          style={styles.recommendationImage}
        />
        <View style={styles.recommendationContent}>
          <Text style={styles.doctorName}>Dra: Rafaela</Text>
          <Text style={styles.recommendationText}>📞 88459860</Text>
          <Text style={styles.recommendationText}>📅 Make an appointment</Text>
          <Text style={styles.recommendationText}>✉️ Contact@rafaela.com</Text>
          <Text style={styles.recommendationDescription}>
            asda asdasd fsdf sdfgfs fdgfg jity edit error jity jalivn
          </Text>
          <TouchableOpacity>
            <Text style={styles.moreLink}>More</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
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
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
  calendar: { borderRadius: 10, marginBottom: 10 },
  selectedDate: {
    fontSize: 14,
    color: "#007AFF",
    marginBottom: 20,
    textAlign: "center",
  },
  specialties: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  specialty: { alignItems: "center", flex: 1 },
  specialtyText: { marginTop: 5, fontSize: 12, color: "#000" },
  recommendationCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    padding: 10,
    marginBottom: 20,
  },
  recommendationImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
  },
  recommendationContent: { flex: 1 },
  doctorName: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  recommendationText: { fontSize: 14, color: "#333" },
  recommendationDescription: { fontSize: 12, color: "#666", marginVertical: 5 },
  moreLink: { fontSize: 14, color: "#007AFF", fontWeight: "600" },
});

export default PacienteView;