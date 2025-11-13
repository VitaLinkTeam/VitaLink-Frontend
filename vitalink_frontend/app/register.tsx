// RegisterScreen.tsx
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

interface ClinicaResponse {
  id?: number;
  in_id?: number;
  nombre?: string;
}

const BASE_URL = "https://vitalink-backend-m2mm.onrender.com";

type UserType = 'paciente' | 'medico' | 'asistente' | 'admin';

const ROLE_MAP: Record<UserType, string> = {
  paciente: 'Paciente',
  medico: 'Medico',
  asistente: 'Asistente',
  admin: 'Administrador',
};

const ESPECIALIZACIONES = [
  { id: 1, nombre: 'Medicina General' },
  { id: 2, nombre: 'Pediatría' },
  { id: 3, nombre: 'Ginecología' },
  { id: 4, nombre: 'Medicina Interna' },
  { id: 5, nombre: 'Odontología' },
  { id: 6, nombre: 'Dermatología' },
  { id: 7, nombre: 'Oftalmología' },
  { id: 8, nombre: 'Otorrinolaringología' },
  { id: 9, nombre: 'Traumatología' },
  { id: 10, nombre: 'Psicología' },
];

const RegisterScreen = () => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [especializacionId, setEspecializacionId] = useState<number | null>(null);
  const [userType, setUserType] = useState<UserType>('paciente');
  const [showClinicForm, setShowClinicForm] = useState(false);

  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const router = useRouter();
  const { signup } = useAuth();

  const scrollViewRef = useRef<ScrollView>(null);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (pass: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(pass);

  const validateFirstStep = () => {
    if (!nombre.trim()) return 'El nombre es obligatorio.';
    if (!validateEmail(correo)) return 'Ingresa un correo válido.';
    if (!contrasena) return 'La contraseña es obligatoria.';
    if (!validatePassword(contrasena))
      return 'Contraseña: 8+ caracteres, mayúscula, minúscula, número y símbolo.';
    if (contrasena !== confirmarContrasena) return 'Las contraseñas no coinciden.';
    if (userType === 'medico' && !especializacionId)
      return 'Selecciona una especialización.';
    return null;
  };

  const validateClinicStep = () => {
    if (!clinicName.trim()) return 'Nombre de clínica obligatorio.';
    if (!clinicAddress.trim()) return 'Dirección obligatoria.';
    if (!clinicPhone.trim()) return 'Teléfono obligatorio.';
    if (!validateEmail(clinicEmail)) return 'Correo de clínica inválido.';
    return null;
  };

  const handleNext = useCallback(() => {
    const error = validateFirstStep();
    if (error) {
      setModalMessage(error);
      setModalVisible(true);
      return;
    }
    if (userType === 'admin') {
      setShowClinicForm(true);
    } else {
      handleBasicUserSignup();
    }
  }, [userType, nombre, correo, contrasena, confirmarContrasena, especializacionId]);

  const handleBack = () => setShowClinicForm(false);

  const showModal = (msg: string, success = false) => {
    setModalMessage(msg);
    setModalVisible(true);
    if (success) {
      setTimeout(() => {
        setModalVisible(false);
        // NO REDIRIGIR AQUÍ → AuthContext lo hará
      }, 2000);
    }
  };

  const handleBasicUserSignup = async () => {
    try {
      const roleName = ROLE_MAP[userType];

      await signup(
        correo,
        contrasena,
        roleName,
        userType === 'paciente' ? 1 : null,
        'https://randomuser.me/api/portraits/lego/1.jpg',
        '',
        nombre.trim()
      );

      if (userType === 'medico' && especializacionId) {
        const { getAuth } = await import('firebase/auth');
        const token = await getAuth().currentUser?.getIdToken();
        const uid = getAuth().currentUser?.uid;
        if (token && uid) {
          await axios.put(
            `${BASE_URL}/api/usuarios/${uid}`,
            { especializacionId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }

      showModal(`${roleName} creado correctamente.`, true);
    } catch (error: any) {
      const msg = error.code === 'auth/email-already-in-use'
        ? 'Este correo ya está registrado.'
        : error.response?.data?.message || error.message || 'Error al crear usuario.';
      showModal(msg);
    }
  };

  const handleAdminUserSignup = async () => {
    const error = validateClinicStep();
    if (error) {
      showModal(error);
      return;
    }

    try {
      await signup(
        correo,
        contrasena,
        ROLE_MAP['admin'],
        null,
        'https://randomuser.me/api/portraits/lego/2.jpg',
        '',
        nombre.trim()
      );

      const { getAuth } = await import('firebase/auth');
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) throw new Error("No token");

      const clinicRes = await axios.post<ClinicaResponse>(
        `${BASE_URL}/api/clinicas`,
        {
          nombre: clinicName,
          direccion: clinicAddress,
          numeroTelefonico: clinicPhone,
          email: clinicEmail,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const clinicaId = clinicRes.data.id ?? clinicRes.data.in_id;
      if (!clinicaId) throw new Error("No se recibió ID de clínica");

      const uid = getAuth().currentUser?.uid;
      await axios.post(
        `${BASE_URL}/api/clinicas/asociar`,
        { uid, clinicaId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showModal('Clínica y Administrador creados correctamente.', true);
    } catch (error: any) {
      showModal(error.response?.data?.message || 'Error al crear clínica o administrador.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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
                    {/* RADIO BUTTONS */}
                    <View style={styles.radioContainer}>
                      <TouchableOpacity style={styles.radioButton} onPress={() => setUserType('paciente')}>
                        <View style={styles.radioCircle}>
                          {userType === 'paciente' && <View style={styles.selectedRb} />}
                        </View>
                        <Text style={styles.radioText}>Paciente</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.radioButton} onPress={() => setUserType('medico')}>
                        <View style={styles.radioCircle}>
                          {userType === 'medico' && <View style={styles.selectedRb} />}
                        </View>
                        <Text style={styles.radioText}>Médico</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.radioContainer}>
                      <TouchableOpacity style={styles.radioButton} onPress={() => setUserType('asistente')}>
                        <View style={styles.radioCircle}>
                          {userType === 'asistente' && <View style={styles.selectedRb} />}
                        </View>
                        <Text style={styles.radioText}>Asistente</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.radioButton} onPress={() => setUserType('admin')}>
                        <View style={styles.radioCircle}>
                          {userType === 'admin' && <View style={styles.selectedRb} />}
                        </View>
                        <Text style={styles.radioText}>Admin</Text>
                      </TouchableOpacity>
                    </View>

                    <TextInput style={styles.textInput} placeholder="Nombre completo" placeholderTextColor="#666" value={nombre} onChangeText={setNombre} autoCapitalize="words" />
                    <TextInput style={styles.textInput} placeholder="Correo electrónico" placeholderTextColor="#666" value={correo} onChangeText={setCorreo} keyboardType="email-address" autoCapitalize="none" />
                    <TextInput style={styles.textInput} placeholder="Contraseña" placeholderTextColor="#666" value={contrasena} onChangeText={setContrasena} secureTextEntry />
                    <TextInput style={styles.textInput} placeholder="Confirmar contraseña" placeholderTextColor="#666" value={confirmarContrasena} onChangeText={setConfirmarContrasena} secureTextEntry />

                    {userType === 'medico' && (
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={especializacionId}
                          onValueChange={(itemValue) => setEspecializacionId(itemValue as number)}
                          style={styles.picker}
                          dropdownIconColor="#007AFF"
                          mode="dropdown"
                        >
                          <Picker.Item label="Selecciona una especialización" value={null} color="#999" />
                          {ESPECIALIZACIONES.map((esp) => (
                            <Picker.Item key={esp.id} label={esp.nombre} value={esp.id} color="#000" />
                          ))}
                        </Picker>
                      </View>
                    )}

                    <TouchableOpacity style={styles.registerButton} onPress={handleNext}>
                      <Text style={styles.buttonText}>
                        {userType === 'admin' ? 'Siguiente' : 'Crear Cuenta'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                      <Ionicons name="arrow-back" size={24} color="#007AFF" />
                    </TouchableOpacity>

                    <TextInput style={styles.textInput} placeholder="Nombre de la Clínica" placeholderTextColor="#666" value={clinicName} onChangeText={setClinicName} />
                    <TextInput style={styles.textInput} placeholder="Dirección" placeholderTextColor="#666" value={clinicAddress} onChangeText={setClinicAddress} />
                    <TextInput style={styles.textInput} placeholder="Teléfono de la Clínica" placeholderTextColor="#666" value={clinicPhone} onChangeText={setClinicPhone} keyboardType="phone-pad" />
                    <TextInput style={styles.textInput} placeholder="Correo de la Clínica" placeholderTextColor="#666" value={clinicEmail} onChangeText={setClinicEmail} keyboardType="email-address" autoCapitalize="none" />

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
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#007AFF' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
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
    marginVertical: 20,
  },
  logo: { width: 120, height: 120, marginBottom: 15 },
  titleText: { fontFamily: 'System', fontSize: 24, color: '#333', marginBottom: 20, fontWeight: '600' },
  inputContainer: { width: '100%', alignItems: 'center', paddingHorizontal: 5 },
  backButton: { alignSelf: 'flex-start', marginLeft: 5, marginBottom: 15 },
  radioContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '80%', marginBottom: 10 },
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
    fontFamily: 'System',
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pickerContainer: {
    width: '90%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 15,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  picker: { color: '#000', fontSize: 16, paddingHorizontal: 15 },
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
  buttonText: { fontFamily: 'System', fontSize: 18, color: '#FFFFFF', textAlign: 'center', fontWeight: '500' },
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