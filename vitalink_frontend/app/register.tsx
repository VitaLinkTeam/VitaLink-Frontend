import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { signupUser, getSession } from '../api/authApi'; // Ajusta la ruta según tu estructura
import { Usuario } from '@/models/Usuario'; // Asegúrate de que el modelo esté accesible
import { auth } from '@/services/firebaseAuth'; // Usa la instancia inicializada

const RegisterScreen = () => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [userType, setUserType] = useState<'normal' | 'admin'>('normal');
  const [showClinicForm, setShowClinicForm] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const router = useRouter();

  const handleNext = useCallback(() => {
    if (userType === 'admin') {
      setShowClinicForm(true);
    } else {
      handleNormalUserSignup();
    }
  }, [userType, nombre, correo, contrasena, confirmarContrasena]);

  const handleClinicSubmit = useCallback(() => {
    console.log('Registro de clínica:', clinicName, clinicAddress, clinicPhone, clinicEmail);
  }, [clinicName, clinicAddress, clinicPhone, clinicEmail]);

  const handleBack = () => {
    setShowClinicForm(false);
    setClinicName('');
    setClinicAddress('');
    setClinicPhone('');
    setClinicEmail('');
  };

  const handleNormalUserSignup = async () => {
    if (!nombre || !correo || !contrasena || !confirmarContrasena) {
      setModalMessage('Por favor, completa todos los campos.');
      setModalVisible(true);
      return;
    }

    if (contrasena !== confirmarContrasena) {
      setModalMessage('Las contraseñas no coinciden.');
      setModalVisible(true);
      return;
    }

    try {
      // ✅ Registrar en Firebase (versión Web)
      const firebaseUserCredential = await createUserWithEmailAndPassword(
        auth,
        correo,
        contrasena
      );
      const firebaseToken = await firebaseUserCredential.user.getIdToken();

      // ✅ Registrar en tu backend
      const signUpRequest = {
        email: correo,
        roleName: 'USER',
        name: nombre,
        numeroTelefonico: '',
        fotoURL: '',
        clinicaId: null,
      };
      await signupUser(firebaseToken, signUpRequest);

      const sessionData = await getSession(firebaseToken);
      console.log('Sesión creada:', sessionData);

      setModalMessage('Usuario creado correctamente. Iniciando sesión...');
      setModalVisible(true);
      setTimeout(() => {
        setModalVisible(false);
        router.replace('/HomeScreen');
      }, 2000);
    } catch (error) {
      console.error('Error en registro:', error);
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'auth/email-already-in-use'
      ) {
        setModalMessage('El correo ya está registrado en Firebase.');
      } else {
        setModalMessage('Error al crear el usuario. Inténtalo de nuevo.');
      }
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
                    <Text style={styles.radioText}>Usuario</Text>
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
                  placeholder="Nombre"
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
                  placeholder="Confirmar Contraseña"
                  value={confirmarContrasena}
                  onChangeText={setConfirmarContrasena}
                  secureTextEntry
                  placeholderTextColor="#666"
                />
                <TouchableOpacity style={styles.registerButton} onPress={handleNext}>
                  <Text style={styles.buttonText}>{userType === 'normal' ? 'Crear usuario' : 'Siguiente'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
                  <Text style={[styles.registerButtonText, { fontWeight: 'bold', textAlign: 'center' }]}>¿Ya tienes cuenta? Inicia Sesión</Text>
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
                  placeholder="Teléfono"
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
                <TouchableOpacity style={styles.registerButton} onPress={handleClinicSubmit}>
                  <Text style={styles.buttonText}>Registrar Clínica</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
                  <Text style={[styles.registerButtonText, { fontWeight: 'bold', textAlign: 'center' }]}>¿Ya tienes cuenta? Inicia Sesión</Text>
                </TouchableOpacity>
              </>
            )}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#007AFF',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
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
  logo: {
    width: 120,
    height: 120,
    marginBottom: 15,
  },
  titleText: {
    fontFamily: 'System',
    fontSize: 24,
    color: '#333',
    marginBottom: 20,
    fontWeight: '600',
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: 5,
    marginBottom: 15,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 20,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
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
  selectedRb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  radioText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
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
  buttonText: {
    fontFamily: 'System',
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
  },
  registerButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
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
  modalText: {
    fontFamily: 'System',
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    width: '50%',
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    fontFamily: 'System',
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default RegisterScreen;