// app/chat.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { GiftedChat, IMessage, Bubble, Send, InputToolbar } from 'react-native-gifted-chat';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import Header from "../components/Header";
import Footer from "../components/Footer";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = "https://vitalink-backend-m2mm.onrender.com";

const BOT_USER = {
  _id: 2,
  name: 'VitaLink Bot',
  avatar: 'https://i.imgur.com/7k12EPD.png',
};

const ChatScreen = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const { user } = useAuth();
  const router = useRouter();

  // === ESTADO NOMBRE REAL ===
  const [nombreReal, setNombreReal] = useState<string>("Cargando...");
  const [loadingName, setLoadingName] = useState(true);

  // === CARGAR NOMBRE REAL ===
  useEffect(() => {
    const fetchNombre = async () => {
      if (!user?.uid) {
        setNombreReal("Usuario");
        setLoadingName(false);
        return;
      }

      try {
        const { getAuth } = await import("firebase/auth");
        const token = await getAuth().currentUser?.getIdToken();
        if (!token) throw new Error("No token");

        const response = await axios.get(`${BASE_URL}/api/auth/getname`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setNombreReal(response.data.nombre || "Paciente");
      } catch (error) {
        console.warn("Error al obtener nombre:", error);
        setNombreReal(user?.nombre || "Usuario");
      } finally {
        setLoadingName(false);
      }
    };

    fetchNombre();
  }, [user?.uid]);

  // === VALIDAR USUARIO ===
  useEffect(() => {
    if (!user) {
      Alert.alert('Acceso denegado', 'Debes iniciar sesión para usar el chat.');
      router.replace('/login');
      return;
    }

    const saludo = `¡Hola ${nombreReal}! Soy el asistente de VitaLink.\n\nPuedes preguntarme:\n• ¿Cómo agendar una cita?\n• ¿Qué documentos necesito?\n• ¿Cuál es mi rol?\n\n¡Escribe tu duda!`;

    setMessages([
      {
        _id: 1,
        text: saludo,
        createdAt: new Date(),
        user: BOT_USER,
      },
    ]);
  }, [user, nombreReal, router]);

  // === RESPUESTAS DEL BOT ===
  const getBotResponse = (text: string): string => {
    const lowerText = text.toLowerCase().trim();

    if (lowerText.includes('cita') || lowerText.includes('agendar')) {
      return 'Para agendar una cita:\n1. Ve a "Citas" en el menú.\n2. Selecciona fecha y hora.\n3. Confirma con el médico.\n\n¿Te ayudo a elegir un horario?';
    }
    if (lowerText.includes('rol') || lowerText.includes('quien soy')) {
      return `Tu rol es: *${user?.roleName || 'No definido'}*.\n\nSi eres *Paciente*, puedes ver tus citas.\nSi eres *Médico*, puedes gestionar pacientes.`;
    }
    if (lowerText.includes('documentos') || lowerText.includes('necesito')) {
      return 'Para tu primera consulta, trae:\n• Cédula de identidad\n• Carnet de seguro (si aplica)\n• Historial médico (opcional)';
    }
    if (lowerText.includes('hola') || lowerText.includes('buenas')) {
      return '¡Hola! ¿En qué puedo ayudarte hoy?';
    }

    return 'Lo siento, no entiendo tu pregunta. Puedes decirme:\n• "Quiero una cita"\n• "Cuál es mi rol"\n• "Qué documentos necesito"';
  };

  const onSend = useCallback((newMessages: IMessage[] = []) => {
    setMessages((previousMessages) => GiftedChat.append(previousMessages, newMessages));

    const userText = newMessages[0].text;
    const botResponse = getBotResponse(userText);

    const botMessage: IMessage = {
      _id: Math.random().toString(),
      text: botResponse,
      createdAt: new Date(),
      user: BOT_USER,
    };

    setTimeout(() => {
      setMessages((previousMessages) => GiftedChat.append(previousMessages, [botMessage]));
    }, 800);
  }, [user?.roleName]);

  // === RENDERIZADO DE COMPONENTES ===
  const renderBubble = (props: any) => (
    <Bubble
      {...props}
      wrapperStyle={{
        left: { backgroundColor: '#F0F0F0', borderTopLeftRadius: 0 },
        right: { backgroundColor: '#007AFF', borderTopRightRadius: 0 },
      }}
      textStyle={{
        left: { color: '#333', fontSize: 15 },
        right: { color: '#FFF', fontSize: 15 },
      }}
    />
  );

  const renderSend = (props: any) => (
    <Send {...props}>
      <View style={styles.sendButton}>
        <Ionicons name="send" size={20} color="#007AFF" />
      </View>
    </Send>
  );

  const renderInputToolbar = (props: any) => (
    <InputToolbar
      {...props}
      containerStyle={{
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingVertical: 8,
      }}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER CON NOMBRE REAL */}
      <Header nombre={loadingName ? "Cargando..." : nombreReal} />

      {/* BOTÓN VOLVER */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={26} color="#007AFF" />
      </TouchableOpacity>

      {/* TÍTULO PERSONALIZADO */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat con Asistente</Text>
        <View style={styles.onlineIndicator}>
          <View style={styles.dot} />
          <Text style={styles.onlineText}>En línea</Text>
        </View>
      </View>

      {/* CHAT CON KEYBOARD AWARE */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <GiftedChat
          messages={messages}
          onSend={(messages) => onSend(messages)}
          user={{
            _id: 1,
            name: nombreReal,
          }}
          placeholder="Escribe tu mensaje..."
          renderBubble={renderBubble}
          renderSend={renderSend}
          renderInputToolbar={renderInputToolbar}
          alwaysShowSend
          scrollToBottom
          inverted={true}
          loadEarlier={false}
          isLoadingEarlier={false}
        />
      </KeyboardAvoidingView>

      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  backButton: {
    position: 'absolute',
    top: 95,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 10,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  onlineText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  chatContainer: {
    flex: 1,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
});

export default ChatScreen;