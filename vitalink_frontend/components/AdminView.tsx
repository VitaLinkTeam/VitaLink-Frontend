import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";

const AdminView = () => {
  const [selectedDate, setSelectedDate] = useState<string>("");

  return (
    <ScrollView style={styles.container}>
      {/* Buscador */}
      <View style={styles.searchContainer}>
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

      {/* Analíticas */}
      <Text style={styles.sectionTitle}>Analíticas</Text>
      <View style={styles.analyticsContainer}>
        {[
          { label: "L", value: 80 },
          { label: "M", value: 120 },
          { label: "X", value: 60 },
          { label: "J", value: 100 },
          { label: "V", value: 90 },
        ].map((item, index) => (
          <View key={index} style={styles.barGroup}>
            <View style={[styles.bar, { height: item.value }]} />
            <Text style={styles.barLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Lista de médicos */}
      <Text style={styles.sectionTitle}>Lista de Médicos Disponibles</Text>
      {[
        { name: "Dra. Rafaela Amador", specialty: "Pediatra" },
        { name: "Dr. Gabriel Mendez", specialty: "Gastroenterologo" },
        { name: "Dra. Fernanda Sanchez", specialty: "General" },
      ].map((doctor, index) => (
        <View key={index} style={styles.doctorCard}>
          <Image
            source={require("../assets/images/user_placeholder.png")}
            style={styles.doctorImage}
          />
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{doctor.name}</Text>
            <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
          </View>
        </View>
      ))}
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
    fontSize: 16,
    color: "#000",
  },
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
  analyticsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  barGroup: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    width: 20,
    backgroundColor: "#007AFF",
    borderRadius: 5,
  },
  barLabel: {
    fontSize: 12,
    color: "#555",
    marginTop: 5,
  },
  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  doctorImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  doctorSpecialty: {
    fontSize: 14,
    color: "#666",
  },
});

export default AdminView;