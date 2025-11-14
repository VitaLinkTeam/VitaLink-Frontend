// app/schedule.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "@/context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import axios from "axios";
import { getAuth } from "firebase/auth";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = "https://vitalink-backend-m2mm.onrender.com";

const DAYS = [
  { label: "Domingo", value: 0 },
  { label: "Lunes", value: 1 },
  { label: "Martes", value: 2 },
  { label: "Miércoles", value: 3 },
  { label: "Jueves", value: 4 },
  { label: "Viernes", value: 5 },
  { label: "Sábado", value: 6 },
];

const HOURS = [];
for (let h = 6; h <= 22; h++) {
  HOURS.push(`${h.toString().padStart(2, "0")}:00`);
  if (h < 22) HOURS.push(`${h.toString().padStart(2, "0")}:30`);
}

const ScheduleScreen = () => {
  const { user } = useAuth();

  const isAdmin = useMemo(() => {
    return user?.roleName === "Administrador";
  }, [user?.roleName]);

  const [clinicaId, setClinicaId] = useState<number | null>(null);
  const [loadingClinica, setLoadingClinica] = useState(true);
  const [schedules, setSchedules] = useState<Record<number, { start: string; end: string }>>({});
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorLog, setErrorLog] = useState<string[]>([]);

  // ← MOVIDO AQUÍ: estado del nombre
  const [nombreReal, setNombreReal] = useState<string>("Cargando...");
  const [loadingName, setLoadingName] = useState(true);

  const log = (msg: string) => {
    console.log(`[Schedule] ${msg}`);
    setErrorLog(prev => [...prev, msg]);
  };

  const getAuthHeaders = async () => {
    const token = await getAuth().currentUser?.getIdToken();
    if (!token) throw new Error("No token");
    return { Authorization: `Bearer ${token}` };
  };

  // === CARGAR NOMBRE REAL (desde backend) ===
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
        const nombre = res.data.nombre || user?.nombre || "Usuario";
        log(`Nombre real obtenido: ${nombre}`);
        setNombreReal(nombre);
      } catch (error: any) {
        log(`Error al obtener nombre: ${error.message}`);
        setNombreReal(user?.nombre || "Usuario");
      } finally {
        setLoadingName(false);
      }
    };

    fetchNombre();
  }, [user?.uid]);

  // === CARGAR CLÍNICA ===
  useEffect(() => {
    if (!isAdmin || !user?.uid) {
      log("No es admin o no hay UID → no se carga clínica");
      setLoadingClinica(false);
      return;
    }

    let mounted = true;

    const fetchClinica = async () => {
      try {
        log("Cargando clínicas del usuario...");
        const headers = await getAuthHeaders();
        const res = await axios.get(`${BASE_URL}/api/usuario/clinicas`, { headers });
        log(`Respuesta clínicas: ${JSON.stringify(res.data)}`);

        const clinicas = Array.isArray(res.data) ? res.data : [];
        if (clinicas.length === 0) {
          if (mounted) {
            log("No hay clínicas asociadas");
            Alert.alert("Error", "No tienes clínicas asociadas.");
          }
          return;
        }

        const id = clinicas[0].id;
        if (mounted) {
          log(`Clínica encontrada: ID ${id}`);
          setClinicaId(id);
        }
      } catch (error: any) {
        const msg = `Error cargando clínica: ${error.message}`;
        log(msg);
        if (mounted) Alert.alert("Error", "No se pudo cargar la clínica.");
      } finally {
        if (mounted) {
          log("Finalizando carga de clínica");
          setLoadingClinica(false);
        }
      }
    };

    fetchClinica();

    return () => {
      mounted = false;
      log("Cleanup: useEffect clínica desmontado");
    };
  }, [isAdmin, user?.uid]);

  // === CARGAR HORARIOS ===
  useEffect(() => {
    if (!clinicaId || !isAdmin) {
      log(`No se cargan horarios: clinicaId=${clinicaId}, isAdmin=${isAdmin}`);
      setLoadingSchedules(false);
      return;
    }

    let mounted = true;

    const fetchHorarios = async () => {
      setLoadingSchedules(true);
      log(`Iniciando carga de horarios para clínica ${clinicaId}...`);

      try {
        const headers = await getAuthHeaders();
        const url = `${BASE_URL}/api/clinicas/${clinicaId}/horarios`;
        log(`GET → ${url}`);
        const res = await axios.get(url, { headers });

        log(`Respuesta horarios: ${JSON.stringify(res.data)}`);

        const horarios = Array.isArray(res.data) ? res.data : [];
        const loadedSchedules: Record<number, { start: string; end: string }> = {};

        horarios.forEach((h: any) => {
          const dia = h.in_dia_semana;
          const horaInicio = h.ti_hora_inicio;
          const horaFin = h.ti_hora_fin;

          if (dia >= 0 && dia <= 6) {
            const start = horaInicio.substring(0, 5); // "08:00:00" → "08:00"
            const end = horaFin.substring(0, 5);
            log(`Horario válido: Día ${dia} → ${start} - ${end}`);
            loadedSchedules[dia] = { start, end };
          } else {
            log(`Día inválido ignorado: ${dia}`);
          }
        });

        if (mounted) {
          log(`Cargando ${Object.keys(loadedSchedules).length} horarios en estado`);
          setSchedules(loadedSchedules);
        }
      } catch (error: any) {
        const msg = `Error en GET horarios: ${error.message}`;
        log(msg);
        if (error.response?.status === 404) {
          log("404: No hay horarios aún (normal)");
        } else {
          Alert.alert("Error", "No se pudieron cargar los horarios.");
        }
      } finally {
        if (mounted) {
          log("Finalizando carga de horarios");
          setLoadingSchedules(false);
        }
      }
    };

    fetchHorarios();

    return () => {
      mounted = false;
      log("Cleanup: useEffect horarios desmontado");
    };
  }, [clinicaId, isAdmin]);

  // === DERIVADO: días con horario ===
  const daysWithSchedule = Object.keys(schedules).map(Number).sort((a, b) => a - b);

  // === GUARDAR / ELIMINAR ===
  const saveHorario = async (dia: number, start: string, end: string) => {
    if (!clinicaId) return;
    const headers = await getAuthHeaders();
    const body = { diaSemana: dia, horaInicio: start, horaFin: end };
    const exists = dia in schedules;

    log(`${exists ? "Actualizando" : "Creando"} horario para día ${dia}: ${start}-${end}`);

    if (exists) {
      await axios.put(`${BASE_URL}/api/clinicas/${clinicaId}/horarios/${dia}`, body, { headers });
    } else {
      await axios.post(`${BASE_URL}/api/clinicas/${clinicaId}/horarios`, body, { headers });
    }
    log("Horario guardado en backend");
  };

  const deleteHorario = async (dia: number) => {
    if (!clinicaId) return;
    const headers = await getAuthHeaders();
    await axios.delete(`${BASE_URL}/api/clinicas/${clinicaId}/horarios/${dia}`, { headers });
    log(`Horario del día ${dia} eliminado del backend`);
  };

  const toggleDay = async (dia: number) => {
    if (dia in schedules) {
      setLoading(true);
      try {
        await deleteHorario(dia);
        setSchedules(prev => {
          const copy = { ...prev };
          delete copy[dia];
          return copy;
        });
        Alert.alert("Eliminado", `Horario del ${DAYS.find(d => d.value === dia)?.label} eliminado.`);
      } catch (error: any) {
        log(`Error al eliminar: ${error.message}`);
        Alert.alert("Error", "No se pudo eliminar");
      } finally {
        setLoading(false);
      }
    } else {
      const defaultStart = "08:00";
      const defaultEnd = "17:00";
      setLoading(true);
      try {
        await saveHorario(dia, defaultStart, defaultEnd);
        setSchedules(prev => ({
          ...prev,
          [dia]: { start: defaultStart, end: defaultEnd },
        }));
        Alert.alert("Agregado", `Horario del ${DAYS.find(d => d.value === dia)?.label} agregado.`);
      } catch (error: any) {
        log(`Error al agregar: ${error.message}`);
        Alert.alert("Error", "No se pudo agregar");
      } finally {
        setLoading(false);
      }
    }
  };

  const changeSchedule = async (dia: number, field: "start" | "end", value: string) => {
    const newSchedule = { ...schedules[dia], [field]: value };
    const newSchedules = { ...schedules, [dia]: newSchedule };
    setSchedules(newSchedules);

    setLoading(true);
    try {
      await saveHorario(dia, newSchedule.start, newSchedule.end);
    } catch (error: any) {
      log(`Error al actualizar horario: ${error.message}`);
      Alert.alert("Error", "No se pudo guardar el cambio");
      setSchedules(schedules);
    } finally {
      setLoading(false);
    }
  };

  const saveAll = () => {
    Alert.alert("Éxito", "Todos los horarios están sincronizados.");
  };

  // === RENDER ===
  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.deniedContainer}>
        <Text style={styles.deniedText}>Acceso denegado. Solo para Administradores.</Text>
      </SafeAreaView>
    );
  }

  if (loadingClinica) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando clínica...</Text>
      </SafeAreaView>
    );
  }

  if (!clinicaId) {
    return (
      <SafeAreaView style={styles.deniedContainer}>
        <Text style={styles.deniedText}>No tienes una clínica asociada.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Header nombre={loadingName ? "Cargando..." : nombreReal} />
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.screenTitle}>Horarios de la Clínica</Text>
        <Text style={styles.sectionLabel}>Días de atención</Text>
        <View style={styles.daysGrid}>
          {DAYS.map(({ label, value }) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.dayButton,
                daysWithSchedule.includes(value) && styles.dayButtonSelected,
              ]}
              onPress={() => toggleDay(value)}
              disabled={loading}
            >
              <Text
                style={{
                  ...styles.dayButtonText,
                  ...(daysWithSchedule.includes(value) && styles.dayButtonTextSelected),
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loadingSchedules ? (
          <View style={styles.loadingSchedules}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingSchedulesText}>Cargando horarios...</Text>
          </View>
        ) : daysWithSchedule.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>Horarios por día</Text>
            {daysWithSchedule.map((dia) => {
              const dayInfo = DAYS.find(d => d.value === dia);
              if (!dayInfo) return null;

              return (
                <View key={dia} style={styles.scheduleCard}>
                  <Text style={styles.dayHeader}>{dayInfo.label}</Text>
                  <View style={styles.timeSelectors}>
                    <View style={styles.timeSelector}>
                      <Text style={styles.timeLabel}>Inicio</Text>
                      <Picker
                        selectedValue={schedules[dia].start}
                        onValueChange={(value) => changeSchedule(dia, "start", value)}
                        style={styles.timePicker}
                        enabled={!loading}
                      >
                        {HOURS.map((h) => (
                          <Picker.Item key={`${dia}-start-${h}`} label={h} value={h} />
                        ))}
                      </Picker>
                    </View>
                    <View style={styles.timeSelector}>
                      <Text style={styles.timeLabel}>Fin</Text>
                      <Picker
                        selectedValue={schedules[dia].end}
                        onValueChange={(value) => changeSchedule(dia, "end", value)}
                        style={styles.timePicker}
                        enabled={!loading}
                      >
                        {HOURS.map((h) => (
                          <Picker.Item key={`${dia}-end-${h}`} label={h} value={h} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          <Text style={styles.noSchedulesText}>No hay horarios configurados aún.</Text>
        )}

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={saveAll}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Todo sincronizado</Text>}
        </TouchableOpacity>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
};

// === ESTILOS ===
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: { padding: 20, paddingBottom: 100 }, // ← Aumentado de 60 a 100
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#666" },
  screenTitle: { fontSize: 24, fontWeight: "700", color: "#007AFF", textAlign: "center", marginBottom: 25 },
  sectionLabel: { fontSize: 18, fontWeight: "600", color: "#333", marginBottom: 15, marginTop: 25 },
  daysGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 20 },
  dayButton: { width: "32%", paddingVertical: 14, borderRadius: 12, backgroundColor: "#f2f2f2", alignItems: "center", marginBottom: 12, elevation: 2 },
  dayButtonSelected: { backgroundColor: "#007AFF" },
  dayButtonText: { fontSize: 16, color: "#333", fontWeight: "500" },
  dayButtonTextSelected: { color: "#fff" },
  scheduleCard: { backgroundColor: "#fff", padding: 15, borderRadius: 12, marginBottom: 20, elevation: 3, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4 },
  dayHeader: { fontSize: 20, fontWeight: "600", color: "#007AFF", marginBottom: 10 },
  timeSelectors: { flexDirection: "row", justifyContent: "space-between" },
  timeSelector: { width: "48%" },
  timeLabel: { fontSize: 16, color: "#333", marginBottom: 8, fontWeight: "500" },
  timePicker: { backgroundColor: "#f8f9fa", borderRadius: 10, paddingVertical: 5 },
  saveButton: { 
    backgroundColor: "#34C759", 
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: "center", 
    marginTop: 30,
    marginBottom: 40,
    elevation: 4 
  },
  disabledButton: { backgroundColor: "#A0C4FF", opacity: 0.7 },
  saveButtonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  deniedContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff", padding: 20 },
  deniedText: { fontSize: 18, color: "#333", fontWeight: "600", textAlign: "center" },
  loadingSchedules: { alignItems: "center", padding: 20 },
  loadingSchedulesText: { marginTop: 8, color: "#666", fontSize: 14 },
  noSchedulesText: { textAlign: "center", color: "#666", fontStyle: "italic", marginTop: 20, fontSize: 16 },
  debugContainer: { backgroundColor: "#f9f9f9", padding: 10, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: "#ddd" },
  debugTitle: { fontWeight: "bold", color: "#d00", marginBottom: 5 },
  debugText: { fontSize: 12, color: "#555", fontFamily: "monospace" },
});

export default ScheduleScreen;