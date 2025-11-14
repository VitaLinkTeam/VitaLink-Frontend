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

  // ESTABILIZAR isAdmin
  const isAdmin = useMemo(() => {
    return user?.roleName === "Administrador";
  }, [user?.roleName]);

  const [clinicaId, setClinicaId] = useState<number | null>(null);
  const [loadingClinica, setLoadingClinica] = useState(true);
  const [schedules, setSchedules] = useState<Record<number, { start: string; end: string }>>({});
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = async () => {
    const token = await getAuth().currentUser?.getIdToken();
    if (!token) throw new Error("No token");
    return { Authorization: `Bearer ${token}` };
  };

  // CARGAR CLÍNICA
  useEffect(() => {
    if (!isAdmin || !user?.uid) {
      setLoadingClinica(false);
      return;
    }

    let mounted = true;

    const fetchClinica = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await axios.get(`${BASE_URL}/api/usuario/clinicas`, { headers });
        const clinicas = Array.isArray(res.data) ? res.data : [];
        if (clinicas.length === 0) {
          if (mounted) Alert.alert("Error", "No tienes clínicas asociadas.");
          return;
        }
        if (mounted) setClinicaId(clinicas[0].id);
      } catch (error) {
        console.error("Error cargando clínica:", error);
        if (mounted) Alert.alert("Error", "No se pudo cargar la clínica.");
      } finally {
        if (mounted) setLoadingClinica(false);
      }
    };

    fetchClinica();

    return () => { mounted = false; }; // Cleanup
  }, [isAdmin, user?.uid]);

  // CARGAR HORARIOS
  useEffect(() => {
    if (!clinicaId || !isAdmin) return;

    let mounted = true;

    const fetchHorarios = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await axios.get(`${BASE_URL}/api/clinicas/${clinicaId}/horarios`, { headers });
        const horarios = Array.isArray(res.data) ? res.data : [];

        const loadedSchedules: Record<number, { start: string; end: string }> = {};
        const loadedDays: number[] = [];

        horarios.forEach((h: any) => {
          const dia = h.diaSemana;
          if (dia >= 0 && dia <= 6 && mounted) {
            loadedSchedules[dia] = { start: h.horaInicio, end: h.horaFin };
            loadedDays.push(dia);
          }
        });

        if (mounted) {
          setSchedules(loadedSchedules);
          setSelectedDays(loadedDays);
        }
      } catch (error) {
        console.warn("No hay horarios o error:", error);
      }
    };

    fetchHorarios();

    return () => { mounted = false; };
  }, [clinicaId, isAdmin]);

  // === GUARDAR / ELIMINAR ===
  const saveHorario = async (dia: number, start: string, end: string) => {
    if (!clinicaId) return;
    const headers = await getAuthHeaders();
    const body = { diaSemana: dia, horaInicio: start, horaFin: end };
    const exists = selectedDays.includes(dia) && schedules[dia];

    if (exists) {
      await axios.put(`${BASE_URL}/api/clinicas/${clinicaId}/horarios/${dia}`, body, { headers });
    } else {
      await axios.post(`${BASE_URL}/api/clinicas/${clinicaId}/horarios`, body, { headers });
    }
  };

  const deleteHorario = async (dia: number) => {
    if (!clinicaId) return;
    const headers = await getAuthHeaders();
    await axios.delete(`${BASE_URL}/api/clinicas/${clinicaId}/horarios/${dia}`, { headers });
  };

  const toggleDay = async (dia: number) => {
    if (selectedDays.includes(dia)) {
      setLoading(true);
      try {
        await deleteHorario(dia);
        setSelectedDays(prev => prev.filter(d => d !== dia));
        setSchedules(prev => {
          const copy = { ...prev };
          delete copy[dia];
          return copy;
        });
        const dayLabel = DAYS.find(d => d.value === dia)?.label || "Día";
        Alert.alert("Eliminado", `Horario del ${dayLabel} eliminado.`);
      } catch (error: any) {
        Alert.alert("Error", error.message);
      } finally {
        setLoading(false);
      }
    } else {
      const defaultStart = "08:00";
      const defaultEnd = "17:00";
      setLoading(true);
      try {
        await saveHorario(dia, defaultStart, defaultEnd);
        setSelectedDays(prev => [...prev, dia]);
        setSchedules(prev => ({
          ...prev,
          [dia]: { start: defaultStart, end: defaultEnd },
        }));
        const dayLabel = DAYS.find(d => d.value === dia)?.label || "Día";
        Alert.alert("Agregado", `Horario del ${dayLabel} agregado.`);
      } catch (error: any) {
        Alert.alert("Error", error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const changeSchedule = async (dia: number, field: "start" | "end", value: string) => {
    const newSchedules = {
      ...schedules,
      [dia]: { ...schedules[dia], [field]: value },
    };
    setSchedules(newSchedules);

    setLoading(true);
    try {
      await saveHorario(dia, newSchedules[dia].start, newSchedules[dia].end);
    } catch (error: any) {
      Alert.alert("Error", error.message);
      setSchedules(schedules);
    } finally {
      setLoading(false);
    }
  };

  const saveAll = () => {
    Alert.alert("Éxito", "Todos los horarios están sincronizados con el servidor.");
  };

  // === RENDERS CONDICIONALES ===
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
      <Header nombre="Administrador" />
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.screenTitle}>Horarios de la Clínica</Text>

        <Text style={styles.sectionLabel}>Días de atención</Text>
        <View style={styles.daysGrid}>
          {DAYS.map(({ label, value }) => (
            <TouchableOpacity
              key={value}
              style={[styles.dayButton, selectedDays.includes(value) && styles.dayButtonSelected]}
              onPress={() => toggleDay(value)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  ...styles.dayButtonText,
                  ...(selectedDays.includes(value) && styles.dayButtonTextSelected),
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedDays.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Horarios por día</Text>
            {[...selectedDays].sort((a, b) => a - b).map((dia) => {
              const dayInfo = DAYS.find(d => d.value === dia);
              if (!dayInfo) return null;

              return (
                <View key={dia} style={styles.scheduleCard}>
                  <Text style={styles.dayHeader}>{dayInfo.label}</Text>
                  <View style={styles.timeSelectors}>
                    <View style={styles.timeSelector}>
                      <Text style={styles.timeLabel}>Inicio</Text>
                      <Picker
                        selectedValue={schedules[dia]?.start || "08:00"}
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
                        selectedValue={schedules[dia]?.end || "17:00"}
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
  scrollContainer: { padding: 20, paddingBottom: 60 },
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
  saveButton: { backgroundColor: "#34C759", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 30, elevation: 4 },
  disabledButton: { backgroundColor: "#A0C4FF", opacity: 0.7 },
  saveButtonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  deniedContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff", padding: 20 },
  deniedText: { fontSize: 18, color: "#333", fontWeight: "600", textAlign: "center" },
});

export default ScheduleScreen;