import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
  const router = useRouter();

  const handleNext = useCallback(() => {
    if (userType === 'admin') {
      setShowClinicForm(true);
    } else {
      console.log('Registro con:', nombre, correo, contrasena, confirmarContrasena);
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

          {!showClinicForm ? (
            <View style={styles.inputContainer}>
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
                placeholder="Nombre"
                placeholderTextColor="#666"
                value={nombre}
                onChangeText={setNombre}
                style={styles.textInput}
              />
              <TextInput
                placeholder="Correo"
                placeholderTextColor="#666"
                value={correo}
                onChangeText={setCorreo}
                style={styles.textInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                placeholder="Contraseña"
                placeholderTextColor="#666"
                value={contrasena}
                onChangeText={setContrasena}
                secureTextEntry
                style={styles.textInput}
              />
              <TextInput
                placeholder="Confirmar Contraseña"
                placeholderTextColor="#666"
                value={confirmarContrasena}
                onChangeText={setConfirmarContrasena}
                secureTextEntry
                style={styles.textInput}
              />
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TextInput
                placeholder="Nombre de la Clínica"
                placeholderTextColor="#666"
                value={clinicName}
                onChangeText={setClinicName}
                style={styles.textInput}
              />
              <TextInput
                placeholder="Dirección de la Clínica"
                placeholderTextColor="#666"
                value={clinicAddress}
                onChangeText={setClinicAddress}
                style={styles.textInput}
              />
              <TextInput
                placeholder="Número Telefónico"
                placeholderTextColor="#666"
                value={clinicPhone}
                onChangeText={setClinicPhone}
                style={styles.textInput}
                keyboardType="phone-pad"
              />
              <TextInput
                placeholder="Email"
                placeholderTextColor="#666"
                value={clinicEmail}
                onChangeText={setClinicEmail}
                style={styles.textInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.registerButton}
            onPress={showClinicForm ? handleClinicSubmit : handleNext}
          >
            <Text style={styles.buttonText}>
              {showClinicForm ? 'Crear Clínica' : userType === 'admin' ? 'Siguiente' : 'Crear Cuenta'}
            </Text>
          </TouchableOpacity>

          {!showClinicForm && (
            <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
              <Text style={[styles.buttonText, styles.loginButtonText]}>¿Ya tienes una cuenta? Iniciar Sesión</Text>
            </TouchableOpacity>
          )}
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
    height: 60, // Aumentado para que quepa el texto completo
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
    color: '#FFFFFF', // Blanco para el botón principal
    textAlign: 'center',
    fontWeight: '500',
  },
  loginButtonText: {
    color: '#007AFF', // Azul para el botón blanco
    fontSize: 16, // Ajustado para que quepa
  },
});

export default RegisterScreen;