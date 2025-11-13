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
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";

const BASE_URL = "https://vitalink-backend-m2mm.onrender.com";

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

  // === ESTADO DEL NOMBRE REAL ===
  const [nombreReal, setNombreReal] = useState<string>("Cargando...");
  const [loadingName, setLoadingName] = useState(true);

  // === ROL ===
  const roleName = user?.roleName;
  const isPaciente = roleName === "Paciente";

  // === CARGAR NOMBRE REAL ===
  useEffect(() => {
    const fetchNombre = async () => {
      if (!user?.uid) {
        setNombreReal("Usuario");
        setLoadingName(false);
        return;
      }

      try {
        const { getAuth } = await import("firebase/auth");
        const token = await getAuth().currentUser?.getIdToken();
        if (!token) throw new Error("No token");

        const response = await axios.get(`${BASE_URL}/api/auth/getname`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setNombreReal(response.data.nombre || "Paciente");
      } catch (error) {
        console.warn("Error al obtener nombre:", error);
        setNombreReal(user?.nombre || "Usuario");
      } finally {
        setLoadingName(false);
      }
    };

    fetchNombre();
  }, [user?.uid]);

  // === ESTADO DE CITAS ===
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("06:00");
  const [appointments, setAppointments] = useState<
    { id: number; date: string; title: string; doctor: string; clinic: string; canceled: boolean }[]
  >([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<{ name: string; clinic: string } | null>(null);

  // === CARGAR CITAS ===
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const saved = await AsyncStorage.getItem("patientAppointments");
        if (saved) {
          const parsed = JSON.parse(saved);
          const updated = parsed.map((appt: any) => ({
            ...appt,
            canceled: appt.canceled || false,
          }));
          setAppointments(updated);
        }
      } catch (error) {
        console.log("Error al cargar citas:", error);
      }
    };
    loadAppointments();
  }, []);

  // === GUARDAR CITAS ===
  const saveAppointments = async (newAppointments: any[]) => {
    try {
      await AsyncStorage.setItem("patientAppointments", JSON.stringify(newAppointments));
    } catch (error) {
      console.log("Error al guardar citas:", error);
    }
  };

  // === AGENDAR CITA ===
  const addAppointment = () => {
    if (!isPaciente) {
      Alert.alert("Acceso denegado", "Solo los pacientes pueden agendar citas.");
      return;
    }

    if (!selectedDate || !selectedSpecialty || !selectedDoctor) {
      Alert.alert("Error", "Completa todos los campos.");
      return;
    }

    const appointmentDateTime = `${selectedDate} ${selectedTime}`;
    if (appointments.some((appt) => appt.date === appointmentDateTime && !appt.canceled)) {
      Alert.alert("Error", "Ya tienes una cita en esa fecha y hora.");
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

    const updated = [...appointments, newAppointment];
    setAppointments(updated);
    saveAppointments(updated);

    Alert.alert(
      "Cita agendada",
      `Con ${selectedDoctor.name} en ${selectedDoctor.clinic}\n${appointmentDateTime}`,
      [{ text: "OK", onPress: resetSelection }]
    );
  };

  // === CANCELAR CITA ===
  const cancelAppointment = (id: number) => {
    if (!isPaciente) return;

    Alert.alert("Cancelar Cita", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        onPress: async () => {
          const updated = appointments.map((appt) =>
            appt.id === id ? { ...appt, canceled: true } : appt
          );
          setAppointments(updated);
          await saveAppointments(updated);
          Alert.alert("Cancelada", "La cita fue cancelada.");
        },
      },
    ]);
  };

  // === RESETEAR SELECCIÓN ===
  const resetSelection = () => {
    setSelectedSpecialty(null);
    setSelectedDoctor(null);
    setSelectedDate("");
    setSelectedTime("06:00");
  };

  // === CAMBIO DE ESPECIALIDAD ===
  const handleSpecialtyChange = (value: string | null) => {
    if (!isPaciente) return;
    setSelectedSpecialty(value);
    setSelectedDoctor(null);
    setSelectedDate("");
    setSelectedTime("06:00");
  };

  // === CAMBIO DE DOCTOR ===
  const handleDoctorChange = (value: string | null) => {
    if (!isPaciente || !selectedSpecialty) return;
    if (!value) {
      setSelectedDoctor(null);
      setSelectedDate("");
      setSelectedTime("06:00");
      return;
    }
    const doctor = doctorsBySpecialty[selectedSpecialty].find((d) => d.name === value);
    if (doctor) {
      setSelectedDoctor(doctor);
      setSelectedDate("");
      setSelectedTime("06:00");
    }
  };

  // === MARCAR FECHAS ===
  const markedDates = appointments.reduce((acc, app) => {
    const dateOnly = app.date.split(" ")[0];
    acc[dateOnly] = { marked: true, dotColor: "#007AFF" };
    return acc;
  }, {} as any);

  const isSelectionComplete = selectedSpecialty && selectedDoctor;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header nombre={loadingName ? "Cargando..." : nombreReal} />

      {/* CONTENEDOR FLEXIBLE */}
      <View style={styles.contentContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isPaciente ? (
            // === VISTA PACIENTE ===
            <>
              <View style={styles.mainCard}>
                <Text style={styles.title}>Agenda tu Cita Médica</Text>
                <Text style={styles.subtitle}>Selecciona especialidad y doctor</Text>
              </View>

              {/* ESPECIALIDAD */}
              <View style={styles.selectionCard}>
                <Text style={styles.sectionTitle}>1. Especialidad</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedSpecialty}
                    onValueChange={handleSpecialtyChange}
                    style={styles.picker}
                    dropdownIconColor="#007AFF"
                  >
                    <Picker.Item label="-- Seleccione --" value={null} color="#999" />
                    {specialties.map((spec) => (
                      <Picker.Item key={spec} label={spec} value={spec} color="#333" />
                    ))}
                  </Picker>
                </View>
                {selectedSpecialty && (
                  <View style={styles.selectionIndicator}>
                    <View style={styles.dotSelected} />
                    <Text style={styles.indicatorText}>Seleccionada</Text>
                  </View>
                )}
              </View>

              {/* DOCTOR */}
              {selectedSpecialty && (
                <View style={styles.selectionCard}>
                  <Text style={styles.sectionTitle}>2. Doctor</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedDoctor?.name || null}
                      onValueChange={handleDoctorChange}
                      style={styles.picker}
                      dropdownIconColor="#007AFF"
                    >
                      <Picker.Item label="-- Seleccione --" value={null} color="#999" />
                      {doctorsBySpecialty[selectedSpecialty].map((doc) => (
                        <Picker.Item
                          key={doc.name}
                          label={`${doc.name} - ${doc.clinic}`}
                          value={doc.name}
                          color="#333"
                        />
                      ))}
                    </Picker>
                  </View>
                  {selectedDoctor && (
                    <View style={styles.selectionIndicator}>
                      <View style={styles.dotSelected} />
                      <Text style={styles.indicatorText}>Seleccionado</Text>
                    </View>
                  )}
                </View>
              )}

              {/* CALENDARIO */}
              {isSelectionComplete && (
                <View style={styles.calendarCard}>
                  <Text style={styles.sectionTitle}>3. Fecha y Hora</Text>
                  <View style={styles.calendarContainer}>
                    <Calendar
                      minDate={new Date().toISOString().split("T")[0]}
                      onDayPress={(day) => setSelectedDate(day.dateString)}
                      markedDates={markedDates}
                      theme={{
                        selectedDayBackgroundColor: "#007AFF",
                        todayTextColor: "#007AFF",
                        arrowColor: "#007AFF",
                      }}
                      style={styles.calendar}
                    />
                  </View>

                  {selectedDate && (
                    <View style={styles.dateSelectionCard}>
                      <Text style={styles.selectedDate}>Fecha: {selectedDate}</Text>
                      <Text style={styles.label}>Hora:</Text>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={selectedTime}
                          onValueChange={setSelectedTime}
                          style={styles.picker}
                          dropdownIconColor="#007AFF"
                        >
                          {Array.from({ length: 33 }, (_, i) => {
                            const hour = 6 + Math.floor(i / 2);
                            const minute = i % 2 === 0 ? "00" : "30";
                            const time = `${hour.toString().padStart(2, "0")}:${minute}`;
                            return <Picker.Item key={time} label={time} value={time} color="#333" />;
                          })}
                        </Picker>
                      </View>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.addButton} onPress={addAppointment}>
                          <Text style={styles.addButtonText}>Agendar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.resetButton} onPress={resetSelection}>
                          <Text style={styles.resetButtonText}>Cambiar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* MIS CITAS */}
              {appointments.length > 0 && (
                <View style={styles.appointmentsCard}>
                  <Text style={styles.sectionTitle}>Mis Citas</Text>
                  <FlatList
                    data={appointments}
                    keyExtractor={(item) => item.id.toString()}
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
                            {item.date}
                          </Text>
                        </View>
                        {!item.canceled && (
                          <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => cancelAppointment(item.id)}
                          >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  />
                </View>
              )}
            </>
          ) : (
            // === VISTA MÉDICO / ADMIN / ASISTENTE ===
            <View style={styles.calendarView}>
              <Text style={styles.sectionTitle}>Calendario de Citas</Text>
              <View style={styles.calendarContainer}>
                <Calendar
                  minDate={new Date().toISOString().split("T")[0]}
                  markedDates={markedDates}
                  theme={{
                    todayTextColor: "#007AFF",
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
                            {item.date}
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
      </View>

      <Footer />
    </SafeAreaView>
  );
};

// === ESTILOS (MISMO LAYOUT QUE DEPENDENTS) ===
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  contentContainer: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  mainCard: { backgroundColor: "#fff", marginBottom: 12, padding: 24, borderRadius: 20, alignItems: "center" },
  selectionCard: { backgroundColor: "#fff", marginBottom: 12, padding: 20, borderRadius: 20 },
  calendarCard: { backgroundColor: "#fff", marginBottom: 12, padding: 20, borderRadius: 20 },
  calendarView: { backgroundColor: "#fff", marginBottom: 12, padding: 20, borderRadius: 20 },
  appointmentsCard: { backgroundColor: "#fff", marginBottom: 12, padding: 20, borderRadius: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#007AFF", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#007AFF", marginBottom: 16, textAlign: "center" },
  pickerContainer: { marginBottom: 12 },
  picker: { height: 50, backgroundColor: "#f8f9fa", borderRadius: 12 },
  selectionIndicator: { flexDirection: "row", alignItems: "center", marginTop: 8, paddingHorizontal: 12, backgroundColor: "#e7f3ff", borderRadius: 8, alignSelf: "flex-start" },
  dotSelected: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#007AFF", marginRight: 8 },
  indicatorText: { fontSize: 14, color: "#007AFF", fontWeight: "600" },
  calendarContainer: { backgroundColor: "#f8f9fa", borderRadius: 16, padding: 8, marginBottom: 16 },
  calendar: { borderRadius: 12 },
  dateSelectionCard: { backgroundColor: "#f0f8ff", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#007AFF" },
  selectedDate: { fontSize: 16, color: "#007AFF", marginBottom: 16, textAlign: "center", fontWeight: "600" },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 5, color: "#333" },
  actionButtons: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 12 },
  addButton: { flex: 1, backgroundColor: "#007AFF", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  addButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  resetButton: { flex: 1, borderWidth: 1, borderColor: "#007AFF", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  resetButtonText: { color: "#007AFF", fontWeight: "600", fontSize: 16 },
  appointmentCard: { backgroundColor: "#f8f9fa", padding: 16, marginBottom: 12, borderRadius: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderLeftWidth: 4, borderLeftColor: "#007AFF" },
  canceledAppointment: { backgroundColor: "#f0f0f0", opacity: 0.6 },
  appointmentInfo: { flex: 1, marginRight: 12 },
  appointmentSpecialty: { fontSize: 16, fontWeight: "700", color: "#007AFF", marginBottom: 4 },
  appointmentDoctor: { fontSize: 15, color: "#333", marginBottom: 2 },
  appointmentClinic: { fontSize: 14, color: "#666", marginBottom: 4 },
  appointmentDate: { fontSize: 14, color: "#007AFF", fontWeight: "600" },
  cancelButton: { backgroundColor: "#FF3B30", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, minWidth: 80, alignItems: "center" },
  cancelButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  canceledText: { textDecorationLine: "line-through", color: "#666" },
});

export default AppointmentsScreen;