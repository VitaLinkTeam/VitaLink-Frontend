// app/paciente/PacienteView.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { getAuth } from "firebase/auth";

const BASE_URL = "https://vitalink-backend-m2mm.onrender.com";

const ESPECIALIDADES_PRINCIPALES = [
  { id: 1, nombre: "Medicina General", icon: "medkit-outline", color: "#007AFF" },
  { id: 5, nombre: "Odontología", icon: "heart-outline", color: "#FF5733" },
  { id: 7, nombre: "Oftalmología", icon: "eye-outline", color: "#34C759" },
  { id: 2, nombre: "Pediatría", icon: "people-outline", color: "#FF9500" },
  { id: 6, nombre: "Dermatología", icon: "body-outline", color: "#AF52DE" },
  { id: 10, nombre: "Psicología", icon: "chatbubble-ellipses-outline", color: "#5856D6" },
];

const DESCRIPCIONES: Record<number, string> = {
  1: "Atención primaria, chequeos generales, prevención y tratamiento de enfermedades comunes.",
  5: "Cuidado dental, limpiezas, empastes, extracciones, ortodoncia y más.",
  7: "Diagnóstico y tratamiento de enfermedades oculares, exámenes de la vista.",
  2: "Cuidado médico especializado para bebés, niños y adolescentes.",
  6: "Tratamiento de enfermedades de la piel, cabello y uñas.",
  10: "Apoyo emocional, terapia psicológica, manejo del estrés y salud mental.",
};

const PacienteView = () => {
  const { user } = useAuth();
  const router = useRouter();

  // === ESTADOS ===
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEspecialidad, setSelectedEspecialidad] = useState<any>(null);

  // === CACHÉS ===
  const doctorNameCache = useRef<Map<string, string>>(new Map());
  const clinicNameCache = useRef<Map<number, string>>(new Map());
  const doctorSpecialtyCache = useRef<Map<string, string>>(new Map());

  // === AUTH HEADERS ===
  const getAuthHeaders = async () => {
    const token = await getAuth().currentUser?.getIdToken();
    if (!token) throw new Error("No token");
    return { Authorization: `Bearer ${token}` };
  };

  // === CARGAR CLÍNICAS (para caché de especialidades) ===
  const [clinicas, setClinicas] = useState<any[]>([]);
  useEffect(() => {
    const fetchClinicas = async () => {
      if (!user?.uid) return;
      try {
        const headers = await getAuthHeaders();
        const res = await axios.get(`${BASE_URL}/api/usuario/clinicas`, { headers });
        setClinicas(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.warn("Error cargando clínicas:", error);
        setClinicas([]);
      }
    };
    fetchClinicas();
  }, [user?.uid]);

  // === CARGAR CITAS + NOMBRES + ESPECIALIDADES ===
  useEffect(() => {
    const fetchCitas = async () => {
      if (!user?.uid || clinicas.length === 0) {
        setLoadingCitas(false);
        return;
      }

      setLoadingCitas(true);
      try {
        const headers = await getAuthHeaders();
        const res = await axios.get(`${BASE_URL}/api/citas/paciente/${user.uid}`, { headers });
        const citasRaw = Array.isArray(res.data) ? res.data : [];

        // === PRE-CARGAR ESPECIALIDADES DE DOCTORES ===
        const doctorUids = [...new Set(citasRaw.map(c => c.va_FK_doctor_uid).filter(Boolean))];
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
                  const doctoresEnEsp = Array.isArray(docRes.data) ? docRes.data : [];
                  const doctor = doctoresEnEsp.find((d: any) => d.uid === uid);
                  if (doctor) {
                    doctorSpecialtyCache.current.set(uid, doctor.especialidad || "Consulta");
                    found = true;
                    break;
                  }
                } catch {}
              }
            } catch {}
          }
          if (!found) {
            doctorSpecialtyCache.current.set(uid, "Consulta");
          }
        }

        // === CARGAR NOMBRES Y CLÍNICAS ===
        const citasConDatos = await Promise.all(
          citasRaw.map(async (cita) => {
            let doctorName = "Doctor";
            let clinicName = "Clínica";
            let specialtyName = doctorSpecialtyCache.current.get(cita.va_FK_doctor_uid) || "Consulta";

            // Nombre del doctor
            if (cita.va_FK_doctor_uid) {
              if (doctorNameCache.current.has(cita.va_FK_doctor_uid)) {
                doctorName = doctorNameCache.current.get(cita.va_FK_doctor_uid)!;
              } else {
                try {
                  const nameRes = await axios.get(`${BASE_URL}/api/auth/getname/${cita.va_FK_doctor_uid}`, { headers });
                  doctorName = nameRes.data.nombre || "Doctor";
                  doctorNameCache.current.set(cita.va_FK_doctor_uid, doctorName);
                } catch {
                  doctorName = "Doctor";
                }
              }
            }

            // Nombre de la clínica
            if (cita.in_FK_clinica) {
              if (clinicNameCache.current.has(cita.in_FK_clinica)) {
                clinicName = clinicNameCache.current.get(cita.in_FK_clinica)!;
              } else {
                try {
                  const clinicRes = await axios.get(`${BASE_URL}/api/clinicas/${cita.in_FK_clinica}`, { headers });
                  clinicName = clinicRes.data.nombre || "Clínica";
                  clinicNameCache.current.set(cita.in_FK_clinica, clinicName);
                } catch {
                  clinicName = "Clínica";
                }
              }
            }

            return {
              ...cita,
              doctorNombre: doctorName,
              clinicaNombre: clinicName,
              especialidadNombre: specialtyName,
            };
          })
        );

        setAppointments(citasConDatos);
      } catch (error) {
        console.warn("Error cargando citas:", error);
        setAppointments([]);
      } finally {
        setLoadingCitas(false);
      }
    };

    fetchCitas();
  }, [user?.uid, clinicas]);

  // === FECHA LOCAL ===
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const formatSelectedDate = (dateString: string): string => {
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // === CITAS DEL DÍA ===
  const citasDelDia = useMemo(() => {
    if (!selectedDate) return [];
    return appointments
      .filter((cita) => cita.ti_fecha?.trim() === selectedDate)
      .sort((a, b) => (a.ti_hora_inicio || "").localeCompare(b.ti_hora_inicio || ""));
  }, [appointments, selectedDate]);

  // === MARCAR FECHAS ===
  const markedDates = useMemo(() => {
    const marked: { [key: string]: any } = {};

    appointments.forEach((cita) => {
      const fecha = cita.ti_fecha?.trim();
      if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return;

      const isCanceled = cita.in_FK_estado_cita === 2;
      marked[fecha] = {
        marked: true,
        dotColor: isCanceled ? "#FF3B30" : "#007AFF",
      };
    });

    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: "#007AFF",
        selectedTextColor: "#fff",
      };
    }

    return marked;
  }, [appointments, selectedDate]);

  // === MODAL ESPECIALIDAD ===
  const openEspecialidad = (esp: any) => {
    setSelectedEspecialidad(esp);
    setModalVisible(true);
  };

  const goToAppointments = () => {
    setModalVisible(false);
    router.push("/appointments");
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* BUSCADOR */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#999" />
        <TextInput
          placeholder="Buscar doctores, especialidades..."
          style={styles.searchInput}
          placeholderTextColor="#999"
        />
        <Ionicons name="filter-outline" size={20} color="#999" />
      </View>

      {/* CALENDARIO */}
      <Text style={styles.sectionTitle}>Mi Calendario</Text>
      <View style={styles.calendarWrapper}>
        {loadingCitas ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Cargando citas...</Text>
          </View>
        ) : (
          <>
            <Calendar
              onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={markedDates}
              theme={{
                selectedDayBackgroundColor: "#007AFF",
                todayTextColor: "#007AFF",
                arrowColor: "#007AFF",
                dotColor: "#007AFF",
                selectedDayTextColor: "#fff",
                textDisabledColor: "#ccc",
              }}
              style={styles.calendar}
            />

            {selectedDate && (
              <View style={styles.selectedDateHeader}>
                <Ionicons name="calendar-outline" size={18} color="#007AFF" />
                <Text style={styles.selectedDateText}>
                  {formatSelectedDate(selectedDate)}
                </Text>
              </View>
            )}

            {/* CITAS DEL DÍA */}
            {selectedDate && citasDelDia.length > 0 ? (
              <View style={styles.citasDelDiaContainer}>
                <Text style={styles.citasDelDiaTitle}>Citas del día</Text>
                {citasDelDia.map((cita) => (
                  <View
                    key={cita.in_id}
                    style={[
                      styles.citaCard,
                      cita.in_FK_estado_cita === 2 && styles.citaCancelada,
                    ]}
                  >
                    <View style={styles.citaInfo}>
                      <Text style={styles.citaHora}>
                        {cita.ti_hora_inicio?.slice(0, 5) || "--:--"}
                      </Text>
                      <Text style={styles.citaEspecialidad}>
                        {cita.especialidadNombre}
                      </Text>
                      <Text style={styles.citaDoctor}>
                        Dr. {cita.doctorNombre}
                      </Text>
                      <Text style={styles.citaClinica}>
                        {cita.clinicaNombre}
                      </Text>
                    </View>
                    {cita.in_FK_estado_cita === 2 && (
                      <View style={styles.canceladaBadge}>
                        <Text style={styles.canceladaText}>Cancelada</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : selectedDate ? (
              <View style={styles.noCitasContainer}>
                <Ionicons name="information-circle-outline" size={24} color="#999" />
                <Text style={styles.noCitasText}>No hay citas para este día</Text>
              </View>
            ) : null}
          </>
        )}
      </View>

      {/* ESPECIALIDADES */}
      <Text style={styles.sectionTitle}>Especialidades</Text>
      <View style={styles.specialtiesGrid}>
        {ESPECIALIDADES_PRINCIPALES.map((esp) => (
          <TouchableOpacity
            key={esp.id}
            style={styles.specialtyCard}
            onPress={() => openEspecialidad(esp)}
          >
            <View style={[styles.iconCircle, { backgroundColor: esp.color + "20" }]}>
              <Ionicons name={esp.icon as any} size={28} color={esp.color} />
            </View>
            <Text style={styles.specialtyName}>{esp.nombre}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* RECOMENDACIÓN */}
      <Text style={styles.sectionTitle}>Recomendación del Día</Text>
      <View style={styles.recommendationCard}>
        <Image
          source={require("../assets/images/dentist_placeholder.png")}
          style={styles.recommendationImage}
        />
        <View style={styles.recommendationContent}>
          <Text style={styles.doctorName}>Dra. Rafaela Sánchez</Text>
          <Text style={styles.recommendationText}>Tel: 8845-9860</Text>
          <Text style={styles.recommendationText}>Odontología General</Text>
          <Text style={styles.recommendationDescription}>
            Especialista en salud dental con más de 10 años de experiencia. Agenda tu cita hoy.
          </Text>
          <TouchableOpacity style={styles.moreButton}>
            <Text style={styles.moreLink}>Ver perfil</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* DEPENDIENTES */}
      <Text style={styles.sectionTitle}>Familia</Text>
      <TouchableOpacity
        style={styles.dependentsButton}
        onPress={() => router.push("/dependents")}
      >
        <Ionicons name="people-outline" size={20} color="#fff" />
        <Text style={styles.dependentsButtonText}>Gestionar Dependientes</Text>
      </TouchableOpacity>

      {/* MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedEspecialidad && (
              <>
                <View style={[styles.modalIcon, { backgroundColor: selectedEspecialidad.color + "20" }]}>
                  <Ionicons name={selectedEspecialidad.icon as any} size={36} color={selectedEspecialidad.color} />
                </View>
                <Text style={styles.modalTitle}>{selectedDate}</Text>
                <Text style={styles.modalDescription}>
                  {DESCRIPCIONES[selectedEspecialidad.id] || "Atención médica especializada."}
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setModalVisible(false)}>
                    <Text style={styles.modalButtonTextSecondary}>Cerrar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalButtonPrimary} onPress={goToAppointments}>
                    <Text style={styles.modalButtonTextPrimary}>Agendar Cita</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8f9fa" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 16,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
    marginTop: 8,
  },
  calendarWrapper: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  calendar: { borderRadius: 12 },
  selectedDateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 6,
  },
  selectedDateText: {
    fontSize: 15,
    color: "#007AFF",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  loadingContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "#666",
    fontSize: 14,
  },

  // CITAS DEL DÍA
  citasDelDiaContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  citasDelDiaTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  citaCard: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  citaCancelada: {
    opacity: 0.6,
    borderLeftColor: "#FF3B30",
    backgroundColor: "#fff5f5",
  },
  citaInfo: { flex: 1 },
  citaHora: {
    fontSize: 16,
    fontWeight: "700",
    color: "#007AFF",
  },
  citaEspecialidad: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  citaDoctor: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  citaClinica: {
    fontSize: 13,
    color: "#666",
  },
  canceladaBadge: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  canceladaText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  noCitasContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    gap: 8,
  },
  noCitasText: {
    color: "#999",
    fontSize: 14,
  },

  // ESPECIALIDADES
  specialtiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  specialtyCard: {
    width: "30%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  specialtyName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },

  // RECOMENDACIÓN
  recommendationCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  recommendationImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 14,
  },
  recommendationContent: { flex: 1, justifyContent: "space-between" },
  doctorName: { fontSize: 17, fontWeight: "700", color: "#333" },
  recommendationText: { fontSize: 14, color: "#666", marginVertical: 1 },
  recommendationDescription: { fontSize: 13, color: "#777", marginVertical: 6, lineHeight: 18 },
  moreButton: { alignSelf: "flex-start" },
  moreLink: { fontSize: 14, color: "#007AFF", fontWeight: "600" },

  // DEPENDIENTES
  dependentsButton: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 30,
  },
  dependentsButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "88%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  modalButtonTextSecondary: {
    color: "#666",
    fontWeight: "600",
    fontSize: 16,
  },
  modalButtonTextPrimary: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default PacienteView;