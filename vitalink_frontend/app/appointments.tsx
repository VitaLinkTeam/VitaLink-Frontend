import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
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

// Datos quemados
const specialties = ["Consulta general", "Gastroenterologia", "Oftalmologia"]; 

const doctorsBySpecialty: Record<string, { name: string; clinic: string }[]> = {
  "Consulta general": [
    { name: "Dr. Ramírez", clinic: "Clinica Central" },
    { name: "Dr. Fernández", clinic: "Clinica Norte" },
  ],
  "Gastroenterologia": [
    { name: "Dra. Amador", clinic: "Clinica Central" },
    { name: "Dr. Méndez", clinic: "Clinica Sur" },
  ],
  "Oftalmologia": [
    { name: "Dr. López", clinic: "Clinica Norte" },
    { name: "Dr. Torres", clinic: "Clinica Sur" },
  ],
};

const AppointmentsScreen = () => {
  const { user } = useAuth();
  const nombre = getNombrePorRol(user?.rol ?? 0);

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [appointments, setAppointments] = useState<
    { id: number; date: string; title: string; doctor: string; clinic: string }[]
  >([]);

  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<{ name: string; clinic: string } | null>(null);

  // Verificacion si se ha seleccionado tanto especialidad como doctor
  const isSelectionComplete = selectedSpecialty && selectedDoctor;

  const addAppointment = () => {
    if (!selectedDate) {
      Alert.alert("Error", "Por favor seleccione una fecha para su cita.");
      return;
    }

    if (!selectedSpecialty || !selectedDoctor) {
      Alert.alert("Error", "Por favor seleccione especialidad y doctor.");
      return;
    }

    const newAppointment = {
      id: Date.now(),
      date: selectedDate,
      title: selectedSpecialty,
      doctor: selectedDoctor.name,
      clinic: selectedDoctor.clinic,
    };

    setAppointments([...appointments, newAppointment]);
    console.log(`Cita ha sido agendada con el id ${newAppointment.id}`);
    Alert.alert(
      "✅ Cita agendada exitosamente",
      `Has agendado una cita con ${selectedDoctor.name} en ${selectedDoctor.clinic}\nFecha: ${selectedDate}`,
      [{ text: "OK", onPress: () => {
        // Resetear el calendario despues de agendar
        setSelectedDate("");
      }}]
    );
  };

  const cancelAppointment = (id) => { 
    Alert.alert(
      "Cancelar Cita",
      "¿Estás seguro que deseas cancelar esta cita?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          onPress: () => {
            setAppointments(appointments.filter((appt) => appt.id !== id)); 
            Alert.alert("Cita cancelada", "La cita fue eliminada correctamente."); 
          }
        }
      ]
    );
  };

  const resetSelection = () => {
    setSelectedSpecialty(null);
    setSelectedDoctor(null);
    setSelectedDate("");
  };

  const handleSpecialtyChange = (value: string | null) => {
    if (value === null) {
      // Resetear todo si selecciona el placeholder
      setSelectedSpecialty(null);
      setSelectedDoctor(null);
      setSelectedDate("");
      return;
    }
    // Si es una especialidad valida, resetea el doctor y la fecha
    setSelectedSpecialty(value);
    setSelectedDoctor(null);
    setSelectedDate("");
  };

  const handleDoctorChange = (value: string | null) => {
    // Este fragmento previene errores si selectedSpecialty es null
    if (!selectedSpecialty) {
      return;
    }

    if (value === null) {
      // Resetear doctor y fecha si selecciona el placeholder
      setSelectedDoctor(null);
      setSelectedDate("");
      return;
    }

    // Buscar el doctor solo si existe la especialidad
    const doctors = doctorsBySpecialty[selectedSpecialty];
    if (doctors && Array.isArray(doctors)) {
      const doctor = doctors.find((d) => d.name === value);
      if (doctor) {
        setSelectedDoctor(doctor);
        setSelectedDate("");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Header nombre={nombre} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* "Header" de Agendamiento */}
        <View style={styles.mainCard}>
          <Text style={styles.title}>Agenda tu Cita Médica</Text>
          <Text style={styles.subtitle}>Selecciona especialidad y doctor para continuar</Text>
        </View>

        {/* Seleccion de especialidad */}
        <View style={styles.selectionCard}>
          <Text style={styles.sectionTitle}>1. Selecciona Especialidad</Text>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedSpecialty}
                onValueChange={handleSpecialtyChange}
                style={styles.picker}
                dropdownIconColor="#007AFF"
              >
                <Picker.Item 
                  label="-- Seleccione especialidad --" 
                  value={null} 
                  color="#999"
                />
                {specialties.map((spec, index) => (
                  <Picker.Item 
                    key={index} 
                    label={spec} 
                    value={spec}
                    color="#333"
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Indicador de seleccion */}
          {selectedSpecialty && (
            <View style={styles.selectionIndicator}>
              <View style={styles.dotSelected}></View>
              <Text style={styles.indicatorText}>Especialidad seleccionada</Text>
            </View>
          )}
        </View>

        {/* Seleccion de doctor --> visible solo si hay especialidad seleccionada */}
        {selectedSpecialty && (
          <View style={styles.selectionCard}>
            <Text style={styles.sectionTitle}>2. Selecciona Doctor</Text>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedDoctor?.name || null}
                  onValueChange={handleDoctorChange}
                  style={styles.picker}
                  dropdownIconColor="#007AFF"
                >
                  <Picker.Item 
                    label="-- Seleccione doctor --" 
                    value={null} 
                    color="#999"
                  />
                  {doctorsBySpecialty[selectedSpecialty]?.map((doc, index) => (
                    <Picker.Item
                      key={index}
                      label={`${doc.name} - ${doc.clinic}`}
                      value={doc.name}
                      color="#333"
                    />
                  )) || null}
                </Picker>
              </View>
            </View>

            {/* Indicador de seleccion */}
            {selectedDoctor && (
              <View style={styles.selectionIndicator}>
                <View style={styles.dotSelected}></View>
                <Text style={styles.indicatorText}>Doctor seleccionado</Text>
              </View>
            )}
          </View>
        )}

        {/* Calendario --> es solo visible cuando se haya seleccionado especialidad y doctor */}
        {isSelectionComplete && (
          <View style={styles.calendarCard}>
            <Text style={styles.sectionTitle}>3. Selecciona Fecha</Text>
            <View style={styles.calendarContainer}>
              <Calendar
                minDate={new Date().toISOString().split("T")[0]}
                onDayPress={(day) => setSelectedDate(day.dateString)}
                markedDates={{
                  [selectedDate]: { 
                    selected: true, 
                    marked: true, 
                    selectedColor: "#007AFF",
                    selectedTextColor: "#fff"
                  },
                }}
                theme={{
                  backgroundColor: "#fff",
                  calendarBackground: "#fff",
                  selectedDayBackgroundColor: "#007AFF",
                  selectedDayTextColor: "#fff",
                  todayTextColor: "#007AFF",
                  dayTextColor: "#333",
                  textDisabledColor: "#d9e1e8",
                  monthTextColor: "#007AFF",
                  indicatorColor: "#007AFF",
                  arrowColor: "#007AFF",
                }}
                style={styles.calendar}
              />
            </View>

            {selectedDate && (
              <View style={styles.dateSelectionCard}>
                <Text style={styles.selectedDate}>
                  📅 Fecha seleccionada: {selectedDate}
                </Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.addButton} 
                    onPress={addAppointment}
                  >
                    <Text style={styles.addButtonText}>✅ Agendar Cita</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.resetButton} 
                    onPress={resetSelection}
                  >
                    <Text style={styles.resetButtonText}>↻ Cambiar Selección</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Card de citas agendadas */}
        {appointments.length > 0 && (
          <View style={styles.appointmentsCard}>
            <Text style={styles.sectionTitle}>Mis Citas Agendadas</Text>
            <FlatList
              data={appointments}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.appointmentsList}
              renderItem={({ item }) => (
                <View style={styles.appointmentCard}>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentSpecialty}>{item.title}</Text>
                    <Text style={styles.appointmentDoctor}>{item.doctor}</Text>
                    <Text style={styles.appointmentClinic}>{item.clinic}</Text>
                    <Text style={styles.appointmentDate}>📅 {item.date}</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      Alert.alert(
                        "Cancelar Cita",
                        `¿Esta seguro que desea cancelar su cita con ${item.doctor}?`,
                        [
                          { text: "Cancelar", style: "cancel" },
                          { 
                            text: "Confirmar", 
                            onPress: () => {
                              setAppointments((prevAppointments) => {
                                const newAppointments = prevAppointments.filter((appt) => appt.id !== item.id);
                                console.log("Cita eliminada. Nueva longitud:", newAppointments.length);
                                return newAppointments;
                              });
                              Alert.alert("✅ Cancelada", "La cita fue eliminada correctamente.");
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.cancelButtonText}>❌ Cancelar</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}
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

  selectionCard: {
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

  calendarCard: {
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

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 16,
    fontFamily: "Inter",
    textAlign: "center",
  },

  pickerContainer: {
    marginBottom: 12,
  },

  pickerWrapper: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    overflow: "hidden",
  },

  picker: {
    height: 50,
    width: "100%",
    backgroundColor: "transparent",
  },

  selectionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#e7f3ff",
    borderRadius: 8,
    alignSelf: "flex-start",
  },

  dotSelected: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
    marginRight: 8,
  },

  indicatorText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
    fontFamily: "Inter",
  },

  calendarContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  calendar: {
    borderRadius: 12,
  },

  dateSelectionCard: {
    backgroundColor: "#f0f8ff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#007AFF",
  },

  selectedDate: {
    fontSize: 16,
    color: "#007AFF",
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "600",
    fontFamily: "Inter",
  },

  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  addButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    fontFamily: "Inter",
  },

  resetButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  resetButtonText: {
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 16,
    fontFamily: "Inter",
  },

  appointmentsList: {
    paddingBottom: 12,
  },

  appointmentCard: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  appointmentInfo: {
    flex: 1,
    marginRight: 12,
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

  cancelButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  cancelButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    fontFamily: "Inter",
  },
});

export default AppointmentsScreen;