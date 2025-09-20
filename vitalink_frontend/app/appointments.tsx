import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Picker } from "@react-native-picker/picker";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";

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

const AppointmentsScreen = () => {
  const { user } = useAuth();
  const nombre = getNombrePorRol(user?.rol ?? 0);

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth()
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [showPicker, setShowPicker] = useState<boolean>(false);

  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const years = Array.from({ length: 10 }, (_, i) => 2020 + i);
  const currentDate = `${selectedYear}-${String(selectedMonth + 1).padStart(
    2,
    "0"
  )}-01`;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header nombre={nombre} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Calendario de Citas</Text>

        {/* Encabezado táctil */}
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          style={styles.calendarHeader}
        >
          <Text style={styles.calendarHeaderText}>
            {months[selectedMonth]} {selectedYear}
          </Text>
        </TouchableOpacity>

        {/* Calendario */}
        <Calendar
          current={currentDate}
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
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
          style={styles.calendar}
        />

        {selectedDate && (
          <Text style={styles.selectedDate}>
            Fecha seleccionada: {selectedDate}
          </Text>
        )}

        {/* Citas futuras */}
        <View style={styles.citasContainer}>
          <Text style={styles.sectionTitle}>
            Citas para {selectedDate || "..."}
          </Text>
          <Text style={styles.empty}>No hay citas registradas aún.</Text>
        </View>
      </ScrollView>

      <Footer />

      {/* Modal de selección de mes y año */}
      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar mes y año</Text>

            <Picker
              selectedValue={selectedMonth}
              onValueChange={(value) => setSelectedMonth(value)}
              style={styles.picker}
            >
              {months.map((month, index) => (
                <Picker.Item key={index} label={month} value={index} />
              ))}
            </Picker>

            <Picker
              selectedValue={selectedYear}
              onValueChange={(value) => setSelectedYear(value)}
              style={styles.picker}
            >
              {years.map((year) => (
                <Picker.Item key={year} label={year.toString()} value={year} />
              ))}
            </Picker>

            <TouchableOpacity
              onPress={() => setShowPicker(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 80,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  calendarHeader: {
    alignItems: "center",
    marginBottom: 6,
  },
  calendarHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  calendar: {
    borderRadius: 10,
    marginBottom: 20,
  },
  selectedDate: {
    fontSize: 14,
    color: "#007AFF",
    marginBottom: 20,
    textAlign: "center",
  },
  citasContainer: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  empty: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    marginHorizontal: 30,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    borderRadius: 6,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
});

export default AppointmentsScreen;