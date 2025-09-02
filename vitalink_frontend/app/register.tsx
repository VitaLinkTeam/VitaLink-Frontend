import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';

const RegisterScreen = () => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const router = useRouter();

  const handleRegister = () => {
    console.log('Registro con:', nombre, correo, contrasena, confirmarContrasena);
    // Conexion al backend aqui!!!, por ejemplo con fetch o con get
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainRectangle}>
        <Image
          style={styles.logo}
          source={require('../assets/images/medical_logo_placeholder.png')}
        />
        <Text style={styles.titleText}>Registro</Text>
        <View style={styles.inputContainer}>
          <View style={styles.input}>
            <TextInput
              placeholder="Nombre"
              value={nombre}
              onChangeText={setNombre}
              style={styles.textInput}
            />
          </View>
          <View style={styles.input}>
            <TextInput
              placeholder="Correo"
              value={correo}
              onChangeText={setCorreo}
              style={styles.textInput}
            />
          </View>
          <View style={styles.input}>
            <TextInput
              placeholder="Contraseña"
              value={contrasena}
              onChangeText={setContrasena}
              secureTextEntry
              style={styles.textInput}
            />
          </View>
          <View style={styles.input}>
            <TextInput
              placeholder="Confirmar Contraseña"
              value={confirmarContrasena}
              onChangeText={setConfirmarContrasena}
              secureTextEntry
              style={styles.textInput}
            />
          </View>
        </View>
        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.buttonText}>Crear Cuenta</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
          <Text style={styles.buttonText}>¿Ya tienes una cuenta? Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

//todos los estilos del screen de Register
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  mainRectangle: {
    width: 300,
    height: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    alignItems: 'center',
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  titleText: {
    fontFamily: 'Inter',
    fontSize: 20,
    color: '#000',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
  },
  input: {
    width: 250,
    height: 40,
    backgroundColor: '#EEEAEA',
    borderRadius: 5,
    marginBottom: 10,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  textInput: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#000',
  },
  registerButton: {
    width: 250,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginButton: {
    width: 250,
    height: 40,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#000000ff',
    textAlign: 'center',
  },
});

export default RegisterScreen;