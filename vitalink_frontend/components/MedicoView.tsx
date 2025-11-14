import React, { useState, useEffect, useMemo } from "react";
import {
    View,
    Text,
     TextInput,
     TouchableOpacity,
     StyleSheet,
     Image,
     ScrollView,
     ActivityIndicator,
     Alert
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";

const BASE_URL = "https://vitalink-backend-m2mm.onrender.com";

interface Cita {
    fecha: string;
    paciente: string;
    hora_inicio: string;
    id_cita: number;
    clinica: string;
    estado: 'Programada' | 'Confirmada' | 'En curso' | 'Completada' | 'Cancelada' | 'No asistió';
  }


const MedicoView = () => {
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [citas, setCitas] = useState<Cita[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [search, setSearch] = useState<string>("");
    const { token } = useAuth();


    const fetchCitas = async () => {
        try {
            setLoading(true);


            const response = await fetch(`${BASE_URL}/api/citas/confirmadas/doctor`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error("Error en la respuesta del servidor:", errorData);
              throw new Error("No se pudo obtener las citas");
            }

            const data: Cita[] = await response.json();
            setCitas(data);
        } catch (error: any) {
            console.error("Error al obtener citas:", error);
            Alert.alert("Error", "No se pudieron cargar las citas del médico.");
        } finally {
            setLoading(false);
        }
    };

     useEffect(() => {
            fetchCitas();
        }, []);


    const markedDates = useMemo(() => {
        const marks: Record<string, any> = {};

        citas.forEach((cita) => {
          const fecha = cita.fecha; // Se asume formato 'YYYY-MM-DD'
          if (!marks[fecha]) {
            marks[fecha] = {
              marked: true,
              dotColor: "#007AFF",
            };
          }
        });

        if (selectedDate) {
          marks[selectedDate] = {
            ...(marks[selectedDate] || {}),
            selected: true,
            selectedColor: "#007AFF",
            marked: true,
          };
        }

        return marks;
      }, [citas, selectedDate]);

    const citasFiltradas = useMemo(() => {
        let lista = citas;

        // Filtrar por nombre de paciente si hay texto en el buscador
        if (search.trim() !== "") {
          const term = search.trim().toLowerCase();
          lista = lista.filter((c) => c.paciente.toLowerCase().includes(term));
        }

        // Si se seleccionó fecha, mostrar solo esa fecha
        if (selectedDate) {
          lista = lista.filter((c) => c.fecha === selectedDate);
        } else {
          // Si NO hay fecha seleccionada, mostrar las próximas (por ejemplo, primeras 5)
          lista = lista.slice(0, 5);
        }

        return lista;
      }, [citas, selectedDate, search]);

    return (
        <ScrollView style={styles.container}>
        {/* Buscador */}
        <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#999" />
            <TextInput
              placeholder="Buscar"
              style={styles.searchInput}
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />

            <TouchableOpacity onPress={fetchCitas}>
                <Ionicons name="refresh-outline" size={22} color="#007AFF" />
            </TouchableOpacity>
        </View>

        {/* Calendario */}
        <Text style={styles.sectionTitle}>Calendario</Text>
        <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}

            theme={{
                selectedDayBackgroundColor: "#007AFF",
                todayTextColor: "#FF5733",
                arrowColor: "#007AFF",
            }}
            style={styles.calendar}
        />
        {selectedDate ? (
           <Text style={styles.selectedDate}>Fecha seleccionada: {selectedDate}</Text>
        ) : (
           <Text style={styles.selectedDate}>Mostrando próximas citas</Text>
        )}

        {/* Cargando */}
        {loading && (
            <View style={{ marginVertical: 10 }}>
                <ActivityIndicator size="small" />
            </View>
        )}

        {/* Citas próximas / del día */}
        <Text style={styles.sectionTitle}>
            {selectedDate ? "Citas de esta fecha" : "Pacientes con citas próximas"}
        </Text>

         {citasFiltradas.length === 0 && !loading ? (
        <Text style={{ textAlign: "center", color: "#666", marginBottom: 10 }}>
                No hay citas para mostrar.
        </Text>
        ) : null}

        {citasFiltradas.map((cita) => (
            <View key={cita.id_cita} style={styles.appointmentCard}>
                <Text style={styles.patientName}>{cita.paciente}</Text>
                <Text style={styles.appointmentDate}>
                    Fecha: {cita.fecha} · Hora: {cita.hora_inicio}
                </Text>
                <Text style={styles.appointmentDate}>Clínica: {cita.clinica}</Text>
                <Text style={styles.appointmentDate}>Estado: {cita.estado}</Text>
            </View>
        ))}


      {/* Recomendaciones */}
      <Text style={styles.sectionTitle}>Recomendaciones a paciente de la última cita</Text>
      <View style={styles.recommendationCard}>
        <View style={styles.recommendationHeader}>
          <Text style={styles.patientName}>Juan Arce</Text>
          <Text style={styles.appointmentDate}>Ult. cita: 25/08/2025</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={30} color="#007AFF" />
        </TouchableOpacity>
      </View>
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
    marginHorizontal: 8,
    fontSize: 16,
    color: "#000",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#007AFF",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  name: { fontSize: 18, fontWeight: "bold", color: "#000" },
  subtitle: { fontSize: 14, color: "#666" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#000",
  },
  calendar: {
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedDate: {
    fontSize: 14,
    color: "#007AFF",
    marginBottom: 20,
    textAlign: "center",
  },
  appointmentCard: {
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  patientName: { fontSize: 16, fontWeight: "bold", color: "#000" },
  appointmentDate: { fontSize: 14, color: "#555" },
  moreButton: {
    alignSelf: "center",
    marginVertical: 10,
  },
  recommendationCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  recommendationHeader: {
    flex: 1,
  },
  addButton: {
    padding: 5,
  },
});

export default MedicoView;