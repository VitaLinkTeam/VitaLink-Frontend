import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { getAuth } from "firebase/auth";

const BASE_URL = "https://vitalink-backend-m2mm.onrender.com";

// Interfaz modificada para incluir el campo de observaciones (tx_observaciones)
interface Appointment {
  id: number;
  date: string; // Formato "YYYY-MM-DD HH:MM"
  title: string; // Nombre de la Especialidad
  doctor: string; // Nombre del Doctor
  clinic: string; // Nombre de la Clínica
  canceled: boolean;
  observations: string; // Nuevo campo para las observaciones
}

const AppointmentsHistoryScreen = () => {
  const { user } = useAuth();
  const roleName = user?.roleName;
  const isPaciente = roleName === "Paciente";

  // === ESTADOS ===
  const [nombreReal, setNombreReal] = useState<string>("Cargando...");
  const [loadingName, setLoadingName] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [clinicas, setClinicas] = useState<any[]>([]); 
  
  // === CACHE DE ESPECIALIDADES ===
  const doctorSpecialtyCache = useRef<Map<string, string>>(new Map());

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
        setClinicas([]);
      }
    };
    fetchClinicas();
  }, [isPaciente]);

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
            } catch { /* Error en la especialidad, probar con la siguiente */ }
          }
        } catch { /* Error en la clínica, probar con la siguiente */ }
      }
      if (!found) {
        doctorSpecialtyCache.current.set(uid, "Consulta");
      }
    }
  };

  // === CARGAR CITAS CON CACHE ===
  useEffect(() => {
    const loadAppointments = async () => {
      if (!user?.uid || !isPaciente) {
        setLoadingCitas(false);
        return;
      } 
      
      if (clinicas.length === 0) {
          setLoadingCitas(true);
          return; 
      }

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

        await preloadDoctorSpecialties(citasRaw, headers);

        const citasConNombres: Appointment[] = await Promise.all(
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
              canceled: c.in_FK_estado_cita === 2, // Estado 2 = Cancelada
              observations: c.tx_observaciones || "Sin observaciones registradas.", // **Añadiendo observaciones**
            };
          })
        );

        setAppointments(citasConNombres.sort((a, b) => {
            if (a.date < b.date) return 1;
            if (a.date > b.date) return -1;
            return 0;
        }));
      } catch (error) {
        console.warn("Error al cargar citas:", error);
        setAppointments([]);
      } finally {
        setLoadingCitas(false);
      }
    };

    if (isPaciente) {
      loadAppointments();
    }
  }, [isPaciente, user?.uid, clinicas.length]);

  // === FORMATEAR FECHA ===
  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day); 
      if (isNaN(date.getTime())) return "Fecha inválida";
      
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

  // === LÓGICA DE CANCELAR CITA ===
  const performCancelAppointment = async (id: number) => {
    try {
      const headers = await getAuthHeaders();
      await axios.delete(`${BASE_URL}/api/citas/${id}`, { headers });
      
      setAppointments(prev => 
          prev.map(a => a.id === id ? { ...a, canceled: true } : a)
      );
      Alert.alert("Cancelada", "La cita fue cancelada exitosamente.");
    } catch {
      Alert.alert("Error", "No se pudo cancelar la cita. Intente de nuevo.");
    }
  }

  // === MOSTRAR MODAL/ALERTA DE OBSERVACIONES Y ACCIONES ===
  const showAppointmentModal = (item: Appointment) => {
    const [datePart] = item.date.split(" ");
    const [year, month, day] = datePart.split("-").map(Number);
    const appointmentDate = new Date(year, month - 1, day); 
    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const isPast = appointmentDate < todayDateOnly;

    // Contenido del Modal/Alerta
    const title = `Cita: ${item.title} (${item.doctor})`;
    const message = 
      `Fecha: ${formatDate(datePart)} - ${formatTime(item.date.split(" ")[1])}\n` +
      `Clínica: ${item.clinic}\n\n` +
      `Estado: ${item.canceled ? "CANCELADA" : isPast ? "FINALIZADA" : "PENDIENTE"}\n\n` +
      `Observaciones:\n${item.observations}`;

    // Acciones de la Alerta
    let alertButtons: any[] = [{ text: "Cerrar", style: "cancel" }];

    if (!item.canceled && !isPast) {
      alertButtons.unshift({
        text: "Cancelar Cita",
        style: "destructive",
        onPress: () => {
          Alert.alert("Confirmar Cancelación", "¿Estás seguro que deseas cancelar esta cita? Esta acción es irreversible.", [
            { text: "No", style: "cancel" },
            { text: "Sí, Cancelar", style: "destructive", onPress: () => performCancelAppointment(item.id) }
          ]);
        },
      });
    }

    Alert.alert(title, message, alertButtons);
  };


  // === RENDER CITA (Modificado para ser Touchable) ===
  const renderAppointment = ({ item }: { item: Appointment }) => {
    const [date, time] = item.date.split(" ");
    const today = new Date();
    const appointmentDateTime = new Date(item.date.replace(' ', 'T'));
    const isPast = appointmentDateTime < today;

    return (
      // El card completo es el botón
      <TouchableOpacity 
        key={String(item.id)} 
        style={[
          styles.appointmentCard, 
          item.canceled && styles.canceledAppointment, 
          isPast && !item.canceled && styles.pastAppointment
        ]}
        onPress={() => showAppointmentModal(item)} // Mostrar el modal al tocar
      >
        <View style={styles.appointmentInfo}>
          <Text style={[styles.appointmentSpecialty, (item.canceled || isPast) && styles.canceledText]}>
            {item.title}
          </Text>
          <Text style={[styles.appointmentDoctor, (item.canceled || isPast) && styles.canceledText]}>
            {item.doctor}
          </Text>
          <Text style={[styles.appointmentClinic, (item.canceled || isPast) && styles.canceledText]}>
            {item.clinic}
          </Text>
          <Text style={[styles.appointmentDate, (item.canceled || isPast) && styles.canceledText]}>
            {formatDate(date)} • {formatTime(time)}
          </Text>
          {item.canceled && (
             <Text style={styles.canceledBadge}>CANCELADA</Text>
          )}
          {isPast && !item.canceled && (
             <Text style={styles.pastBadge}>FINALIZADA</Text>
          )}
        </View>
        
        {/* ELIMINAMOS EL BOTÓN DE CANCELAR DE LA VISTA PRINCIPAL */}
      </TouchableOpacity>
    );
  };

  if (!isPaciente) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <Header nombre={loadingName ? "Cargando..." : nombreReal} />
            <View style={styles.contentContainer}>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Solo los **Pacientes** tienen un historial de citas.</Text>
                </View>
            </View>
            <Footer />
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header nombre={loadingName ? "Cargando..." : nombreReal} />

      <View style={{ flex: 1 }}>
        <FlatList
          data={appointments}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderAppointment}
          ListEmptyComponent={
            loadingCitas ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.emptyText}>Cargando historial de citas...</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No tienes citas agendadas en tu historial.</Text>
              </View>
            )
          }
          ListHeaderComponent={
            <View style={styles.headerCard}>
              <Text style={styles.title}>Historial de Citas</Text>
              <Text style={styles.subtitle}>Toca cualquier cita para ver detalles o cancelarla.</Text>
            </View>
          }
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Footer />
    </SafeAreaView>
  );
};

// === ESTILOS ===
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  contentContainer: { padding: 20, paddingBottom: 100, flexGrow: 1 },
  emptyContainer: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 16, color: "#888", marginTop: 8, textAlign: "center" },
  headerCard: { backgroundColor: "#fff", marginBottom: 12, padding: 24, borderRadius: 20, alignItems: "center", borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 24, fontWeight: "bold", color: "#007AFF", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center" },
  
  // Citas
  appointmentCard: { 
    backgroundColor: "#f8f9fa", 
    padding: 16, 
    marginBottom: 12, 
    borderRadius: 16, 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    borderLeftWidth: 4, 
    borderLeftColor: "#007AFF" 
  },
  canceledAppointment: { 
    backgroundColor: "#fff0f0", 
    opacity: 0.8,
    borderLeftColor: "#FF3B30", 
  },
  pastAppointment: {
    backgroundColor: "#f0f0f0", 
    opacity: 0.7,
    borderLeftColor: "#888", 
  },
  appointmentInfo: { flex: 1, marginRight: 12 },
  appointmentSpecialty: { fontSize: 16, fontWeight: "700", color: "#007AFF", marginBottom: 4 },
  appointmentDoctor: { fontSize: 15, color: "#333", marginBottom: 2 },
  appointmentClinic: { fontSize: 14, color: "#666", marginBottom: 4 },
  appointmentDate: { fontSize: 14, color: "#007AFF", fontWeight: "600" },
  
  // Texto de Cancelación
  canceledText: { textDecorationLine: "line-through", color: "#666" },
  
  // Badges para estado de cita
  canceledBadge: {
    marginTop: 5,
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#FF3B30', 
    borderWidth: 1, 
    borderColor: '#FF3B30', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  pastBadge: {
    marginTop: 5,
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#888', 
    borderWidth: 1, 
    borderColor: '#888', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4,
    alignSelf: 'flex-start'
  }
});

export default AppointmentsHistoryScreen;