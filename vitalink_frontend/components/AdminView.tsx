import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { getAuth } from 'firebase/auth';

const BASE_URL = "http://192.168.5.162:8080";

const APPOINTMENT_STATES = [
  { id: 1, name: "Programada", color: "#FFA500" },
  { id: 2, name: "Confirmada", color: "#007AFF" },
  { id: 3, name: "En curso", color: "#9370DB" },
  { id: 4, name: "Completada", color: "#28a745" },
  { id: 5, name: "Cancelada", color: "#dc3545" },
  { id: 6, name: "No asistió", color: "#6c757d" },
];

const DIAS_SEMANA = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

const AdminView = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(2);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedDayAppointments, setSelectedDayAppointments] = useState([]);
  
  // States for doctors and specialties
  const [clinicId, setClinicId] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorScheduleModal, setDoctorScheduleModal] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // States for analytics
  const [appointmentsByDay, setAppointmentsByDay] = useState([]);
  const [canceledAppointments, setCanceledAppointments] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Fetch clinic, doctors, specialties, and analytics on mount
  useEffect(() => {
    fetchClinicInfo();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [selectedStatus]);

  useEffect(() => {
    if (clinicId) {
      fetchDoctors();
      fetchSpecialties();
      fetchAnalytics();
    }
  }, [clinicId]);

  const fetchClinicInfo = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) return;

      const token = await user.getIdToken();

      const response = await fetch(`${BASE_URL}/api/usuario/clinicas`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setClinicId(data[0].id);
          console.log(`🏥 Clinic ID: ${data[0].id}`);
        }
      } else {
        console.error("Error fetching clinic info");
      }
    } catch (error) {
      console.error("Error fetching clinic:", error);
    }
  };

  const fetchAnalytics = async () => {
    if (!clinicId) return;
    
    setLoadingAnalytics(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) return;

      const token = await user.getIdToken();

      // Fetch appointments by day
      const responseByDay = await fetch(`${BASE_URL}/api/clinicas/${clinicId}/citas-por-dia`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      // Fetch canceled appointments
      const responseCanceled = await fetch(`${BASE_URL}/api/clinicas/${clinicId}/citas-canceladas`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (responseByDay.ok) {
        const dataByDay = await responseByDay.json();
        setAppointmentsByDay(dataByDay);
        console.log(`📊 Appointments by day loaded: ${dataByDay.length}`);
      }

      if (responseCanceled.ok) {
        const dataCanceled = await responseCanceled.json();
        setCanceledAppointments(dataCanceled);
        console.log(`📊 Canceled appointments loaded: ${dataCanceled.length}`);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchDoctors = async () => {
    if (!clinicId) return;
    
    setLoadingDoctors(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) return;

      const token = await user.getIdToken();

      const response = await fetch(`${BASE_URL}/api/clinicas/${clinicId}/doctores`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        const uniqueDoctors = {};
        data.forEach((doc) => {
          if (!uniqueDoctors[doc.uid]) {
            uniqueDoctors[doc.uid] = {
              uid: doc.uid,
              nombre_doctor: doc.nombre_doctor,
              correo: doc.correo,
              especializacion: doc.especializacion,
              horarios: [],
            };
          }
          uniqueDoctors[doc.uid].horarios.push({
            dia_semana: doc.dia_semana,
            hora_inicio: doc.hora_inicio,
            hora_fin: doc.hora_fin,
          });
        });

        setDoctors(Object.values(uniqueDoctors));
        console.log(`👨‍⚕️ Doctors loaded: ${Object.keys(uniqueDoctors).length}`);
      } else {
        console.error("Error fetching doctors");
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchSpecialties = async () => {
    if (!clinicId) return;
    
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) return;

      const token = await user.getIdToken();

      const response = await fetch(`${BASE_URL}/api/clinicas/${clinicId}/especialidades`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSpecialties(data);
        console.log(`🩺 Specialties loaded: ${data.length}`);
      } else {
        console.error("Error fetching specialties");
      }
    } catch (error) {
      console.error("Error fetching specialties:", error);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      console.log(`📡 Fetching appointments with status: ${selectedStatus}`);
      
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        Alert.alert("Error", "Usuario no autenticado");
        setLoading(false);
        return;
      }

      const token = await user.getIdToken();

      const selectedStateObj = APPOINTMENT_STATES.find(
        (state) => state.id === selectedStatus
      );
      const estadoNombre = selectedStateObj ? selectedStateObj.name : "";

      const url = `${BASE_URL}/api/citas/admin?estado=${encodeURIComponent(estadoNombre)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Appointments fetched: ${data.length}`);
        setAppointments(data);
        processMarkedDates(data);
      } else {
        const errorText = await response.text();
        console.error("❌ Error fetching appointments:", errorText);
        Alert.alert("Error", "No se pudieron cargar las citas");
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      Alert.alert(
        "Error de conexión",
        "No se pudo conectar con el servidor. Verifica tu conexión."
      );
    } finally {
      setLoading(false);
    }
  };

  const processMarkedDates = (appointmentsData) => {
    const marked = {};
    const appointmentsByDate = {};

    appointmentsData.forEach((appointment) => {
      const date = appointment.fecha;

      if (!appointmentsByDate[date]) {
        appointmentsByDate[date] = 0;
      }
      appointmentsByDate[date]++;
    });

    Object.keys(appointmentsByDate).forEach((date) => {
      const statusColor =
        APPOINTMENT_STATES.find((s) => s.id === selectedStatus)?.color ||
        "#007AFF";

      marked[date] = {
        marked: true,
        dotColor: statusColor,
      };
    });

    setMarkedDates(marked);
  };

  const handleDayPress = (day) => {
    const dateString = day.dateString;
    setSelectedDate(dateString);

    const dayAppointments = appointments.filter(
      (apt) => apt.fecha === dateString
    );

    if (dayAppointments.length > 0) {
      setSelectedDayAppointments(dayAppointments);
      setModalVisible(true);
    } else {
      Alert.alert("Sin citas", `No hay citas para el ${dateString}`);
    }
  };

  const handleDoctorPress = (doctor) => {
    setSelectedDoctor(doctor);
    setDoctorScheduleModal(true);
  };

  const getStatusColor = (estado) => {
    return APPOINTMENT_STATES.find((s) => s.name === estado)?.color || "#999";
  };

  const getCurrentStatusName = () => {
    return APPOINTMENT_STATES.find((s) => s.id === selectedStatus)?.name || "";
  };

  const handleStatusSelect = (statusId) => {
    setSelectedStatus(statusId);
    setDropdownVisible(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const renderBarChart = (data, color, title, maxHeight = 150) => {
    if (!data || data.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>{title}</Text>
          <Text style={styles.emptyText}>No hay datos disponibles</Text>
        </View>
      );
    }

    const maxValue = Math.max(...data.map(item => item.total_citas || item.total_canceladas || 0));
    const scale = maxValue > 0 ? maxHeight / maxValue : 1;

    // Take only last 7 entries for better visualization
    const displayData = data.slice(-7);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chart}>
            {displayData.map((item, index) => {
              const value = item.total_citas || item.total_canceladas || 0;
              const height = value * scale;
              
              return (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <Text style={styles.barValue}>{value}</Text>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(height, 20),
                          backgroundColor: color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barDate}>{formatDate(item.fecha)}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Buscar"
          style={styles.searchInput}
          placeholderTextColor="#999"
        />
        <Ionicons name="filter-outline" size={20} color="#999" />
      </View>

      {/* Status Filter */}
      <Text style={styles.sectionTitle}>Filtrar por Estado</Text>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setDropdownVisible(!dropdownVisible)}
      >
        <View style={styles.dropdownButtonContent}>
          <View
            style={[
              styles.dropdownDot,
              {
                backgroundColor:
                  APPOINTMENT_STATES.find((s) => s.id === selectedStatus)
                    ?.color || "#007AFF",
              },
            ]}
          />
          <Text style={styles.dropdownButtonText}>
            {getCurrentStatusName()}
          </Text>
        </View>
        <Ionicons
          name={dropdownVisible ? "chevron-up" : "chevron-down"}
          size={20}
          color="#666"
        />
      </TouchableOpacity>

      {dropdownVisible && (
        <View style={styles.dropdownMenu}>
          {APPOINTMENT_STATES.map((state) => (
            <TouchableOpacity
              key={state.id}
              style={[
                styles.dropdownItem,
                selectedStatus === state.id && styles.dropdownItemSelected,
              ]}
              onPress={() => handleStatusSelect(state.id)}
            >
              <View style={styles.dropdownItemContent}>
                <View
                  style={[
                    styles.dropdownItemDot,
                    { backgroundColor: state.color },
                  ]}
                />
                <Text
                  style={[
                    styles.dropdownItemText,
                    selectedStatus === state.id && styles.dropdownItemTextSelected,
                  ]}
                >
                  {state.name}
                </Text>
              </View>
              {selectedStatus === state.id && (
                <Ionicons name="checkmark" size={20} color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Calendar */}
      <Text style={styles.sectionTitle}>Calendario de Citas</Text>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#007AFF"
          style={styles.loader}
        />
      ) : (
        <>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={{
              ...markedDates,
              [selectedDate]: {
                ...markedDates[selectedDate],
                selected: true,
                selectedColor: "#007AFF",
              },
            }}
            theme={{
              selectedDayBackgroundColor: "#007AFF",
              todayTextColor: "#FF5733",
              arrowColor: "#007AFF",
            }}
            style={styles.calendar}
          />
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              Total de citas: {appointments.length}
            </Text>
            <TouchableOpacity onPress={fetchAppointments} style={styles.refreshButton}>
              <Ionicons name="refresh" size={16} color="#007AFF" />
              <Text style={styles.refreshText}>Actualizar</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Appointments Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Citas - {selectedDate}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedDayAppointments.map((apt) => (
                <View key={apt.id_cita} style={styles.appointmentCard}>
                  <View style={styles.appointmentHeader}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(apt.estado) },
                      ]}
                    />
                    <Text style={styles.appointmentTime}>
                      {apt.hora_inicio.substring(0, 5)}
                    </Text>
                  </View>
                  <Text style={styles.appointmentDoctor}>
                    👨‍⚕️ {apt.doctor}
                  </Text>
                  <Text style={styles.appointmentPatient}>
                    👤 {apt.paciente}
                  </Text>
                  <Text style={styles.appointmentClinic}>
                    🏥 {apt.clinica}
                  </Text>
                  <View style={styles.statusBadgeContainer}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: `${getStatusColor(apt.estado)}20`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(apt.estado) },
                        ]}
                      >
                        {apt.estado}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Doctor Schedule Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={doctorScheduleModal}
        onRequestClose={() => setDoctorScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDoctor?.nombre_doctor}
              </Text>
              <TouchableOpacity onPress={() => setDoctorScheduleModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.doctorDetailCard}>
                <Text style={styles.doctorDetailLabel}>Correo:</Text>
                <Text style={styles.doctorDetailValue}>
                  {selectedDoctor?.correo}
                </Text>
                
                <Text style={styles.doctorDetailLabel}>Especialización:</Text>
                <Text style={styles.doctorDetailValue}>
                  {selectedDoctor?.especializacion}
                </Text>

                <Text style={styles.doctorDetailLabel}>Horarios:</Text>
                {selectedDoctor?.horarios
                  .sort((a, b) => a.dia_semana - b.dia_semana)
                  .map((horario, index) => (
                    <View key={index} style={styles.scheduleItem}>
                      <View style={styles.scheduleDay}>
                        <Ionicons name="calendar-outline" size={16} color="#007AFF" />
                        <Text style={styles.scheduleDayText}>
                          {DIAS_SEMANA[horario.dia_semana]}
                        </Text>
                      </View>
                      <View style={styles.scheduleTime}>
                        <Ionicons name="time-outline" size={16} color="#666" />
                        <Text style={styles.scheduleTimeText}>
                          {horario.hora_inicio.substring(0, 5)} - {horario.hora_fin.substring(0, 5)}
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Analytics Charts */}
      <Text style={styles.sectionTitle}>Analíticas</Text>
      {loadingAnalytics ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <>
          {renderBarChart(appointmentsByDay, "#007AFF", "Citas por Día")}
          {renderBarChart(canceledAppointments, "#dc3545", "Citas Canceladas por Día")}
        </>
      )}

      {/* Doctors List */}
      <Text style={styles.sectionTitle}>Lista de Médicos Disponibles</Text>
      {loadingDoctors ? (
        <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 20 }} />
      ) : doctors.length > 0 ? (
        doctors.map((doctor) => (
          <TouchableOpacity
            key={doctor.uid}
            style={styles.doctorCard}
            onPress={() => handleDoctorPress(doctor)}
          >
            <View style={styles.doctorIconContainer}>
              <Ionicons name="person-circle" size={50} color="#007AFF" />
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doctor.nombre_doctor}</Text>
              <Text style={styles.doctorSpecialty}>{doctor.especializacion}</Text>
              <Text style={styles.doctorEmail}>{doctor.correo}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.emptyText}>No hay médicos disponibles</Text>
      )}

      {/* Specialties List */}
      <Text style={styles.sectionTitle}>Especialidades Disponibles</Text>
      {specialties.length > 0 ? (
        <View style={styles.specialtiesContainer}>
          {specialties.map((specialty) => (
            <View key={specialty.id_especializacion} style={styles.specialtyChip}>
              <Ionicons name="medical" size={16} color="#007AFF" />
              <Text style={styles.specialtyText}>{specialty.nombre}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>No hay especialidades disponibles</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#fff" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#000",
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  dropdownButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  dropdownMenu: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemSelected: {
    backgroundColor: "#f0f8ff",
  },
  dropdownItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownItemDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownItemTextSelected: {
    color: "#007AFF",
    fontWeight: "600",
  },
  calendar: {
    borderRadius: 10,
    marginBottom: 10,
  },
  loader: {
    marginVertical: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  statsText: {
    fontSize: 14,
    color: "#666",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  refreshText: {
    fontSize: 14,
    color: "#007AFF",
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  modalScroll: {
    padding: 20,
  },
  appointmentCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  appointmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  appointmentTime: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  appointmentDoctor: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  appointmentPatient: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  appointmentClinic: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  statusBadgeContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  doctorDetailCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
  },
  doctorDetailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginTop: 10,
    marginBottom: 5,
  },
  doctorDetailValue: {
    fontSize: 16,
    color: "#000",
    marginBottom: 10,
  },
  scheduleItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  scheduleDay: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  scheduleDayText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginLeft: 8,
  },
  scheduleTime: {
    flexDirection: "row",
    alignItems: "center",
  },
  scheduleTimeText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  // Analytics Chart Styles
  chartContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 15,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 200,
    paddingBottom: 30,
  },
  barContainer: {
    alignItems: "center",
    marginHorizontal: 8,
  },
  barWrapper: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: 170,
  },
  bar: {
    width: 40,
    borderRadius: 5,
    minHeight: 20,
  },
  barValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
    marginBottom: 5,
  },
  barDate: {
    fontSize: 11,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  doctorIconContainer: {
    marginRight: 10,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 2,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: "#007AFF",
    marginBottom: 2,
  },
  doctorEmail: {
    fontSize: 12,
    color: "#666",
  },
  specialtiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  specialtyChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e3f2fd",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    gap: 5,
  },
  specialtyText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
    marginLeft: 5,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginVertical: 20,
    fontStyle: "italic",
  },
});

export default AdminView;