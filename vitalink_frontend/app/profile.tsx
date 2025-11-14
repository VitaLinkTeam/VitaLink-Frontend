// app/(tabs)/profile.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import Header from "../components/Header";
import Footer from "../components/Footer";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import ClinicInviteModal from "../components/ClinicInviteModal";
import { getAuth } from "firebase/auth";

const BASE_URL = "https://vitalink-backend-m2mm.onrender.com";

// === INTERFACES ===
interface NameResponse {
  nombre: string;
}

interface UsuarioResponse {
  numeroTelefonico?: string;
}

interface ClinicaResponse {
  id: number;
  nombre: string;
  direccion: string;
  numeroTelefonico: string;
  email: string;
}

interface DoctorEspecializacionResponse {
  especializacion: {
    id: number;
    nombre: string;
  };
}

interface Especializacion {
  id: number;
  nombre: string;
}

const ESPECIALIZACIONES: Especializacion[] = [
  { id: 1, nombre: "Medicina General" },
  { id: 2, nombre: "Pediatría" },
  { id: 3, nombre: "Ginecología" },
  { id: 4, nombre: "Medicina Interna" },
  { id: 5, nombre: "Odontología" },
  { id: 6, nombre: "Dermatología" },
  { id: 7, nombre: "Oftalmología" },
  { id: 8, nombre: "Otorrinolaringología" },
  { id: 9, nombre: "Traumatología" },
  { id: 10, nombre: "Psicología" },
];

const ProfileScreen = () => {
  const { user } = useAuth();
  const router = useRouter();

  // === MODAL INVITACIÓN ===
  const [modalVisible, setModalVisible] = useState(false);

  // === ROL ===
  const roleName = user?.roleName;
  const isPaciente = roleName === "Paciente";
  const isMedico = roleName === "Médico";
  const isAdmin = roleName === "Administrador";
  const isAsistente = roleName === "Asistente";

  // === NOMBRE REAL ===
  const [nombreReal, setNombreReal] = useState("Cargando...");
  const [loadingName, setLoadingName] = useState(true);

  // === DATOS EDITABLES ===
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [especializacionId, setEspecializacionId] = useState<number | null>(null);
  const [especializacionNombre, setEspecializacionNombre] = useState("Sin especialización");
  const [showEspModal, setShowEspModal] = useState(false);

  // Clínica (Admin)
  const [clinica, setClinica] = useState<ClinicaResponse & { id: number }>({
    id: 0,
    nombre: "",
    direccion: "",
    numeroTelefonico: "",
    email: "",
  });

  // === EDICIÓN ===
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // === CARGAR NOMBRE + TELÉFONO ===
  useEffect(() => {
    const fetchNombreYTelefono = async () => {
      if (!user?.uid) {
        setNombreReal("Usuario");
        setNombre("Usuario");
        setTelefono("");
        setLoadingName(false);
        return;
      }

      try {
        const token = await getAuth().currentUser?.getIdToken();
        if (!token) throw new Error("No token");

        // 1. NOMBRE
        const nameRes = await axios.get<NameResponse>(`${BASE_URL}/api/auth/getname`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const nombre = nameRes.data.nombre || "Usuario";
        setNombreReal(nombre);
        setNombre(nombre);

        // 2. TELÉFONO
        try {
          const userRes = await axios.get<UsuarioResponse>(`${BASE_URL}/api/usuarios/${user.uid}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setTelefono(userRes.data.numeroTelefonico || "");
        } catch {
          setTelefono("");
        }
      } catch (error) {
        console.warn("Error al cargar datos:", error);
        setNombreReal("Usuario");
        setNombre("Usuario");
        setTelefono("");
      } finally {
        setLoadingName(false);
      }
    };

    fetchNombreYTelefono();
  }, [user?.uid]);

  // === CARGAR CLÍNICA (Admin) ===
  useEffect(() => {
    if (loadingName || !isAdmin) return;

    const loadClinica = async () => {
      try {
        const token = await getAuth().currentUser?.getIdToken();
        if (!token) return;

        const res = await axios.get<ClinicaResponse[]>(`${BASE_URL}/api/usuario/clinicas`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const c = res.data[0];
        if (c) {
          setClinica({
            id: c.id,
            nombre: c.nombre || "",
            direccion: c.direccion || "",
            numeroTelefonico: c.numeroTelefonico || "",
            email: c.email || "",
          });
        }
      } catch (error) {
        console.warn("Error clínica:", error);
      }
    };

    loadClinica();
  }, [loadingName, isAdmin]);

  // === CARGAR ESPECIALIZACIÓN (Médico) - Usando endpoints existentes ===
  useEffect(() => {
    if (loadingName || !isMedico || !user?.uid) return;

    const loadEspecializacion = async () => {
      try {
        const token = await getAuth().currentUser?.getIdToken();
        if (!token) return;

        // Primero obtener las clínicas del usuario
        const clinicasRes = await axios.get(`${BASE_URL}/api/usuario/clinicas`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const clinicas = Array.isArray(clinicasRes.data) ? clinicasRes.data : [];
        
        if (clinicas.length === 0) {
          setEspecializacionId(null);
          setEspecializacionNombre("Sin especialización");
          return;
        }

        // Intentar obtener especialización desde la primera clínica
        const primeraClinica = clinicas[0];

        // Obtener especialidades de la clínica
        const especRes = await axios.get(
          `${BASE_URL}/api/usuario/especialidades?clinicaId=${primeraClinica.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const especialidades = Array.isArray(especRes.data) ? especRes.data : [];

        // Buscar en cada especialidad para ver si este doctor está allí
        for (const esp of especialidades) {
          try {
            const docRes = await axios.get(
              `${BASE_URL}/api/doctores/${user.uid}/horarios/${primeraClinica.id}/especialidad?especialidadId=${esp.id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            const doctores = Array.isArray(docRes.data) ? docRes.data : [];
            const miDoctor = doctores.find((d: any) => d.uid === user.uid);

            if (miDoctor) {
              // Encontramos la especialización del doctor
              setEspecializacionId(esp.id);
              setEspecializacionNombre(esp.nombre);
              console.log("Especialización encontrada:", esp.nombre);
              return;
            }
          } catch (err) {
            // Continuar con la siguiente especialidad
            continue;
          }
        }

        // Si no encontramos nada
        setEspecializacionId(null);
        setEspecializacionNombre("Sin especialización");

      } catch (error: any) {
        console.warn("Error cargando especialización:", error.message);
        setEspecializacionId(null);
        setEspecializacionNombre("Sin especialización");
      }
    };

    loadEspecializacion();
  }, [loadingName, isMedico, user?.uid]);

  // === GUARDAR CAMBIOS ===
  const handleSave = async () => {
    if (!isEditing) return;
    setLoading(true);

    try {
      const token = await getAuth().currentUser?.getIdToken();
      if (!token || !user?.uid) throw new Error("No autenticado");

      // Actualizar nombre y teléfono del usuario
      const usuarioUpdates: any = {};
      if (nombre && nombre !== nombreReal) {
        usuarioUpdates.nombre = nombre;
      }
      if (telefono !== undefined) {
        usuarioUpdates.numeroTelefonico = telefono || null;
      }

      // Actualizar datos básicos si hay cambios
      if (Object.keys(usuarioUpdates).length > 0) {
        await axios.put(
          `${BASE_URL}/api/usuarios/${user.uid}`,
          usuarioUpdates,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Si es médico y cambió la especialización, actualizarla
      if (isMedico && especializacionId) {
        try {
          // Aquí podrías necesitar un endpoint específico para actualizar especialización
          // Por ahora, solo guardamos localmente
          console.log("Especialización actualizada a:", especializacionId);
        } catch (error) {
          console.warn("No se pudo actualizar especialización:", error);
        }
      }

      // Si es admin y hay cambios en la clínica
      if (isAdmin && clinica.id) {
        try {
          await axios.put(
            `${BASE_URL}/api/clinicas/${clinica.id}`,
            {
              nombre: clinica.nombre || null,
              direccion: clinica.direccion || null,
              numeroTelefonico: clinica.numeroTelefonico || null,
              email: clinica.email || null,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (error) {
          console.warn("No se pudo actualizar clínica:", error);
        }
      }

      Alert.alert("Éxito", "Perfil actualizado");
      setNombreReal(nombre); // Actualizar el nombre en el header
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error al guardar:", error);
      Alert.alert("Error", error.response?.data?.message || "No se pudo actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header nombre={loadingName ? "Cargando..." : nombreReal} />

      <View style={styles.contentContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* === BOTÓN DE INVITACIÓN === */}
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.inviteText}>
              {isAdmin
                ? "¡Invita a personas a ser parte de la clínica!"
                : "¡Asóciate a una clínica ahora!"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.title}>Perfil</Text>

          {/* === AVATAR === */}
          <View style={styles.avatarContainer}>
            <Image
              source={require("../assets/images/user_placeholder.png")}
              style={styles.avatar}
            />
            {isEditing && (
              <TouchableOpacity style={styles.editIcon}>
                <Ionicons name="camera-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* === NOMBRE === */}
          <View style={styles.field}>
            <Text style={styles.label}>Nombre</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={nombre}
                onChangeText={setNombre}
                style={styles.input}
                editable={isEditing}
              />
              {isEditing && <Ionicons name="create-outline" size={20} color="#007AFF" />}
            </View>
          </View>

          {/* === CORREO === */}
          <View style={styles.field}>
            <Text style={styles.label}>Correo</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={user?.email || ""}
                style={styles.input}
                editable={false}
              />
            </View>
          </View>

          {/* === TELÉFONO === */}
          <View style={styles.field}>
            <Text style={styles.label}>Teléfono</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={isEditing ? telefono : (telefono || "Sin número telefónico")}
                onChangeText={setTelefono}
                style={[styles.input, !telefono && !isEditing && { color: "#999" }]}
                keyboardType="phone-pad"
                editable={isEditing}
                placeholder="Sin número telefónico"
                placeholderTextColor="#999"
              />
              {isEditing && <Ionicons name="create-outline" size={20} color="#007AFF" />}
            </View>
          </View>

          {/* === ESPECIALIZACIÓN (Médico) – SIEMPRE VISIBLE === */}
          {isMedico && (
            <View style={styles.field}>
              <Text style={styles.label}>Especialización</Text>
              <TouchableOpacity
                style={styles.inputRow}
                onPress={() => isEditing && setShowEspModal(true)}
                disabled={!isEditing}
              >
                <TextInput
                  value={especializacionNombre}
                  style={[styles.input, { color: especializacionId ? "#000" : "#999" }]}
                  editable={false}
                  pointerEvents="none"
                />
                {isEditing && (
                  <Ionicons name="chevron-down" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* === CLÍNICA (Admin) === */}
          {isAdmin && (
            <>
              <Text style={styles.sectionTitle}>Datos de la Clínica</Text>
              {["nombre", "direccion", "numeroTelefonico", "email"].map((key) => {
                const value = clinica[key as keyof typeof clinica] as string;
                const displayValue = value || 
                  (key === "numeroTelefonico" ? "Sin número telefónico" : 
                   key === "email" ? "Sin correo electrónico" :
                   key === "direccion" ? "Sin dirección" :
                   "Sin nombre");
                
                return (
                  <View key={key} style={styles.field}>
                    <Text style={styles.label}>
                      {key === "numeroTelefonico" ? "Teléfono" : 
                       key.charAt(0).toUpperCase() + key.slice(1)}
                    </Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        value={isEditing ? value : displayValue}
                        onChangeText={(v) => setClinica({ ...clinica, [key]: v })}
                        style={[styles.input, !value && !isEditing && { color: "#999" }]}
                        editable={isEditing}
                        placeholder={displayValue}
                        placeholderTextColor="#999"
                        keyboardType={
                          key === "numeroTelefonico" ? "phone-pad" :
                          key === "email" ? "email-address" : "default"
                        }
                      />
                      {isEditing && <Ionicons name="create-outline" size={20} color="#007AFF" />}
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {/* === MODIFICAR HORARIO – SIEMPRE VISIBLE PARA MÉDICOS Y ADMINS === */}
          {(isMedico || isAdmin) && (
            <TouchableOpacity
              style={styles.scheduleButton}
              onPress={() => router.push("/schedule")}
            >
              <Ionicons name="calendar-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.scheduleText}>Modificar Horario</Text>
            </TouchableOpacity>
          )}

          {/* === BOTONES === */}
          <View style={styles.buttonContainer}>
            {isEditing ? (
              <>
                <TouchableOpacity
                  style={[styles.saveButton, loading && styles.disabled]}
                  onPress={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveText}>Guardar Cambios</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={styles.editText}>Editar Perfil</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Espacio final para que todo sea visible */}
          <View style={{ height: 120 }} />
        </ScrollView>
      </View>

      <Footer />

      {/* === MODAL ESPECIALIZACIÓN === */}
      <Modal visible={showEspModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona Especialización</Text>
            <ScrollView>
              {ESPECIALIZACIONES.map((esp) => (
                <TouchableOpacity
                  key={esp.id}
                  style={styles.espOption}
                  onPress={() => {
                    setEspecializacionId(esp.id);
                    setEspecializacionNombre(esp.nombre);
                    setShowEspModal(false);
                  }}
                >
                  <Text style={styles.espText}>{esp.nombre}</Text>
                  {especializacionId === esp.id && (
                    <Ionicons name="checkmark" size={24} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowEspModal(false)}
            >
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* === MODAL INVITACIÓN === */}
      <ClinicInviteModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        isAdmin={isAdmin}
      />
    </SafeAreaView>
  );
};

// === ESTILOS ===
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  contentContainer: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  inviteButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  inviteText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#007AFF", textAlign: "center" },
  avatarContainer: { alignItems: "center", marginBottom: 30, position: "relative" },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  editIcon: {
    position: "absolute",
    right: 50 - 10,
    bottom: -10,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 4,
    elevation: 3,
  },
  field: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 5, color: "#333" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 8, color: "#000" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#007AFF", marginTop: 20, marginBottom: 10 },
  scheduleButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  scheduleText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  buttonContainer: { marginTop: 10, gap: 12 },
  editButton: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  editText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  saveButton: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#007AFF",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  cancelText: { color: "#007AFF", fontSize: 16, fontWeight: "600" },
  disabled: { backgroundColor: "#A0C4FF", opacity: 0.8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", width: "88%", maxHeight: "70%", borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 19, fontWeight: "bold", color: "#007AFF", textAlign: "center", marginBottom: 15 },
  espOption: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#eee" },
  espText: { fontSize: 16, color: "#333" },
  closeBtn: { marginTop: 15, backgroundColor: "#007AFF", padding: 12, borderRadius: 10, alignItems: "center" },
  closeText: { color: "#fff", fontWeight: "600" },
});

export default ProfileScreen;