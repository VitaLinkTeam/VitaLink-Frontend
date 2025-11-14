// app/chat.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
  ActivityIndicator,
  Keyboard,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';

const BASE_URL = "http://192.168.5.162:8080"; // Replace with your actual URL

interface Conversation {
  idConversacion: number;
  pacienteUid: string;
  nombrePaciente: string;
}

interface ChatMessage {
  idMensaje: number;
  conversacionId: number;
  mensaje: string;
  emisorUid: string | null;
  receptorUid: string | null;
  esAdmin: boolean;
  leido: boolean;
  tipoEmisor: string;
  tipoReceptor: string;
  enviadoEn: string;
}

interface Message {
  _id: number;
  text: string;
  createdAt: Date;
  user: {
    _id: number;
    name: string;
  };
}

const ChatScreenAdmin = () => {
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [clinicId, setClinicId] = useState<number | null>(null);
  const [pendingMessageId, setPendingMessageId] = useState<number | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [inputText, setInputText] = useState('');

  const { user } = useAuth();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!user) {
      Alert.alert('Acceso denegado', 'Debes iniciar sesión para usar el chat.');
      router.replace('/login');
      return;
    }

    fetchClinicInfo();
  }, [user]);

  useEffect(() => {
    if (view === 'list') {
      fetchPendingConversations();
    }
  }, [view]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setIsKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
        // Scroll to bottom when keyboard appears
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 150);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const fetchClinicInfo = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) return;

      const token = await currentUser.getIdToken();

      const response = await fetch(`${BASE_URL}/api/usuario/clinicas`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setClinicId(data[0].id);
          console.log(`🏥 Clinic ID for chat: ${data[0].id}`);
        }
      }
    } catch (error) {
      console.error("Error fetching clinic:", error);
    }
  };

  const fetchPendingConversations = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) return;

      const token = await currentUser.getIdToken();

      const response = await fetch(`${BASE_URL}/api/chat/pending`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        console.log(`💬 Pending conversations loaded: ${data.length}`);
      } else {
        console.error("Error fetching conversations");
        Alert.alert("Error", "No se pudieron cargar las conversaciones");
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      Alert.alert("Error de conexión", "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationMessages = async (conversationId: number) => {
    setLoading(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) return;

      const token = await currentUser.getIdToken();

      const response = await fetch(`${BASE_URL}/api/chat/${conversationId}/messages`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: ChatMessage[] = await response.json();
        console.log(`📨 Messages loaded: ${data.length}`);
        
        // Find the pending message ID (the one that needs admin response)
        const pendingMsg = data.find(msg => 
          msg.tipoReceptor === "SISTEMA" && !msg.leido
        );
        if (pendingMsg) {
          setPendingMessageId(pendingMsg.idMensaje);
        }

        // Convert to our Message format
        const convertedMessages: Message[] = data
          .filter(msg => msg.tipoReceptor !== "SISTEMA") // Filter out system messages
          .map((msg) => ({
            _id: msg.idMensaje,
            text: msg.mensaje,
            createdAt: new Date(msg.enviadoEn),
            user: {
              _id: msg.esAdmin ? 2 : 1,
              name: msg.esAdmin ? 'Asistente VitaLink' : selectedConversation?.nombrePaciente || 'Usuario',
            },
          }))
          .reverse(); // Newest first

        setMessages(convertedMessages);
        
        // Scroll to bottom after loading messages
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 200);
      } else {
        console.error("Error fetching messages");
        Alert.alert("Error", "No se pudieron cargar los mensajes");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      Alert.alert("Error de conexión", "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const sendAdminMessage = async (messageText: string, tempMessageId: number) => {
    if (!selectedConversation || !clinicId || !pendingMessageId) {
      Alert.alert("Error", "Faltan datos para enviar el mensaje");
      return;
    }

    setSending(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) return;

      const token = await currentUser.getIdToken();

      const payload = {
        uid_usuario: selectedConversation.pacienteUid,
        mensaje: messageText,
        mensaje_pendiente_id: pendingMessageId,
        conversacion_id: selectedConversation.idConversacion,
        clinica_id: clinicId,
      };

      console.log("📤 Sending message:", payload);

      const response = await fetch(`${BASE_URL}/api/chat/admin/responder`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log("✅ Message sent successfully");
        setInputText('');
        
        // Instead of refreshing all messages, just update the optimistic message
        // Wait a bit and then refresh to get the real message from server
        setTimeout(() => {
          fetchConversationMessages(selectedConversation.idConversacion);
        }, 500);
      } else {
        const errorText = await response.text();
        console.error("❌ Error sending message:", errorText);
        
        // Remove the optimistic message if there was an error
        setMessages(prev => prev.filter(msg => msg._id !== tempMessageId));
        Alert.alert("Error", "No se pudo enviar el mensaje");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove the optimistic message if there was an error
      setMessages(prev => prev.filter(msg => msg._id !== tempMessageId));
      Alert.alert("Error de conexión", "No se pudo enviar el mensaje");
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || sending) return;

    const tempMessageId = Date.now(); // Temporary ID
    const newMessage: Message = {
      _id: tempMessageId,
      text: inputText.trim(),
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'Asistente VitaLink',
      },
    };

    // Add message optimistically to UI
    setMessages(previousMessages => [...previousMessages, newMessage]);
    setInputText('');
    
    // Clear input and scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    // Send to server with the temp message ID
    sendAdminMessage(inputText.trim(), tempMessageId);
  };

  const handleConversationPress = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setView('chat');
    fetchConversationMessages(conversation.idConversacion);
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedConversation(null);
    setMessages([]);
    setPendingMessageId(null);
    setInputText('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isAdmin = item.user._id === 2;
    
    return (
      <View style={[
        styles.messageContainer,
        isAdmin ? styles.adminMessageContainer : styles.userMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isAdmin ? styles.adminBubble : styles.userBubble
        ]}>
          <Text style={[
            styles.messageText,
            isAdmin ? styles.adminMessageText : styles.userMessageText
          ]}>
            {item.text}
          </Text>
        </View>
        <Text style={styles.messageTime}>
          {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => handleConversationPress(item)}
    >
      <View style={styles.conversationIcon}>
        <Ionicons name="person-circle" size={50} color="#007AFF" />
      </View>
      <View style={styles.conversationInfo}>
        <Text style={styles.conversationName}>{item.nombrePaciente}</Text>
        <Text style={styles.conversationId}>ID: {item.idConversacion}</Text>
        <View style={styles.pendingBadge}>
          <Ionicons name="alert-circle" size={14} color="#FF9800" />
          <Text style={styles.pendingText}>Pendiente de respuesta</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  // List View
  if (view === 'list') {
    return (
      <SafeAreaView style={styles.safeArea}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#007AFF" />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Conversaciones Pendientes</Text>
          <TouchableOpacity 
            onPress={fetchPendingConversations} 
            style={styles.refreshButton}
          >
            <Ionicons name="refresh" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Cargando conversaciones...</Text>
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>No hay conversaciones pendientes</Text>
            <Text style={styles.emptySubtext}>
              Las conversaciones que requieran atención aparecerán aquí
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.idConversacion.toString()}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </SafeAreaView>
    );
  }

  // Chat View
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
    >
      {/* Header */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.chatHeaderContainer}>
          <TouchableOpacity 
            style={styles.chatBackButton} 
            onPress={handleBackToList}
          >
            <Ionicons name="arrow-back" size={26} color="#007AFF" />
          </TouchableOpacity>
          
          <View style={styles.chatHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="person-circle" size={40} color="#007AFF" />
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>{selectedConversation?.nombrePaciente}</Text>
                <Text style={styles.headerSubtitle}>ID: {selectedConversation?.idConversacion}</Text>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando mensajes...</Text>
        </View>
      ) : (
        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id.toString()}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />

          {/* Input Toolbar */}
          <View style={[
            styles.inputToolbarContainer,
            {
              paddingBottom: isKeyboardVisible ? 10 : 15,
            }
          ]}>
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Escribe tu respuesta..."
                placeholderTextColor="#999"
                multiline
                maxLength={500}
                editable={!sending}
                onFocus={() => {
                  setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }, 150);
                }}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || sending) && styles.sendButtonDisabled
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="send" size={20} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  headerSafeArea: {
    backgroundColor: '#FFF',
  },
  backButton: {
    position: 'absolute',
    top: 60,
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
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  chatHeaderContainer: {
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    height: 70,
  },
  chatBackButton: {
    backgroundColor: 'rgba(0,122,255,0.1)',
    padding: 8,
    borderRadius: 20,
    marginRight: 15,
  },
  chatHeader: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 10,
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  listContainer: {
    padding: 15,
    paddingTop: 20,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  conversationIcon: {
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  conversationId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingText: {
    fontSize: 12,
    color: '#FF9800',
    marginLeft: 4,
    fontWeight: '500',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  messagesList: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexGrow: 1,
    paddingBottom: 10,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  adminMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
  },
  adminBubble: {
    backgroundColor: '#007AFF',
    borderTopRightRadius: 4,
  },
  userBubble: {
    backgroundColor: '#F0F0F0',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  adminMessageText: {
    color: '#FFF',
  },
  userMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginHorizontal: 8,
  },
  // Input Toolbar Styles
  inputToolbarContainer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 70,
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 50,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    maxHeight: 100,
    minHeight: 40,
    textAlignVertical: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
});

export default ChatScreenAdmin;