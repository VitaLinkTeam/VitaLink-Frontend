import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";

type HeaderProps = {
  nombre: string;
};

const Header = ({ nombre }: HeaderProps) => {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <View style={styles.header}>
      <Image
        style={styles.avatar}
        source={require("../assets/images/user_placeholder.png")}
      />
      <View style={styles.textContainer}>
        <Text style={styles.name}>{nombre}</Text>
        <Text style={styles.subtitle}>Que bueno tenerle de vuelta 😊</Text>
      </View>
      <Ionicons name="notifications-outline" size={20} color="#333" style={styles.icon} />
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  textContainer: {
    flexShrink: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
  },
  icon: {
    marginLeft: "auto",
  },
  logoutButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#007AFF",
    borderRadius: 6,
  },
  logoutText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
});

export default Header;