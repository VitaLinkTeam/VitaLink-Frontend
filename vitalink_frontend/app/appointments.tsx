// app/appointments.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Picker } from "@react-native-picker/picker";
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
  const [loadingCitas, setLoadingCitas] = useState(false);

  // === CACHE DE ESPECIALIDADES ===
  const doctorSpecialtyCache = useRef<Map<string, string>>(new Map());

  // === ROLES ===
  const roleName = user?.roleName;
  const isPaciente = roleName === "Paciente";
  const isMedico = roleName === "Médico";
  const isAdmin = roleName === "Administrador";
  const isAsistente = roleName === "Asistente";

  // === AUTH HEADERS ===
  const getAuthHeaders = async () => {
    const token = await getAuth().currentUser?.getIdToken();
    if (!token) throw new Error("No token");
    return { Authorization: `Bearer ${token}` };
  };

  // === CARGAR NOMBRE ===
  useEffect(() => {
    const fetchNombre = async () => {
      if (!user?.uid) {
        setNombreReal("Usuario");
        setLoadingName(false);
        return;
      }
      try {
        const headers = await getAuthHeaders();
        const res = await axios.get(`${BASE_URL}/api/auth/getname`, { headers });
        setNombreReal(res.data.nombre || "Paciente");
      } catch {
        setNombreReal(user?.nombre || "Usuario");
      } finally {
        setLoadingName(false);
      }
    };
    fetchNombre();
  }, [user?.uid]);

  // === CARGAR CLÍNICAS ===
  useEffect(() => {
    if (!isPaciente) return;
    const fetchClinicas = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await axios.get(`${BASE_URL}/api/usuario/clinicas`, { headers });
        setClinicas(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Error cargando clínicas:", error);
        Alert.alert("Error", "No se pudieron cargar las clínicas.");
        setClinicas([]);
      }
    };
    fetchClinicas();
  }, [isPaciente]);

  // === CARGAR ESPECIALIDADES ===
  useEffect(() => {
    if (!isPaciente || !selectedClinic) {
      setEspecialidades([]);
      setSelectedSpecialty(null);
      return;
    }
    const fetchEspecialidades = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await axios.get(
          `${BASE_URL}/api/usuario/especialidades?clinicaId=${selectedClinic.id}`,
          { headers }
        );
        setEspecialidades(Array.isArray(res.data) ? res.data : []);
      } catch {
        Alert.alert("Error", "No se pudieron cargar las especialidades.");
        setEspecialidades([]);
      }
    };
    fetchEspecialidades();
  }, [isPaciente, selectedClinic]);

  // === CARGAR DOCTORES (SIN DUPLICADOS) ===
  useEffect(() => {
    if (!isPaciente || !selectedClinic || !selectedSpecialty) {
      setDoctores([]);
      setSelectedDoctor(null);
      return;
    }
    const fetchDoctores = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await axios.get(
          `${BASE_URL}/api/doctores/${user?.uid}/horarios/${selectedClinic.id}/especialidad?especialidadId=${selectedSpecialty}`,
          { headers }
        );
        const doctoresRaw = Array.isArray(res.data) ? res.data : [];

        const uniqueMap = new Map();
        const doctoresConNombre = await Promise.all(
          doctoresRaw.map(async (doc: any) => {
            if (!doc?.uid || uniqueMap.has(doc.uid)) return null;
            uniqueMap.set(doc.uid, true);

            try {
              const nameRes = await axios.get(`${BASE_URL}/api/auth/getname/${doc.uid}`, { headers });
              return { ...doc, nombre: nameRes.data.nombre || doc.email?.split("@")[0] || "Doctor" };
            } catch {
              return { ...doc, nombre: doc.email?.split("@")[0] || "Doctor" };
            }
          })
        );

        setDoctores(doctoresConNombre.filter(Boolean));
      } catch {
        Alert.alert("Error", "No se pudieron cargar los doctores.");
        setDoctores([]);
      }
    };
    fetchDoctores();
  }, [isPaciente, selectedClinic, selectedSpecialty, user?.uid]);

  // === CARGAR DISPONIBILIDAD ===
  useEffect(() => {
    if (!isPaciente || !selectedClinic || !selectedSpecialty || !selectedDoctor) {
      setHorariosDisponibles([]);
      setSelectedDate("");
      setSelectedTime("");
      return;
    }
    const fetchDisponibilidad = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await axios.get(
          `${BASE_URL}/api/doctores/${selectedDoctor.uid}/horarios/${selectedClinic.id}/disponibilidad?especialidadId=${selectedSpecialty}`,
          { headers }
        );
        const data = Array.isArray(res.data) ? res.data : [];
        const normalized = data
          .map((slot: any) => ({
            ...slot,
            hora_inicio: String(slot.hora_inicio || "").trim(),
            fecha: String(slot.fecha || "").trim(),
          }))
          .filter((s: any) => s.hora_inicio && s.fecha);
        setHorariosDisponibles(normalized);
      } catch {
        setHorariosDisponibles([]);
      }
    };
    fetchDisponibilidad();
  }, [isPaciente, selectedClinic, selectedSpecialty, selectedDoctor]);

  // === PRE-CARGAR ESPECIALIDADES DE DOCTORES DE CITAS ===
  const preloadDoctorSpecialties = async (citasRaw: any[], headers: any) => {
    const doctorUids = [...new Set(citasRaw.map(c => c.va_FK_doctor_uid).filter(Boolean))];
    if (doctorUids.length === 0) return;

    for (const uid of doctorUids) {
      if (doctorSpecialtyCache.current.has(uid)) continue;

      let found = false;
      for (const clinica of clinicas) {
        if (found) break;
        try {
          const espRes = await axios.get(
            `${BASE_URL}/api/usuario/especialidades?clinicaId=${clinica.id}`,
            { headers }
          );
          const especialidadesLista = Array.isArray(espRes.data) ? espRes.data : [];

          for (const esp of especialidadesLista) {
            try {
              const docRes = await axios.get(
                `${BASE_URL}/api/doctores/${uid}/horarios/${clinica.id}/especialidad?especialidadId=${esp.id}`,
                { headers }
              );
              const doctoresEnEspecialidad = Array.isArray(docRes.data) ? docRes.data : [];
              const doctorEncontrado = doctoresEnEspecialidad.find((d: any) => d.uid === uid);
              if (doctorEncontrado) {
                doctorSpecialtyCache.current.set(uid, doctorEncontrado.especialidad || "Consulta");
                found = true;
                break;
              }
            } catch {
              continue;
            }
          }
        } catch {
          continue;
        }
      }
      if (!found) {
        doctorSpecialtyCache.current.set(uid, "Consulta");
      }
    }
  };

  // === CARGAR CITAS CON CACHE ===
  useEffect(() => {
    const loadAppointments = async () => {
      if (!user?.uid || !isPaciente) return;

      setLoadingCitas(true);
      try {
        const headers = await getAuthHeaders();
        const endpoint = `${BASE_URL}/api/citas/paciente/${user.uid}`;
        const res = await axios.get(endpoint, { headers });
        const citasRaw = Array.isArray(res.data) ? res.data : [];

        if (citasRaw.length === 0) {
          setAppointments([]);
          setLoadingCitas(false);
          return;
        }

        // PRE-CARGAR ESPECIALIDADES
        await preloadDoctorSpecialties(citasRaw, headers);

        const citasConNombres = await Promise.all(
          citasRaw.map(async (c: any) => {
            let doctorName = "Sin doctor";
            let clinicName = "Sin clínica";
            let specialtyName = doctorSpecialtyCache.current.get(c.va_FK_doctor_uid) || "Consulta";

            try {
              if (c.va_FK_doctor_uid) {
                const doctorRes = await axios.get(`${BASE_URL}/api/auth/getname/${c.va_FK_doctor_uid}`, { headers });
                doctorName = doctorRes.data.nombre || "Doctor desconocido";
              }
              if (c.in_FK_clinica) {
                const clinicRes = await axios.get(`${BASE_URL}/api/clinicas/${c.in_FK_clinica}`, { headers });
                clinicName = clinicRes.data.nombre || "Clínica desconocada";
              }
            } catch (err) {
              console.warn("Error al obtener datos de cita:", err);
            }

            return {
              id: c.in_id,
              date: `${c.ti_fecha || ""} ${c.ti_hora_inicio || ""}`.trim(),
              title: specialtyName,
              doctor: doctorName,
              clinic: clinicName,
              canceled: c.in_FK_estado_cita === 2,
            };
          })
        );

        setAppointments(citasConNombres);
      } catch (error) {
        console.warn("Error al cargar citas:", error);
        setAppointments([]);
      } finally {
        setLoadingCitas(false);
      }
    };

    if (isPaciente && clinicas.length > 0) {
      loadAppointments();
    }
  }, [isPaciente, user?.uid, clinicas]);

  // === FORMATEAR FECHA ===
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + "T00:00:00");
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "Fecha inválida";
    }
  };

  const formatTime = (timeStr: string) => {
    return (timeStr || "").slice(0, 5) || "--:--";
  };

  // === MARCAR CALENDARIO ===
  const markedDates = useMemo(() => {
    const marked: { [key: string]: any } = {};

    appointments.forEach((appt) => {
      const dateStr = appt.date?.split(" ")?.[0];
      if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;

      marked[dateStr] = {
        marked: true,
        dotColor: appt.canceled ? "#FF3B30" : "#007AFF",
      };
    });

    horariosDisponibles.forEach((slot) => {
      const dateStr = slot.fecha?.trim();
      if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;

      if (!marked[dateStr]) {
        marked[dateStr] = { marked: true, dotColor: "#34C759" };
      }
    });

    return marked;
  }, [appointments, horariosDisponibles]);

  // === HORAS DISPONIBILES ===
  const availableTimes = useMemo(() => {
    if (!selectedDate || !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) return [];

    return horariosDisponibles
      .filter((slot) => slot.fecha?.trim() === selectedDate)
      .map((slot) => slot.hora_inicio?.trim()?.slice(0, 5))
      .filter((t): t is string => !!t && /^\d{2}:\d{2}$/.test(t))
      .sort()
      .filter((t, i, a) => a.indexOf(t) === i);
  }, [selectedDate, horariosDisponibles]);

  // === AGENDAR CITA ===
  const addAppointment = async () => {
    if (!selectedClinic || !selectedSpecialty || !selectedDoctor || !selectedDate || !selectedTime) {
      Alert.alert("Error", "Completa todos los campos.");
      return;
    }

    const dateTime = `${selectedDate} ${selectedTime}`;
    if (appointments.some(a => a.date === dateTime && !a.canceled)) {
      Alert.alert("Error", "Ya tienes una cita en esa hora.");
      return;
    }

    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const [h, m] = selectedTime.split(":").map(Number);
      const end = new Date();
      end.setHours(h);
      end.setMinutes(m + 60);
      const horaFin = `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;

      const request = {
        pacienteUid: user?.uid,
        doctorUid: selectedDoctor.uid,
        clinicaId: selectedClinic.id,
        estadoCitaId: 1,
        fecha: selectedDate,
        horaInicio: selectedTime,
        horaFin,
        observaciones: "",
      };

      const res = await axios.post(`${BASE_URL}/api/citas`, request, { headers });

      const newCita = {
        id: res.data.in_id,
        date: dateTime,
        title: especialidades.find(e => e.id === selectedSpecialty)?.nombre || "Consulta",
        doctor: selectedDoctor.nombre,
        clinic: selectedClinic.nombre,
        canceled: false,
      };

      setAppointments(prev => [...prev, newCita]);
      Alert.alert("Éxito", "Cita agendada.", [{ text: "OK", onPress: resetSelection }]);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "No se pudo agendar.");
    } finally {
      setLoading(false);
    }
  };

  // === CANCELAR CITA ===
  const cancelAppointment = async (id: number) => {
    Alert.alert("Cancelar", "¿Estás seguro?", [
      { text: "No", style: "cancel" },
      {
        text: "Sí",
        onPress: async () => {
          try {
            const headers = await getAuthHeaders();
            await axios.delete(`${BASE_URL}/api/citas/${id}`, { headers });
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, canceled: true } : a));
            Alert.alert("Cancelada", "La cita fue cancelada.");
          } catch {
            Alert.alert("Error", "No se pudo cancelar.");
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

  // === RENDER CITA ===
  const renderAppointment = ({ item, index }: { item: any; index: number }) => {
    const [date, time] = item.date.split(" ");
    const key = item.id ? String(item.id) : `appt-${index}`;
    return (
      <View key={key} style={[styles.appointmentCard, item.canceled && styles.canceledAppointment]}>
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
            {formatDate(date)} • {formatTime(time)}
          </Text>
        </View>
        {!item.canceled && (
          <TouchableOpacity style={styles.cancelButton} onPress={() => cancelAppointment(item.id)}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header nombre={loadingName ? "Cargando..." : nombreReal} />

      <View style={{ flex: 1 }}>
        <FlatList
          data={appointments}
          keyExtractor={(item, index) => item.id ? String(item.id) : `appt-${index}`}
          renderItem={renderAppointment}
          ListEmptyComponent={
            loadingCitas ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.emptyText}>Cargando citas...</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay citas agendadas</Text>
              </View>
            )
          }
          ListHeaderComponent={
            <>
              {isPaciente ? (
                <>
                  <View style={styles.mainCard}>
                    <Text style={styles.title}>Agenda tu Cita</Text>
                    <Text style={styles.subtitle}>Selecciona clínica, especialidad y doctor</Text>
                  </View>

                  {/* CLÍNICA */}
                  {clinicas.length > 0 && (
                    <View style={styles.selectionCard}>
                      <Text style={styles.sectionTitle}>1. Clínica</Text>
                      <Picker
                        selectedValue={selectedClinic?.id || null}
                        onValueChange={(v) => {
                          const c = clinicas.find(x => x.id === v);
                          setSelectedClinic(c || null);
                          setSelectedSpecialty(null);
                          setSelectedDoctor(null);
                          setSelectedDate("");
                        }}
                        style={styles.picker}
                      >
                        <Picker.Item label="-- Seleccione clínica --" value={null} />
                        {clinicas.map(c => (
                          <Picker.Item key={c.id} label={c.nombre} value={c.id} />
                        ))}
                      </Picker>
                    </View>
                  )}

                  {/* ESPECIALIDAD */}
                  {selectedClinic && (
                    <View style={styles.selectionCard}>
                      <Text style={styles.sectionTitle}>2. Especialidad</Text>
                      <Picker
                        selectedValue={selectedSpecialty}
                        onValueChange={(v) => {
                          setSelectedSpecialty(v);
                          setSelectedDoctor(null);
                          setSelectedDate("");
                        }}
                        style={styles.picker}
                      >
                        <Picker.Item label="-- Seleccione --" value={null} />
                        {especialidades.map(e => (
                          <Picker.Item key={e.id} label={e.nombre} value={e.id} />
                        ))}
                      </Picker>
                    </View>
                  )}

                  {/* DOCTOR */}
                  {selectedSpecialty && doctores.length > 0 && (
                    <View style={styles.selectionCard}>
                      <Text style={styles.sectionTitle}>3. Doctor</Text>
                      <Picker
                        selectedValue={selectedDoctor?.uid || null}
                        onValueChange={(v) => {
                          const d = doctores.find(x => x.uid === v);
                          setSelectedDoctor(d || null);
                          setSelectedDate("");
                        }}
                        style={styles.picker}
                      >
                        <Picker.Item label="-- Seleccione --" value={null} />
                        {doctores.map(d => (
                          <Picker.Item key={d.uid} label={d.nombre} value={d.uid} />
                        ))}
                      </Picker>
                    </View>
                  )}

                  {/* CALENDARIO */}
                  {selectedDoctor && (
                    <View style={styles.calendarCard}>
                      <Text style={styles.sectionTitle}>4. Fecha y Hora</Text>
                      <Calendar
                        minDate={new Date().toISOString().split("T")[0]}
                        onDayPress={(day) => {
                          if (day?.dateString && /^\d{4}-\d{2}-\d{2}$/.test(day.dateString)) {
                            setSelectedDate(day.dateString);
                          }
                        }}
                        markedDates={markedDates}
                        theme={{
                          selectedDayBackgroundColor: "#007AFF",
                          todayTextColor: "#007AFF",
                          arrowColor: "#007AFF",
                        }}
                        style={styles.calendar}
                      />

                      {selectedDate && availableTimes.length > 0 && (
                        <View style={styles.dateSelectionCard}>
                          <Text style={styles.selectedDate}>Fecha: {formatDate(selectedDate)}</Text>
                          <Text style={styles.label}>Hora:</Text>
                          <Picker
                            selectedValue={selectedTime}
                            onValueChange={(value) => value && setSelectedTime(value)}
                            style={styles.picker}
                          >
                            {availableTimes.map(t => (
                              <Picker.Item key={t} label={t} value={t} />
                            ))}
                          </Picker>

                          <View style={styles.actionButtons}>
                            <TouchableOpacity
                              style={[styles.addButton, loading && styles.disabledButton]}
                              onPress={addAppointment}
                              disabled={loading}
                            >
                              {loading ? (
                                <ActivityIndicator color="#fff" />
                              ) : (
                                <Text style={styles.addButtonText}>Agendar</Text>
                              )}
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.resetButton} onPress={resetSelection}>
                              <Text style={styles.resetButtonText}>Cambiar</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {appointments.length > 0 && (
                    <View style={styles.appointmentsCard}>
                      <Text style={styles.sectionTitle}>Mis Citas</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.calendarView}>
                  <Text style={styles.sectionTitle}>Calendario de Citas</Text>
                  <Calendar
                    minDate={new Date().toISOString().split("T")[0]}
                    markedDates={markedDates}
                    theme={{ todayTextColor: "#007AFF", arrowColor: "#007AFF" }}
                    style={styles.calendar}
                  />
                  {appointments.length > 0 && (
                    <View style={styles.appointmentsCard}>
                      <Text style={styles.sectionTitle}>Citas Agendadas</Text>
                    </View>
                  )}
                </View>
              )}
            </>
          }
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Footer />
    </SafeAreaView>
  );
};

// === ESTILOS (sin cambios) ===
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  contentContainer: { padding: 20, paddingBottom: 100, flexGrow: 1 },
  emptyContainer: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 16, color: "#888", marginTop: 8 },
  mainCard: { backgroundColor: "#fff", marginBottom: 12, padding: 24, borderRadius: 20, alignItems: "center" },
  selectionCard: { backgroundColor: "#fff", marginBottom: 12, padding: 20, borderRadius: 20 },
  calendarCard: { backgroundColor: "#fff", marginBottom: 12, padding: 20, borderRadius: 20 },
  calendarView: { backgroundColor: "#fff", marginBottom: 12, padding: 20, borderRadius: 20 },
  appointmentsCard: { backgroundColor: "#fff", marginBottom: 12, padding: 20, borderRadius: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#007AFF", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#007AFF", marginBottom: 16, textAlign: "center" },
  picker: { height: 50, backgroundColor: "#f8f9fa", borderRadius: 12 },
  calendar: { borderRadius: 12 },
  dateSelectionCard: { backgroundColor: "#f0f8ff", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#007AFF" },
  selectedDate: { fontSize: 16, color: "#007AFF", marginBottom: 16, textAlign: "center", fontWeight: "600" },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 5, color: "#333" },
  actionButtons: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 12 },
  addButton: { flex: 1, backgroundColor: "#007AFF", paddingVertical: 12, borderRadius: 10, alignItems: "center", justifyContent: "center" },
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