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
import { getAuth } from "firebase/auth";

const BASE_URL = "https://vitalink-backend-m2mm.onrender.com";

const AppointmentsScreen = () => {
  const { user } = useAuth();

  // === ESTADOS ===
  const [nombreReal, setNombreReal] = useState<string>("Cargando...");
  const [loadingName, setLoadingName] = useState(true);
  const [clinicas, setClinicas] = useState<any[]>([]);
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [doctores, setDoctores] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<any>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [horariosDisponibles, setHorariosDisponibles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // === ROL ===
  const roleName = user?.roleName;
  const isPaciente = roleName === "Paciente";
  const isMedico = roleName === "Médico";
  const isAdmin = roleName === "Administrador";
  const isAsistente = roleName === "Asistente";

  // === AUTENTICACIÓN ===
  const getAuthHeaders = async () => {
    const token = await getAuth().currentUser?.getIdToken();
    if (!token) throw new Error("No token");
    return { Authorization: `Bearer ${token}` };
  };

  // === CARGAR NOMBRE REAL ===
  useEffect(() => {
    const fetchNombre = async () => {
      if (!user?.uid) {
        setNombreReal("Usuario");
        setLoadingName(false);
        return;
      }

      try {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${BASE_URL}/api/auth/getname`, { headers });
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

  // === CARGAR CLÍNICAS DEL PACIENTE ===
  useEffect(() => {
    const fetchClinicas = async () => {
      if (!isPaciente) return;
      try {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${BASE_URL}/api/usuario/clinicas`, { headers });
        setClinicas(response.data || []);
      } catch (error: any) {
        console.warn("Error al cargar clínicas:", error);
        Alert.alert("Error", "No se pudieron cargar las clínicas.");
      }
    };

    fetchClinicas();
  }, [isPaciente]);

  // === CARGAR ESPECIALIDADES POR CLÍNICA ===
  useEffect(() => {
    const fetchEspecialidades = async () => {
      if (!isPaciente || !selectedClinic) {
        setEspecialidades([]);
        setSelectedSpecialty(null);
        return;
      }
      try {
        const headers = await getAuthHeaders();
        const response = await axios.get(
          `${BASE_URL}/api/usuario/especialidades?clinicaId=${selectedClinic.id}`,
          { headers }
        );
        setEspecialidades(response.data || []);
        setSelectedSpecialty(null);
      } catch (error: any) {
        console.warn("Error al cargar especialidades:", error);
        Alert.alert("Error", "No se pudieron cargar las especialidades.");
      }
    };

    fetchEspecialidades();
  }, [isPaciente, selectedClinic]);

  // === CARGAR DOCTORES POR CLÍNICA + ESPECIALIDAD ===
  useEffect(() => {
    const fetchDoctores = async () => {
      if (!isPaciente || !selectedClinic || !selectedSpecialty) {
        setDoctores([]);
        setSelectedDoctor(null);
        return;
      }

      try {
        const headers = await getAuthHeaders();
        const response = await axios.get(
          `${BASE_URL}/api/doctores/${user?.uid}/horarios/${selectedClinic.id}/especialidad?especialidadId=${selectedSpecialty}`,
          { headers }
        );

        const doctoresRaw = response.data || [];

        // === AÑADIR NOMBRE REAL A CADA DOCTOR ===
        const doctoresConNombre = await Promise.all(
          doctoresRaw.map(async (doc: any) => {
            try {
              const nameResponse = await axios.get(
                `${BASE_URL}/api/auth/getname/${doc.uid}`,
                { headers }
              );
              return {
                ...doc,
                nombre: nameResponse.data.nombre || doc.email.split("@")[0], // fallback
              };
            } catch (err) {
              console.warn(`Error al obtener nombre para ${doc.uid}:`, err);
              return {
                ...doc,
                nombre: doc.email.split("@")[0], // fallback si falla
              };
            }
          })
        );

        setDoctores(doctoresConNombre);
        setSelectedDoctor(null);
      } catch (error: any) {
        console.warn("Error al cargar doctores:", error);
        Alert.alert("Error", "No se pudieron cargar los doctores.");
        setDoctores([]);
      }
    };

    fetchDoctores();
  }, [isPaciente, selectedClinic, selectedSpecialty, user?.uid]);

  // === CARGAR DISPONIBILIDAD DEL DOCTOR ===
  useEffect(() => {
    const fetchDisponibilidad = async () => {
      if (!isPaciente || !selectedClinic || !selectedSpecialty || !selectedDoctor) {
        setHorariosDisponibles([]);
        setSelectedDate("");
        setSelectedTime("");
        return;
      }
      try {
        const headers = await getAuthHeaders();
        const response = await axios.get(
          `${BASE_URL}/api/doctores/${selectedDoctor.uid}/horarios/${selectedClinic.id}/disponibilidad?especialidadId=${selectedSpecialty}`,
          { headers }
        );
        setHorariosDisponibles(response.data || []);
        setSelectedDate("");
        setSelectedTime("");
      } catch (error: any) {
        console.warn("Error al cargar disponibilidad:", error);
        setHorariosDisponibles([]);
      }
    };

    fetchDisponibilidad();
  }, [isPaciente, selectedClinic, selectedSpecialty, selectedDoctor]);

  // === CARGAR CITAS ===
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const headers = await getAuthHeaders();
        let endpoint = "";
        if (isPaciente) {
          endpoint = `${BASE_URL}/api/citas/activas/paciente`;
        } else if (isMedico) {
          endpoint = `${BASE_URL}/api/citas/confirmadas/doctor`;
        } else if (isAdmin || isAsistente) {
          endpoint = `${BASE_URL}/api/citas/admin`;
        }

        if (endpoint) {
          const response = await axios.get(endpoint, { headers });
          const citas = response.data.map((cita: any) => ({
            id: cita.id,
            date: `${cita.fecha} ${cita.horaInicio}`,
            title: cita.especialidad || "Consulta",
            doctor: cita.nombreDoctor || "Sin doctor",
            clinic: cita.nombreClinica || "Sin clínica",
            canceled: cita.estado === "Cancelada",
          }));
          setAppointments(citas);
          await AsyncStorage.setItem("patientAppointments", JSON.stringify(citas));
        }
      } catch (error) {
        console.warn("Error al cargar citas:", error);
        const saved = await AsyncStorage.getItem("patientAppointments");
        if (saved) {
          const parsed = JSON.parse(saved);
          setAppointments(parsed.map((appt: any) => ({
            ...appt,
            canceled: appt.canceled || false,
          })));
        }
      }
    };

    loadAppointments();
  }, [isPaciente, isMedico, isAdmin, isAsistente]);

  // === MARCAR FECHAS EN CALENDARIO ===
  const markedDates = (() => {
    const marked: any = {};

    // Citas existentes
    appointments.forEach((appt) => {
      const date = appt.date.split(" ")[0];
      if (!marked[date]) {
        marked[date] = { marked: true, dotColor: appt.canceled ? "#FF3B30" : "#007AFF" };
      }
    });

    // Disponibilidad del doctor
    horariosDisponibles.forEach((slot: any) => {
      const date = slot.fecha;
      if (!marked[date]) {
        marked[date] = { marked: true, dotColor: "#34C759" };
      } else if (marked[date].dotColor === "#007AFF") {
        marked[date].dotColor = "#34C759";
      }
    });

    return marked;
  })();

  // === HORAS DISPONIBLES EN LA FECHA SELECCIONADA ===
  const availableTimes = selectedDate
    ? horariosDisponibles
        .filter((slot: any) => slot.fecha === selectedDate)
        .map((slot: any) => slot.horaInicio)
        .sort()
    : [];

  // === AGENDAR CITA ===
  const addAppointment = async () => {
    if (!selectedClinic || !selectedSpecialty || !selectedDoctor || !selectedDate || !selectedTime) {
      Alert.alert("Error", "Completa todos los campos.");
      return;
    }

    const appointmentDateTime = `${selectedDate} ${selectedTime}`;
    if (appointments.some((appt) => appt.date === appointmentDateTime && !appt.canceled)) {
      Alert.alert("Error", "Ya tienes una cita en esa fecha y hora.");
      return;
    }

    try {
      setLoading(true);
      const headers = await getAuthHeaders();

      const citaRequest = {
        pacienteUid: user?.uid,
        doctorUid: selectedDoctor.uid,
        clinicaId: selectedClinic.id,
        estadoCitaId: 1, // Pendiente
        fecha: selectedDate,
        horaInicio: selectedTime,
        horaFin: selectedTime, // Ajustar según duración real
        observaciones: "",
      };

      const response = await axios.post(`${BASE_URL}/api/citas`, citaRequest, { headers });

      const newAppointment = {
        id: response.data.id,
        date: appointmentDateTime,
        title: especialidades.find((e) => e.id === selectedSpecialty)?.nombre || "Consulta",
        doctor: selectedDoctor.nombre,
        clinic: selectedClinic.nombre,
        canceled: false,
      };

      const updated = [...appointments, newAppointment];
      setAppointments(updated);
      await AsyncStorage.setItem("patientAppointments", JSON.stringify(updated));

      Alert.alert(
        "Cita agendada",
        `Con ${selectedDoctor.nombre} en ${selectedClinic.nombre}\n${appointmentDateTime}`,
        [{ text: "OK", onPress: resetSelection }]
      );
    } catch (error: any) {
      console.warn("Error al agendar cita:", error);
      Alert.alert("Error", error.response?.data?.message || "No se pudo agendar la cita.");
    } finally {
      setLoading(false);
    }
  };

  // === CANCELAR CITA ===
  const cancelAppointment = async (id: number) => {
    if (!isPaciente) {
      Alert.alert("Acceso denegado", "Solo los pacientes pueden cancelar citas.");
      return;
    }

    Alert.alert("Cancelar Cita", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        onPress: async () => {
          try {
            const headers = await getAuthHeaders();
            await axios.delete(`${BASE_URL}/api/citas/${id}`, { headers });

            const updated = appointments.map((appt) =>
              appt.id === id ? { ...appt, canceled: true } : appt
            );
            setAppointments(updated);
            await AsyncStorage.setItem("patientAppointments", JSON.stringify(updated));
            Alert.alert("Cancelada", "La cita fue cancelada.");
          } catch (error) {
            console.warn("Error al cancelar cita:", error);
            Alert.alert("Error", "No se pudo cancelar la cita.");
          }
        },
      },
    ]);
  };

  // === RESETEAR SELECCIÓN ===
  const resetSelection = () => {
    setSelectedClinic(null);
    setSelectedSpecialty(null);
    setSelectedDoctor(null);
    setSelectedDate("");
    setSelectedTime("");
  };

  const isSelectionComplete = selectedClinic && selectedSpecialty && selectedDoctor;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header nombre={loadingName ? "Cargando..." : nombreReal} />

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
                <Text style={styles.subtitle}>Selecciona clínica, especialidad y doctor</Text>
              </View>

              {/* CLÍNICA */}
              {clinicas.length > 0 && (
                <View style={styles.selectionCard}>
                  <Text style={styles.sectionTitle}>1. Clínica</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedClinic?.id || null}
                      onValueChange={(value) => {
                        const clinic = clinicas.find((c) => c.id === value);
                        setSelectedClinic(clinic || null);
                        setSelectedSpecialty(null);
                        setSelectedDoctor(null);
                        setSelectedDate("");
                      }}
                      style={styles.picker}
                      dropdownIconColor="#007AFF"
                      enabled={!loading}
                    >
                      <Picker.Item label="-- Seleccione clínica --" value={null} color="#999" />
                      {clinicas.map((clinica) => (
                        <Picker.Item
                          key={clinica.id}
                          label={clinica.nombre}
                          value={clinica.id}
                          color="#333"
                        />
                      ))}
                    </Picker>
                  </View>
                  {selectedClinic && (
                    <View style={styles.selectionIndicator}>
                      <View style={styles.dotSelected} />
                      <Text style={styles.indicatorText}>Seleccionada</Text>
                    </View>
                  )}
                </View>
              )}

              {/* ESPECIALIDAD */}
              {selectedClinic && (
                <View style={styles.selectionCard}>
                  <Text style={styles.sectionTitle}>2. Especialidad</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedSpecialty}
                      onValueChange={(value) => {
                        setSelectedSpecialty(value);
                        setSelectedDoctor(null);
                        setSelectedDate("");
                      }}
                      style={styles.picker}
                      dropdownIconColor="#007AFF"
                      enabled={!loading}
                    >
                      <Picker.Item label="-- Seleccione --" value={null} color="#999" />
                      {especialidades.map((esp) => (
                        <Picker.Item
                          key={esp.id}
                          label={esp.nombre}
                          value={esp.id}
                          color="#333"
                        />
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
              )}

              {/* DOCTOR */}
              {selectedSpecialty && (
                <View style={styles.selectionCard}>
                  <Text style={styles.sectionTitle}>3. Doctor</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedDoctor?.uid || null}
                      onValueChange={(value) => {
                        const doc = doctores.find((d) => d.uid === value);
                        setSelectedDoctor(doc || null);
                        setSelectedDate("");
                      }}
                      style={styles.picker}
                      dropdownIconColor="#007AFF"
                      enabled={!loading}
                    >
                      <Picker.Item label="-- Seleccione --" value={null} color="#999" />
                      {doctores.map((doc) => (
                        <Picker.Item
                          key={doc.uid}
                          label={doc.nombre}
                          value={doc.uid}
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

              {/* CALENDARIO Y HORAS */}
              {selectedDoctor && (
                <View style={styles.calendarCard}>
                  <Text style={styles.sectionTitle}>4. Fecha y Hora</Text>
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
                      disabled={loading}
                    />
                  </View>

                  {selectedDate && availableTimes.length > 0 && (
                    <View style={styles.dateSelectionCard}>
                      <Text style={styles.selectedDate}>Fecha: {selectedDate}</Text>
                      <Text style={styles.label}>Hora disponible:</Text>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={selectedTime}
                          onValueChange={setSelectedTime}
                          style={styles.picker}
                          dropdownIconColor="#007AFF"
                        >
                          {availableTimes.map((time) => (
                            <Picker.Item key={time} label={time} value={time} color="#333" />
                          ))}
                        </Picker>
                      </View>

                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.addButton, loading && styles.disabledButton]}
                          onPress={addAppointment}
                          disabled={loading}
                        >
                          <Text style={styles.addButtonText}>
                            {loading ? "Agendando..." : "Agendar Cita"}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.resetButton} onPress={resetSelection}>
                          <Text style={styles.resetButtonText}>Cambiar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {selectedDate && availableTimes.length === 0 && (
                    <Text style={{ textAlign: "center", color: "#999", marginTop: 10 }}>
                      No hay horarios disponibles en esta fecha.
                    </Text>
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
                      <View
                        style={[styles.appointmentCard, item.canceled && styles.canceledAppointment]}
                      >
                        <View style={styles.appointmentInfo}>
                          <Text
                            style={[
                              styles.appointmentSpecialty,
                              item.canceled && styles.canceledText,
                            ]}
                          >
                            {item.title}
                          </Text>
                          <Text
                            style={[
                              styles.appointmentDoctor,
                              item.canceled && styles.canceledText,
                            ]}
                          >
                            {item.doctor}
                          </Text>
                          <Text
                            style={[
                              styles.appointmentClinic,
                              item.canceled && styles.canceledText,
                            ]}
                          >
                            {item.clinic}
                          </Text>
                          <Text
                            style={[
                              styles.appointmentDate,
                              item.canceled && styles.canceledText,
                            ]}
                          >
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
                      <View
                        style={[styles.appointmentCard, item.canceled && styles.canceledAppointment]}
                      >
                        <View style={styles.appointmentInfo}>
                          <Text
                            style={[
                              styles.appointmentSpecialty,
                              item.canceled && styles.canceledText,
                            ]}
                          >
                            {item.title}
                          </Text>
                          <Text
                            style={[
                              styles.appointmentDoctor,
                              item.canceled && styles.canceledText,
                            ]}
                          >
                            {item.doctor}
                          </Text>
                          <Text
                            style={[
                              styles.appointmentClinic,
                              item.canceled && styles.canceledText,
                            ]}
                          >
                            {item.clinic}
                          </Text>
                          <Text
                            style={[
                              styles.appointmentDate,
                              item.canceled && styles.canceledText,
                            ]}
                          >
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

// === ESTILOS ===
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  contentContainer: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },
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
  disabledButton: { backgroundColor: "#A0C4FF", opacity: 0.7 },
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