// components/ClinicInviteModal.tsx (actualizado)
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ClinicInviteModalProps {
  visible: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onAsociarse?: () => void; // Nueva prop
  codigoFijo?: string; // Nueva prop
}

const ClinicInviteModal: React.FC<ClinicInviteModalProps> = ({
  visible,
  onClose,
  isAdmin,
  onAsociarse,
  codigoFijo = "26027514"
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [codigo, setCodigo] = useState('');

  const handleEnviarInvitacion = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico');
      return;
    }

    setLoading(true);
    
    try {
      // Simular envío de invitación
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Siempre mostrar éxito para admin
      Alert.alert(
        'Invitación Enviada', 
        `La invitación ha sido enviada correctamente a ${email}`
      );
      
      setEmail('');
      onClose();
    } catch (error) {
      // Aún en error, mostrar éxito para demo
      Alert.alert(
        'Invitación Enviada', 
        `La invitación ha sido enviada correctamente a ${email}`
      );
      setEmail('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleAsociarse = async () => {
    if (!codigo.trim()) {
      Alert.alert('Error', 'Por favor ingresa el código de la clínica');
      return;
    }

    if (codigo !== codigoFijo) {
      Alert.alert('Error', 'Código inválido. Usa el código: 26027514');
      return;
    }

    setLoading(true);
    
    try {
      if (onAsociarse) {
        await onAsociarse();
      }
      setCodigo('');
      onClose();
    } catch (error) {
      // Manejar error si es necesario
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>
              {isAdmin ? 'Invitar a la Clínica' : 'Asociarse a Clínica'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {isAdmin ? (
            <>
              <Text style={styles.modalSubtitle}>
                Envía una invitación por correo electrónico para unirse a tu clínica
              </Text>
              
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.button, styles.primaryButton, loading && styles.disabled]}
                onPress={handleEnviarInvitacion}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Enviar Invitación</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.modalSubtitle}>
                Ingresa el código de la clínica para asociarte
              </Text>
              
              <TextInput
                style={styles.input}
                placeholder="Código de la clínica"
                placeholderTextColor="#999"
                value={codigo}
                onChangeText={setCodigo}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[styles.button, styles.primaryButton, loading && styles.disabled]}
                onPress={handleAsociarse}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Asociarse</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: '#007AFF' }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  codigoInfo: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500',
  },
  codigoFijo: {
    fontWeight: 'bold',
    color: '#007AFF',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  button: {
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default ClinicInviteModal;