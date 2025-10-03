import React, { useState, useEffect } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage"; // Instalar con: npx expo install @react-native-async-storage/async-storage
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
  const rol = user?.rol ?? 0;
  const nombre = getNombrePorRol(rol);

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("06:00"); // Nueva variable para la hora
  const [appointments, setAppointments] = useState<
    { id: number; date: string; title: string; doctor: string; clinic: string; canceled: boolean }[]
  >([]); // Agregado campo 'canceled'
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<{ name: string; clinic: string } | null>(null);

  // Cargar citas guardadas cuando se devuelva a la pagina
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const savedAppointments = await AsyncStorage.getItem("patientAppointments");
        if (savedAppointments) {
          const parsedAppointments = JSON.parse(savedAppointments);
          // Asegurarse de que todas las citas tengan el campo 'canceled'
          const updatedAppointments = parsedAppointments.map((appt) => ({
            ...appt,
            canceled: appt.canceled || false,
          }));
          setAppointments(updatedAppointments);
        }
      } catch (error) {
        console.log("Error al cargar citas:", error);
      }
    };
    loadAppointments();
  }, []);

  // Persistencia de citas
  const saveAppointments = async (newAppointments: any[]) => {
    try {
      await AsyncStorage.setItem("patientAppointments", JSON.stringify(newAppointments));
    } catch (error) {
      console.log("Error al guardar citas:", error);
    }
  };

  // Verificacion si se ha seleccionado tanto especialidad como doctor
  const isSelectionComplete = selectedSpecialty && selectedDoctor;

  const addAppointment = () => {
    if (rol !== 3) {
      Alert.alert("Acceso denegado", "Solo los pacientes pueden agendar citas.");
      return;
    }

    if (!selectedDate) {
      Alert.alert("Error", "Por favor seleccione una fecha para su cita.");
      return;
    }

    if (!selectedSpecialty || !selectedDoctor) {
      Alert.alert("Error", "Por favor seleccione especialidad y doctor.");
      return;
    }

    const appointmentDateTime = `${selectedDate} ${selectedTime}`; // Combinar fecha y hora
    // Verificar si ya existe una cita en esa fecha y hora (activa o cancelada)
    if (appointments.some((appt) => appt.date === appointmentDateTime && !appt.canceled)) {
      Alert.alert("Error", "Ya existe una cita en esa fecha y hora.");
      return;
    }

    const newAppointment = {
      id: Date.now(),
      date: appointmentDateTime,
      title: selectedSpecialty,
      doctor: selectedDoctor.name,
      clinic: selectedDoctor.clinic,
      canceled: false,
    };

    const updatedAppointments = [...appointments, newAppointment];
    setAppointments(updatedAppointments);
    saveAppointments(updatedAppointments);
    console.log(`Cita agendada con el id ${newAppointment.id}`);
    Alert.alert(
      "✅ Cita agendada exitosamente",
      `Has agendado una cita con ${selectedDoctor.name} en ${selectedDoctor.clinic}\nFecha y hora: ${appointmentDateTime}`,
      [
        {
          text: "OK",
          onPress: () => {
            setSelectedDate("");
            setSelectedTime("06:00"); // Resetear la hora
            setSelectedSpecialty(null);
            setSelectedDoctor(null);
          },
        },
      ]
    );
  };

  const cancelAppointment = (id: number) => {
    if (rol !== 3) {
      Alert.alert("Acceso denegado", "Solo los pacientes pueden cancelar citas.");
      return;
    }

    Alert.alert(
      "Cancelar Cita",
      "¿Estás seguro que deseas cancelar esta cita?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            const appointmentToCancel = appointments.find((appt) => appt.id === id);
            if (!appointmentToCancel) {
              Alert.alert("Error", "No se encontró la cita para cancelar.");
              return;
            }

            const updatedAppointments = appointments.map((appt) =>
              appt.id === id ? { ...appt, canceled: true } : appt
            );
            setAppointments(updatedAppointments);
            await saveAppointments(updatedAppointments);
            console.log("Cita cancelada con id:", id, "Actualizados:", updatedAppointments);
            Alert.alert("✅ Cancelada", "La cita fue eliminada correctamente.");
          },
        },
      ]
    );
  };

  // Cuando se agenda una cita se resetean todas las opciones: especialidad, doctor, fecha y hora
  const resetSelection = () => {
    setSelectedSpecialty(null);
    setSelectedDoctor(null);
    setSelectedDate("");
    setSelectedTime("06:00");
  };

  const handleSpecialtyChange = (value: string | null) => {
    if (rol !== 3) return;
    if (value === null) {
      setSelectedSpecialty(null);
      setSelectedDoctor(null);
      setSelectedDate("");
      setSelectedTime("06:00");
      return;
    }
    setSelectedSpecialty(value);
    setSelectedDoctor(null);
    setSelectedDate("");
    setSelectedTime("06:00");
  };

  const handleDoctorChange = (value: string | null) => {
    if (rol !== 3) return;
    if (!selectedSpecialty) return;
    if (value === null) {
      setSelectedDoctor(null);
      setSelectedDate("");
      setSelectedTime("06:00");
      return;
    }
    const doctors = doctorsBySpecialty[selectedSpecialty];
    if (doctors && Array.isArray(doctors)) {
      const doctor = doctors.find((d) => d.name === value);
      if (doctor) {
        setSelectedDoctor(doctor);
        setSelectedDate("");
        setSelectedTime("06:00");
      }
    }
  };

  // Marcar fechas de citas en el calendario
  const markedDates = appointments.reduce((acc, app) => {
    const dateOnly = app.date.split(" ")[0];
    acc[dateOnly] = { marked: true, dotColor: "#007AFF" };
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <Header nombre={nombre} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {rol === 3 ? (
          // Vista para pacientes (rol 3)
          <>
            <View style={styles.mainCard}>
              <Text style={styles.title}>Agenda tu Cita Médica</Text>
              <Text style={styles.subtitle}>Selecciona especialidad y doctor para continuar</Text>
            </View>

            <View style={styles.selectionCard}>
              <Text style={styles.sectionTitle}>1. Selecciona Especialidad</Text>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedSpecialty}
                    onValueChange={handleSpecialtyChange}
                    style={styles.picker}
                    dropdownIconColor="#007AFF"
                    enabled={rol === 3} // Deshabilitado para otros roles
                  >
                    <Picker.Item label="-- Seleccione especialidad --" value={null} color="#999" />
                    {specialties.map((spec, index) => (
                      <Picker.Item key={index} label={spec} value={spec} color="#333" />
                    ))}
                  </Picker>
                </View>
              </View>
              {selectedSpecialty && (
                <View style={styles.selectionIndicator}>
                  <View style={styles.dotSelected}></View>
                  <Text style={styles.indicatorText}>Especialidad seleccionada</Text>
                </View>
              )}
            </View>

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
                      enabled={rol === 3} // Deshabilitado para otros roles aparte del paciente
                    >
                      <Picker.Item label="-- Seleccione doctor --" value={null} color="#999" />
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
                {selectedDoctor && (
                  <View style={styles.selectionIndicator}>
                    <View style={styles.dotSelected}></View>
                    <Text style={styles.indicatorText}>Doctor seleccionado</Text>
                  </View>
                )}
              </View>
            )}

            {isSelectionComplete && (
              <View style={styles.calendarCard}>
                <Text style={styles.sectionTitle}>3. Selecciona Fecha y Hora</Text>
                <View style={styles.calendarContainer}>
                  <Calendar
                    minDate={new Date().toISOString().split("T")[0]}
                    onDayPress={(day) => setSelectedDate(day.dateString)}
                    markedDates={markedDates}
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
                    <Text style={styles.label}>Hora:</Text>
                    <View style={styles.pickerContainer}>
                      <View style={styles.pickerWrapper}>
                        <Picker
                          selectedValue={selectedTime}
                          onValueChange={setSelectedTime}
                          style={styles.picker}
                          dropdownIconColor="#007AFF"
                        >
                          {Array.from({ length: 33 }, (_, i) => {
                            const hour = 6 + Math.floor(i / 2);
                            const minute = i % 2 === 0 ? "00" : "30";
                            const time = `${hour < 10 ? "0" + hour : hour}:${minute}`;
                            return (
                              <Picker.Item
                                key={time}
                                label={time}
                                value={time}
                                color="#333"
                              />
                            );
                          })}
                        </Picker>
                      </View>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity style={styles.addButton} onPress={addAppointment}>
                        <Text style={styles.addButtonText}>✅ Agendar Cita</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.resetButton} onPress={resetSelection}>
                        <Text style={styles.resetButtonText}>↻ Cambiar Selección</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {appointments.length > 0 && (
              <View style={styles.appointmentsCard}>
                <Text style={styles.sectionTitle}>Mis Citas Agendadas</Text>
                <FlatList
                  data={appointments}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.appointmentsList}
                  renderItem={({ item }) => (
                    <View style={[styles.appointmentCard, item.canceled && styles.canceledAppointment]}>
                      <View style={styles.appointmentInfo}>
                        <Text style={[styles.appointmentSpecialty, item.canceled && styles.canceledText]}>
                          {item.title}
                        </Text>
                        <Text style={[styles.appointmentDoctor, item.canceled && styles.canceledText]}>
                          {item.doctor}
                        </Text>
                        <Text style={[styles.appointmentClinic, item.canceled && styles.canceledText]}>
                          {item.clinic}
                        </Text>
                        <Text style={[styles.appointmentDate, item.canceled && styles.canceledText]}>
                          📅 {item.date}
                        </Text>
                      </View>
                      {!item.canceled && (
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => cancelAppointment(item.id)}
                          disabled={rol !== 3} // Deshabilitado para otros roles
                        >
                          <Text style={styles.cancelButtonText}>❌ Cancelar</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                />
              </View>
            )}
          </>
        ) : (
          // Vista para medicos, administradores y asistentes (roles 1, 2, 4)
          <View style={styles.calendarView}>
            <Text style={styles.sectionTitle}>Calendario de Citas</Text>
            <View style={styles.calendarContainer}>
              <Calendar
                minDate={new Date().toISOString().split("T")[0]}
                markedDates={markedDates}
                theme={{
                  backgroundColor: "#fff",
                  calendarBackground: "#fff",
                  markedDatesBackgroundColor: "#007AFF",
                  markedDatesTextColor: "#fff",
                  todayTextColor: "#007AFF",
                  dayTextColor: "#333",
                  textDisabledColor: "#d9e1e8",
                  monthTextColor: "#007AFF",
                  indicatorColor: "#007AFF",
                  arrowColor: "#007AFF",
                }}
                style={styles.calendar}
                onDayPress={(day) => Alert.alert("Cita", `Fecha: ${day.dateString}`)}
              />
            </View>
            {appointments.length > 0 && (
              <View style={styles.appointmentsCard}>
                <Text style={styles.sectionTitle}>Citas Agendadas</Text>
                <FlatList
                  data={appointments}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.appointmentsList}
                  renderItem={({ item }) => (
                    <View style={[styles.appointmentCard, item.canceled && styles.canceledAppointment]}>
                      <View style={styles.appointmentInfo}>
                        <Text style={[styles.appointmentSpecialty, item.canceled && styles.canceledText]}>
                          {item.title}
                        </Text>
                        <Text style={[styles.appointmentDoctor, item.canceled && styles.canceledText]}>
                          {item.doctor}
                        </Text>
                        <Text style={[styles.appointmentClinic, item.canceled && styles.canceledText]}>
                          {item.clinic}
                        </Text>
                        <Text style={[styles.appointmentDate, item.canceled && styles.canceledText]}>
                          📅 {item.date}
                        </Text>
                      </View>
                    </View>
                  )}
                />
              </View>
            )}
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
  calendarView: {
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
    width: "100%", // Corregido de 100 a "100%" para que se ajuste al contenedor
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
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
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
  canceledAppointment: {
    backgroundColor: "#f0f0f0", // Fondo gris para citas canceladas
    opacity: 0.6,
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
  canceledText: {
    textDecorationLine: "line-through", // Texto tachado para citas canceladas
    color: "#666",
  },
});

export default AppointmentsScreen;