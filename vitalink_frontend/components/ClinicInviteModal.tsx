// components/ClinicInviteModal.tsx
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { getAuth } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";

const BASE_URL = "https://vitalink-backend-m2mm.onrender.com";

type Props = {
  visible: boolean;
  onClose: () => void;
  isAdmin: boolean;
};

export default function ClinicInviteModal({ visible, onClose, isAdmin }: Props) {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Paciente" | "Médico" | "Asistente">("Paciente");
  const [loading, setLoading] = useState(false);

  const getToken = async () => {
    const token = await getAuth().currentUser?.getIdToken();
    if (!token) throw new Error("No autenticado");
    return token;
  };

  const handleAcceptCode = async () => {
    if (!code.trim()) return Alert.alert("Error", "Ingresa el código");

    setLoading(true);
    try {
      const token = await getToken();
      await axios.post(
        `${BASE_URL}/api/invite/accept`,
        code.trim(),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "text/plain",
          },
        }
      );
      Alert.alert("Éxito", "Te has unido a la clínica", [
        { text: "OK", onPress: onClose },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data || "Código inválido o expirado");
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!email.trim()) return Alert.alert("Error", "Ingresa el correo");

    setLoading(true);
    try {
      const token = await getToken();
      await axios.post(
        `${BASE_URL}/api/invite/send`,
        {
          email: email.trim(),
          clinicaId: user?.clinicaId,
          roleName: role,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      Alert.alert("Enviado", `Invitación enviada a ${email}`, [
        { text: "OK", onPress: onClose },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data || "No se pudo enviar");
    } finally {
      setLoading(false);
    }
  };

  const roles: ("Paciente" | "Médico" | "Asistente")[] = ["Paciente", "Médico", "Asistente"];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {isAdmin ? "Invita a personas a la clínica" : "Asóciate a una clínica"}
          </Text>

          {isAdmin ? (
            <>
              <Text style={styles.label}>Correo del invitado</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="correo@ejemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Rol</Text>
              <View style={styles.roleContainer}>
                {roles.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.roleButton,
                      role === r && styles.roleButtonSelected,
                    ]}
                    onPress={() => setRole(r)}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        role === r && styles.roleTextSelected,
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.label}>Código de invitación</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                keyboardType="numeric"
              />
            </>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, loading && styles.disabled]}
              onPress={isAdmin ? handleSendInvite : handleAcceptCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionText}>
                  {isAdmin ? "Enviar" : "Aceptar"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// === ESTILOS (SIN ERRORES) ===
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 20,
    width: "88%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#007AFF",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    marginBottom: 20,
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    marginBottom: 10,
    alignItems: "center",
  },
  roleButtonSelected: {
    backgroundColor: "#007AFF",
  },
  roleText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  roleTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#007AFF",
    alignItems: "center",
  },
  cancelText: {
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 16,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  disabled: {
    backgroundColor: "#A0C4FF",
    opacity: 0.8,
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});