import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function Layout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#f0f0f0' }}>
      <Stack>
        <Stack.Screen //Pantalla de Login, se accede mediante localhost:####/login
          name="login"
          options={{ title: 'Iniciar Sesión', headerStyle: { backgroundColor: '#fff' } }}
        />
        <Stack.Screen //Pantalla de Registro, se accede mediante localhost:####/register
          name="register"
          options={{ title: 'Registro', headerStyle: { backgroundColor: '#fff' } }}
        />
      </Stack>
    </View>
  );
}