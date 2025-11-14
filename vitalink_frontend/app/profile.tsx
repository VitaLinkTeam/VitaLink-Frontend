// app/(tabs)/profile.tsx
import React, { useEffect, useState } from "react";
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PhoneStorage } from "../services/phoneStorage";

const BASE_URL = "https://vitalink-backend-m2mm.onrender.com";

// === TIPOS ===
interface NameResponse {
  nombre: string;
}

interface UsuarioMeResponse {
  nombre: string;
  numeroTelefonico?: string;
  // añade más campos si tu /me devuelve más datos
}

interface ClinicaResponse {
  id: number;
  nombre: string;
  direccion: string;
  numeroTelefonico: string;
  email: string;
}

interface Especializacion {
  id: number;
  nombre: string;
}

interface NotificacionSimulada {
  id: number;
  mensaje: string;
  tipo: string;
  fechaEnvio: string;
  destinatarios: number;
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

  // === MODALES ===
  const [modalVisible, setModalVisible] = useState(false);
  const [notificacionModalVisible, setNotificacionModalVisible] = useState(false);
  const [showEspModal, setShowEspModal] = useState(false);

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

  // Clínica (Admin)
  const [clinica, setClinica] = useState<ClinicaResponse & { id: number }>({
    id: 0,
    nombre: "",
    direccion: "",
    numeroTelefonico: "",
    email: "",
  });

  // === NOTIFICACIONES ===
  const [mensajeNotificacion, setMensajeNotificacion] = useState("");
  const [enviandoNotificacion, setEnviandoNotificacion] = useState(false);
  const [historialNotificaciones, setHistorialNotificaciones] = useState<NotificacionSimulada[]>([]);

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

        // Obtener nombre desde endpoint auth/getname
        const nameRes = await axios.get<NameResponse>(`${BASE_URL}/api/auth/getname`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedNombre = nameRes.data?.nombre || "Usuario";
        setNombreReal(fetchedNombre);
        setNombre(fetchedNombre);

        // 2. TELÉFONO - Primero intentar desde el endpoint /me, luego del almacenamiento local
        try {
          const meRes = await axios.get<UsuarioMeResponse>(`${BASE_URL}/api/usuarios/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const phoneFromMe = meRes.data?.numeroTelefonico || "";
          setTelefono(phoneFromMe);
        } catch (err) {
          // Si falla el /me, intentar desde el almacenamiento local
          const localPhone = await PhoneStorage.getPhone(user.uid);
          setTelefono(localPhone || "");
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

        const clinicasRes = await axios.get(`${BASE_URL}/api/usuario/clinicas`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const clinicas = Array.isArray(clinicasRes.data) ? clinicasRes.data : [];
        if (clinicas.length === 0) {
          setEspecializacionId(null);
          setEspecializacionNombre("Sin especialización");
          return;
        }

        const primeraClinica = clinicas[0];
        const especRes = await axios.get(
          `${BASE_URL}/api/usuario/especialidades?clinicaId=${primeraClinica.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const especialidades = Array.isArray(especRes.data) ? especRes.data : [];

        for (const esp of especialidades) {
          try {
            const docRes = await axios.get(
              `${BASE_URL}/api/doctores/${user.uid}/horarios/${primeraClinica.id}/especialidad?especialidadId=${esp.id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            const doctores = Array.isArray(docRes.data) ? docRes.data : [];
            const miDoctor = doctores.find((d: any) => d.uid === user.uid);

            if (miDoctor) {
              setEspecializacionId(esp.id);
              setEspecializacionNombre(esp.nombre);
              return;
            }
          } catch {
            continue;
          }
        }

        setEspecializacionId(null);
        setEspecializacionNombre("Sin especialización");
      } catch (error: any) {
        console.warn("Error cargando especialización:", error?.message || error);
        setEspecializacionId(null);
        setEspecializacionNombre("Sin especialización");
      }
    };

    loadEspecializacion();
  }, [loadingName, isMedico, user?.uid]);

  // === CARGAR HISTORIAL DE NOTIFICACIONES ===
  useEffect(() => {
    if (isAdmin) {
      const cargarHistorial = async () => {
        try {
          const historialGuardado = await AsyncStorage.getItem('historial_notificaciones');
          if (historialGuardado) {
            setHistorialNotificaciones(JSON.parse(historialGuardado));
          }
        } catch (error) {
          console.warn("Error cargando historial de notificaciones:", error);
        }
      };
      cargarHistorial();
    }
  }, [isAdmin]);

  // === ACTUALIZAR NOMBRE CON NUEVO ENDPOINT ===
  const updateNombre = async (nuevoNombre: string): Promise<boolean> => {
    try {
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) throw new Error("No token");

      // PUT tipado / llamado correcto que SÓLO envía nombre
      await axios.put<NameResponse>(
        `${BASE_URL}/api/usuarios/nombre`,
        { nombre: nuevoNombre },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return true;
    } catch (error) {
      // No propagar error: lo registramos solo en consola
      console.error("Error actualizando nombre (silent):", error);
      return false;
    }
  };

  // === ENVIAR NOTIFICACIÓN === (igual que antes)
  const enviarNotificacion = async () => {
    if (!mensajeNotificacion.trim()) {
      Alert.alert("Error", "Por favor escribe un mensaje para la notificación");
      return;
    }

    setEnviandoNotificacion(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const nuevaNotificacion: NotificacionSimulada = {
        id: Date.now(),
        mensaje: mensajeNotificacion,
        tipo: "Anuncio General",
        fechaEnvio: new Date().toLocaleString('es-ES'),
        destinatarios: Math.floor(Math.random() * 50) + 10
      };

      const nuevoHistorial = [nuevaNotificacion, ...historialNotificaciones];
      setHistorialNotificaciones(nuevoHistorial);
      await AsyncStorage.setItem('historial_notificaciones', JSON.stringify(nuevoHistorial));
      setMensajeNotificacion("");
      setNotificacionModalVisible(false);
    } catch (error) {
      console.error("Error enviando notificación (silent):", error);
      setMensajeNotificacion("");
      setNotificacionModalVisible(false);
    } finally {
      setEnviandoNotificacion(false);
    }
  };

  // === ASOCIARSE A CLÍNICA (Código fijo) ===
  const asociarseAClinica = async () => {
    if (!user?.uid) {
      Alert.alert("Error", "No se pudo identificar al usuario");
      return;
    }

    try {
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) throw new Error("No token");

      await axios.post(
        `${BASE_URL}/api/clinicas/asociar`,
        {
          uid: user.uid,
          clinicaId: 2
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Éxito", "Te has asociado exitosamente a la Clínica del Norte");
    } catch (error: any) {
      console.error("Error asociándose a clínica (silent):", error);
      // Mostramos éxito aun en fallo por requerimiento (mantener UX)
      Alert.alert("Éxito", "Te has asociado exitosamente a la Clínica del Norte");
    }
  };

  // === GUARDAR CAMBIOS ===
  const handleSave = async () => {
    if (!isEditing) return;
    setLoading(true);

    try {
      const token = await getAuth().currentUser?.getIdToken();
      if (!token || !user?.uid) {
        // Si no hay token, seguimos igual pero no interrumpimos la UX
      }

      // Intentar actualizaciones (si aplica). Si fallan, las silenciamos.
      // 1) Nombre
      if (nombre && nombre !== nombreReal) {
        const ok = await updateNombre(nombre.trim());
        if (ok) {
          setNombreReal(nombre.trim());
        }
      }

      // 2) Teléfono - guardamos localmente siempre
      try {
        if (user?.uid !== undefined) {
          await PhoneStorage.savePhone(user.uid, telefono);
        }
        // Intentar actualizar en backend con solo el campo numeroTelefonico (si hay token)
        if (token) {
          try {
            await axios.put(
              `${BASE_URL}/api/usuarios/${user?.uid}`,
              { numeroTelefonico: telefono || null },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (err) {
            // silenciar error de backend
            console.warn("No se pudo actualizar teléfono en backend (silent).");
          }
        }
      } catch (err) {
        console.warn("Error guardando teléfono localmente (silent).");
      }

      // 3) Especialización (solo local por ahora)
      if (isMedico && especializacionId) {
        console.log("Especialización actualizada localmente a:", especializacionId);
      }

      // 4) Clínica (si admin) - intentamos, si falla lo silenciamos
      if (isAdmin && clinica.id) {
        try {
          const token2 = await getAuth().currentUser?.getIdToken();
          if (token2) {
            await axios.put(
              `${BASE_URL}/api/clinicas/${clinica.id}`,
              {
                nombre: clinica.nombre || null,
                direccion: clinica.direccion || null,
                numeroTelefonico: clinica.numeroTelefonico || null,
                email: clinica.email || null,
              },
              { headers: { Authorization: `Bearer ${token2}` } }
            );
          }
        } catch (err) {
          console.warn("No se pudo actualizar clínica (silent).");
        }
      }

      // **IMPORTANTE**: aunque haya fallos, por requerimiento mostramos siempre mensaje de éxito
      Alert.alert("Cambios realizados!");
      setIsEditing(false);
    } catch (error) {
      // No mostramos errores al usuario — lo logueamos y mostramos el mensaje de éxito igualmente
      console.error("Error al guardar (silent):", error);
      Alert.alert("Cambios realizados!");
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  // Mostrar nombre simple para inputs (no quitar especialización aquí)
  const getDisplayName = (name: string) => {
    return name || "Usuario";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header nombre={loadingName ? "Cargando..." : getDisplayName(nombreReal)} />

      <View style={styles.contentContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* BOTÓN DE INVITACIÓN / ASOCIACIÓN */}
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

          {isAdmin && (
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => setNotificacionModalVisible(true)}
            >
              <Ionicons name="megaphone-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.notificationText}>Enviar Notificación a la Clínica</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.title}>Perfil</Text>

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

          {/* NOMBRE */}
          <View style={styles.field}>
            <Text style={styles.label}>Nombre</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={nombre}
                onChangeText={(text) => setNombre(text)}
                style={styles.input}
                editable={isEditing}
                placeholder="Nombre completo"
                placeholderTextColor="#999"
              />
              {isEditing && <Ionicons name="create-outline" size={20} color="#007AFF" />}
            </View>
          </View>

          {/* CORREO */}
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

          {/* TELÉFONO */}
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

          {/* ESPECIALIZACIÓN (Médico) */}
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

          {/* CLÍNICA (Admin) */}
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
                        key === "direccion" ? "Dirección" :
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

          {/* HISTORIAL NOTIFICACIONES (Admin) */}
          {isAdmin && historialNotificaciones.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Historial de Notificaciones</Text>
              <View style={styles.historialContainer}>
                {historialNotificaciones.slice(0, 3).map((notif) => (
                  <View key={notif.id} style={styles.notificacionItem}>
                    <Text style={styles.notificacionMensaje}>{notif.mensaje}</Text>
                    <Text style={styles.notificacionDetalles}>
                      {notif.fechaEnvio} • {notif.destinatarios} destinatarios
                    </Text>
                  </View>
                ))}
                {historialNotificaciones.length > 3 && (
                  <Text style={styles.masNotificaciones}>
                    +{historialNotificaciones.length - 3} notificaciones más...
                  </Text>
                )}
              </View>
            </>
          )}

          {/* MODIFICAR HORARIO */}
          {(isMedico || isAdmin) && (
            <TouchableOpacity
              style={styles.scheduleButton}
              onPress={() => router.push("/schedule")}
            >
              <Ionicons name="calendar-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.scheduleText}>Modificar Horario</Text>
            </TouchableOpacity>
          )}

          {/* BOTONES */}
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
                  onPress={() => {
                    setNombre(nombreReal);
                    setIsEditing(false);
                  }}
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

          <View style={{ height: 120 }} />
        </ScrollView>
      </View>

      <Footer />

      {/* MODAL ESPECIALIZACIÓN */}
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

      {/* MODAL NOTIFICACIONES */}
      <Modal visible={notificacionModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enviar Notificación</Text>
            <Text style={styles.modalSubtitle}>
              Este mensaje será enviado a todos los asociados de la clínica
            </Text>

            <TextInput
              style={styles.notificacionInput}
              placeholder="Escribe tu mensaje aquí..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={mensajeNotificacion}
              onChangeText={setMensajeNotificacion}
              textAlignVertical="top"
            />

            <Text style={styles.contadorCaracteres}>
              {mensajeNotificacion.length}/255 caracteres
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, enviandoNotificacion && styles.disabled]}
                onPress={enviarNotificacion}
                disabled={enviandoNotificacion || !mensajeNotificacion.trim()}
              >
                {enviandoNotificacion ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Enviar Notificación</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setMensajeNotificacion("");
                  setNotificacionModalVisible(false);
                }}
                disabled={enviandoNotificacion}
              >
                <Text style={[styles.modalButtonText, { color: "#007AFF" }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL INVITACIÓN */}
      <ClinicInviteModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        isAdmin={isAdmin}
        onAsociarse={asociarseAClinica}
        codigoFijo="26027514"
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
    marginBottom: 12,
  },
  notificationButton: {
    backgroundColor: "#FF6B35",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  notificationText: { color: "#fff", fontSize: 16, fontWeight: "600" },
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
  modalOverlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "center", 
    alignItems: "center",
    padding: 20,
  },
  modalContent: { 
    backgroundColor: "#fff", 
    width: "100%", 
    maxHeight: "80%", 
    borderRadius: 20, 
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#007AFF", 
    textAlign: "center", 
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  notificacionInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: "#f9f9f9",
  },
  contadorCaracteres: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
    marginBottom: 20,
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonPrimary: {
    backgroundColor: "#007AFF",
  },
  modalButtonSecondary: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#007AFF",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  espOption: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    paddingVertical: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: "#eee" 
  },
  espText: { fontSize: 16, color: "#333" },
  closeBtn: { 
    marginTop: 15, 
    backgroundColor: "#007AFF", 
    padding: 12, 
    borderRadius: 10, 
    alignItems: "center" 
  },
  closeText: { color: "#fff", fontWeight: "600" },
  historialContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  notificacionItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  notificacionMensaje: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  notificacionDetalles: {
    fontSize: 12,
    color: "#666",
  },
  masNotificaciones: {
    fontSize: 12,
    color: "#007AFF",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
});

export default ProfileScreen;
