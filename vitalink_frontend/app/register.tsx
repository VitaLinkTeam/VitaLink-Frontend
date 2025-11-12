import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';// Asegúrate de tener firebase config exportado
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

const BASE_URL = "https://vitalink-backend-m2mm.onrender.com";

const RegisterScreen = () => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [userType, setUserType] = useState<'normal' | 'admin'>('normal');
  const [showClinicForm, setShowClinicForm] = useState(false);

  // Clínica
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const router = useRouter();
  const { signup } = useAuth();

  // Validaciones
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (pass: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(pass);

  const validateFirstStep = () => {
    if (!nombre.trim()) return 'El nombre es obligatorio.';
    if (!validateEmail(correo)) return 'Ingresa un correo electrónico válido.';
    if (!contrasena) return 'La contraseña es obligatoria.';
    if (!validatePassword(contrasena))
      return 'Contraseña: mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial.';
    if (contrasena !== confirmarContrasena) return 'Las contraseñas no coinciden.';
    return null;
  };

  const validateClinicStep = () => {
    if (!clinicName.trim()) return 'El nombre de la clínica es obligatorio.';
    if (!clinicAddress.trim()) return 'La dirección es obligatoria.';
    if (!clinicPhone.trim()) return 'El teléfono es obligatorio.';
    if (!validateEmail(clinicEmail)) return 'Correo de clínica inválido.';
    return null;
  };

  const handleNext = useCallback(async () => {
    const error = validateFirstStep();
    if (error) {
      setModalMessage(error);
      setModalVisible(true);
      return;
    }

    if (userType === 'normal') {
      await handleNormalUserSignup();
    } else {
      setShowClinicForm(true);
    }
  }, [userType, nombre, correo, contrasena, confirmarContrasena]);

  const handleBack = () => {
    setShowClinicForm(false);
  };

  const showSuccessAndRedirect = (message: string) => {
    setModalMessage(message);
    setModalVisible(true);
    setTimeout(() => {
      setModalVisible(false);
      router.replace('/HomeScreen');
    }, 2000);
  };

  const handleNormalUserSignup = async () => {
    try {
      await signup(
        correo,
        contrasena,
        'Paciente',
        1, // clínica fija para pacientes
        'https://randomuser.me/api/portraits/lego/1.jpg',
        '' // teléfono opcional
      );

      // Opcional: enviar nombre al backend (si tu backend lo acepta)
      // Puedes modificar tu backend para aceptar `nombre` en /signup
      showSuccessAndRedirect('Paciente creado correctamente. Iniciando sesión...');
    } catch (error: any) {
      const msg = error.code === 'auth/email-already-in-use'
        ? 'Este correo ya está registrado.'
        : 'Error al crear el usuario.';
      setModalMessage(msg);
      setModalVisible(true);
    }
  };

  const handleAdminUserSignup = async () => {
    const error = validateClinicStep();
    if (error) {
      setModalMessage(error);
      setModalVisible(true);
      return;
    }

    try {
      // 1. Crear usuario admin en Firebase + backend
      await signup(
        correo,
        contrasena,
        'Administrador',
        null, // clinicaId null por ahora
        'https://randomuser.me/api/portraits/lego/2.jpg',
        ''
      );

      // 2. Crear clínica en el backend
      const token = await (await import('firebase/auth')).getAuth().currentUser?.getIdToken();
      if (!token) throw new Error("No se pudo obtener token");

      const clinicResponse = await axios.post(
        `${BASE_URL}/api/clinicas`,
        {
          nombre: clinicName,
          direccion: clinicAddress,
          telefono: clinicPhone,
          email: clinicEmail,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const clinicaId = clinicResponse.data.id;

      // 3. Actualizar usuario con clinicaId
      await axios.put(
        `${BASE_URL}/api/usuarios/${(await import('firebase/auth')).getAuth().currentUser?.uid}`,
        { clinicaId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showSuccessAndRedirect('Clínica y Administrador creados correctamente.');
    } catch (error: any) {
      console.error("Error creando admin/clínica:", error);
      const msg = error.response?.data?.message || 'Error al crear clínica o administrador.';
      setModalMessage(msg);
      setModalVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.mainRectangle}>
          <Image
            style={styles.logo}
            source={require('../assets/images/medical_logo_placeholder.png')}
          />
          <Text style={styles.titleText}>
            {showClinicForm ? 'Registrar Clínica' : 'Registro'}
          </Text>

          <View style={styles.inputContainer}>
            {!showClinicForm ? (
              <>
                <View style={styles.radioContainer}>
                  <TouchableOpacity
                    style={styles.radioButton}
                    onPress={() => setUserType('normal')}
                  >
                    <View style={styles.radioCircle}>
                      {userType === 'normal' && <View style={styles.selectedRb} />}
                    </View>
                    <Text style={styles.radioText}>Paciente</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioButton}
                    onPress={() => setUserType('admin')}
                  >
                    <View style={styles.radioCircle}>
                      {userType === 'admin' && <View style={styles.selectedRb} />}
                    </View>
                    <Text style={styles.radioText}>Admin</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.textInput}
                  placeholder="Nombre completo"
                  value={nombre}
                  onChangeText={setNombre}
                  placeholderTextColor="#666"
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Correo electrónico"
                  value={correo}
                  onChangeText={setCorreo}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor="#666"
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Contraseña"
                  value={contrasena}
                  onChangeText={setContrasena}
                  secureTextEntry
                  placeholderTextColor="#666"
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Confirmar contraseña"
                  value={confirmarContrasena}
                  onChangeText={setConfirmarContrasena}
                  secureTextEntry
                  placeholderTextColor="#666"
                />

                <TouchableOpacity style={styles.registerButton} onPress={handleNext}>
                  <Text style={styles.buttonText}>
                    {userType === 'normal' ? 'Crear Paciente' : 'Siguiente'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Ionicons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>

                <TextInput
                  style={styles.textInput}
                  placeholder="Nombre de la Clínica"
                  value={clinicName}
                  onChangeText={setClinicName}
                  placeholderTextColor="#666"
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Dirección"
                  value={clinicAddress}
                  onChangeText={setClinicAddress}
                  placeholderTextColor="#666"
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Teléfono de la Clínica"
                  value={clinicPhone}
                  onChangeText={setClinicPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor="#666"
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Correo de la Clínica"
                  value={clinicEmail}
                  onChangeText={setClinicEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor="#666"
                />

                <TouchableOpacity style={styles.registerButton} onPress={handleAdminUserSignup}>
                  <Text style={styles.buttonText}>Registrar Clínica y Admin</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
              <Text style={[styles.registerButtonText, { fontWeight: 'bold', textAlign: 'center' }]}>
                ¿Ya tienes cuenta? Inicia Sesión
              </Text>
            </TouchableOpacity>
          </View>

          <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalText}>{modalMessage}</Text>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Aceptar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Estilos (sin cambios importantes)
const styles = StyleSheet.create({
  // ... (mantén todos los estilos que ya tenías)
  safeArea: { flex: 1, backgroundColor: '#007AFF' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
  mainRectangle: {
    width: '90%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  logo: { width: 120, height: 120, marginBottom: 15 },
  titleText: { fontSize: 24, color: '#333', marginBottom: 20, fontWeight: '600' },
  inputContainer: { width: '100%', alignItems: 'center', paddingHorizontal: 5 },
  backButton: { alignSelf: 'flex-start', marginLeft: 5, marginBottom: 15 },
  radioContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '80%', marginBottom: 20 },
  radioButton: { flexDirection: 'row', alignItems: 'center' },
  radioCircle: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedRb: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#007AFF' },
  radioText: { fontSize: 18, color: '#333', fontWeight: '500' },
  textInput: {
    width: '90%',
    height: 50,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  registerButton: {
    width: '90%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginButton: {
    width: '90%',
    height: 60,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: '#FFFFFF',
  },
  buttonText: { fontSize: 18, color: '#FFFFFF', fontWeight: '500' },
  registerButtonText: { color: '#007AFF', fontSize: 16 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: { fontSize: 16, color: '#333', textAlign: 'center', marginBottom: 20 },
  modalButton: { width: '50%', height: 40, backgroundColor: '#007AFF', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalButtonText: { fontSize: 16, color: '#FFFFFF', fontWeight: '500' },
});

export default RegisterScreen;