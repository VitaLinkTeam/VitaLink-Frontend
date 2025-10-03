import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Instalar con: expo install @react-native-async-storage/async-storage
import { useAuth } from "@/context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";

const ScheduleScreen = () => {
  const { user } = useAuth();
  const rol = user?.rol;

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

  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  const hours = [];
  for (let h = 6; h <= 22; h++) {
    hours.push(`${h < 10 ? "0" + h : h}:00`);
    if (h < 22) hours.push(`${h < 10 ? "0" + h : h}:30`);
  }

  const [selectedDays, setSelectedDays] = useState([]);
  const [schedules, setSchedules] = useState({});

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const savedSchedule = await AsyncStorage.getItem("doctorSchedule");
        if (savedSchedule) {
          const parsedSchedule = JSON.parse(savedSchedule);
          setSelectedDays(parsedSchedule.selectedDays || []);
          setSchedules(parsedSchedule.schedules || {});
        }
      } catch (error) {
        console.log("Error al cargar horarios:", error);
      }
    };
    loadSchedule();
  }, []);

  // Guardar horarios a lo largo de la app utilizando el asyncStorage. Esto permite que haya persistencia incluso a traves de las pantallas;
  // no olvidar usarlo con npm install @react-native-async-storage/async-storage; y si les falla usar primero npm install --save-dev @types/react@^19.1.0
  const saveScheduleToStorage = async (newSelectedDays, newSchedules) => {
    try {
      const scheduleData = {
        selectedDays: newSelectedDays,
        schedules: newSchedules,
      };
      await AsyncStorage.setItem("doctorSchedule", JSON.stringify(scheduleData));
    } catch (error) {
      console.log("Error al guardar horarios:", error);
    }
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
      const newSchedules = { ...schedules };
      delete newSchedules[day];
      setSchedules(newSchedules);
      saveScheduleToStorage(
        selectedDays.filter((d) => d !== day),
        newSchedules
      );
    } else {
      const newSelectedDays = [...selectedDays, day];
      setSelectedDays(newSelectedDays);
      setSchedules({ ...schedules, [day]: { start: "06:00", end: "22:00" } });
      saveScheduleToStorage(newSelectedDays, {
        ...schedules,
        [day]: { start: "06:00", end: "22:00" },
      });
    }
  };

  const changeSchedule = (day, field, value) => {
    const newSchedules = {
      ...schedules,
      [day]: { ...schedules[day], [field]: value },
    };
    setSchedules(newSchedules);
    saveScheduleToStorage(selectedDays, newSchedules);
  };

  const saveSchedule = () => {
    Alert.alert(
      "Confirmar",
      "¿Estás seguro de guardar los horarios?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Guardar",
          style: "default",
          onPress: () => {
            saveScheduleToStorage(selectedDays, schedules);
            Alert.alert("Éxito", "Horarios guardados correctamente.");
          },
        },
      ]
    );
  };

  if (rol !== 1 && rol !== 2) {
    return (
      <View style={styles.deniedContainer}>
        <Text style={styles.deniedText}>Acceso denegado. Solo para médicos y administradores.</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <Header nombre={getNombrePorRol()} />

      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.screenTitle}>Configurar Horario</Text>

        {/* Seleccion de los dias */}
        <Text style={styles.sectionLabel}>Días de trabajo</Text>
        <View style={styles.daysGrid}>
          {days.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayButton,
                selectedDays.includes(day) && styles.dayButtonSelected,
              ]}
              onPress={() => toggleDay(day)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  selectedDays.includes(day) && styles.dayButtonTextSelected,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Horario por cada dia (es un select/dropdown) */}
        {selectedDays.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Horarios</Text>
            {selectedDays.map((day) => (
              <View key={day} style={styles.scheduleCard}>
                <Text style={styles.dayHeader}>{day}</Text>
                <View style={styles.timeSelectors}>
                  <View style={styles.timeSelector}>
                    <Text style={styles.timeLabel}>Inicio</Text>
                    <Picker
                      selectedValue={schedules[day]?.start || "06:00"}
                      onValueChange={(value) => changeSchedule(day, "start", value)}
                      style={styles.timePicker}
                      dropdownIconColor="#007AFF"
                    >
                      {hours.map((hour) => (
                        <Picker.Item
                          key={`${day}-start-${hour}`}
                          label={hour}
                          value={hour}
                        />
                      ))}
                    </Picker>
                  </View>
                  <View style={styles.timeSelector}>
                    <Text style={styles.timeLabel}>Fin</Text>
                    <Picker
                      selectedValue={schedules[day]?.end || "22:00"}
                      onValueChange={(value) => changeSchedule(day, "end", value)}
                      style={styles.timePicker}
                      dropdownIconColor="#007AFF"
                    >
                      {hours.map((hour) => (
                        <Picker.Item
                          key={`${day}-end-${hour}`}
                          label={hour}
                          value={hour}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Boton para guardar */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveSchedule}
          activeOpacity={0.7}
        >
          <Text style={styles.saveButtonText}>Guardar Horario</Text>
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
    fontFamily: "Inter",
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    marginTop: 25,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dayButton: {
    width: "32%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dayButtonSelected: {
    backgroundColor: "#007AFF",
  },
  dayButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    fontFamily: "Inter",
  },
  dayButtonTextSelected: {
    color: "#fff",
  },
  scheduleCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  dayHeader: {
    fontSize: 20,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 10,
    fontFamily: "Inter",
  },
  timeSelectors: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeSelector: {
    width: "48%",
  },
  timeLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
    fontWeight: "500",
    fontFamily: "Inter",
  },
  timePicker: {
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    paddingVertical: 5,
    elevation: 1,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 30,
    elevation: 4,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter",
  },
  deniedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  deniedText: {
    fontSize: 18,
    color: "#333",
    fontWeight: "600",
    textAlign: "center",
  },
});

export default ScheduleScreen;