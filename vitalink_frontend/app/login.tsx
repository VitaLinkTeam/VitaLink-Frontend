import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    console.log('Inicio de sesión con:', username, password);
    // Conexion al backend aqui, por ejemplo con fetch
  };

  //falta definir
  const handleSocialLogin = (provider) => {
    console.log(`Inicio de sesión con ${provider}`);
    // logica de auth con el proveedor (Google, Facebook, Microsoft) --> esto se puede hacer con firebase/auth
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainRectangle}>
        <Image
          style={styles.logo}
          source={require('../assets/images/medical_logo_placeholder.png')} //logo de la app
        />
        <Text style={styles.welcomeText}>¡Bienvenido!</Text>
        <View style={styles.inputContainer}>
          <View style={styles.input}>
            <TextInput
              placeholder="Nombre de usuario" //placeholder para el nombre de usuario
              value={username}
              onChangeText={setUsername}
              style={styles.textInput}
            />
          </View>
          <View style={styles.input}>
            <TextInput
              placeholder="Contraseña" //placeholder para la contraseña
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.textInput}
            />
          </View>
        </View>
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={styles.linkText}>¿No tienes una cuenta?</Text> 
        </TouchableOpacity>
        <TouchableOpacity style={styles.registerButton} onPress={() => router.push('/register')}>
          <Text style={styles.buttonText}>Crear Cuenta</Text>
        </TouchableOpacity>
        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialLogin('Google')}>
            <Image
              style={styles.socialIcon}
              source={require('../assets/images/Google_Logo.png')}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialLogin('Facebook')}>
            <Image
              style={styles.socialIcon}
              source={require('../assets/images/Facebook_Logo.png')}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialLogin('Microsoft')}>
            <Image
              style={styles.socialIcon}
              source={require('../assets/images/Microsoft_Logo.png')}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

//todos los estilos del screen de Login
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
  welcomeText: {
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
  loginButton: {
    width: 250,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerButton: {
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
  linkText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#000',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 150,
    marginTop: 20,
  },
  socialButton: {
    width: 40,
    height: 40,
    backgroundColor: '#EEEAEA',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
});

export default LoginScreen;