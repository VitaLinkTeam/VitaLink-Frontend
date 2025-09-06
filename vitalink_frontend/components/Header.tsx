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
      <View style={styles.profileSection}>
        <Image
          style={styles.avatar}
          source={require("../assets/images/user_placeholder.png")}
        />
        <View>
          <Text style={styles.name}>{nombre}</Text>
          <Text style={styles.subtitle}>We are happy to see you again</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Ionicons name="notifications-outline" size={24} color="black" />
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  name: { fontSize: 18, fontWeight: "bold", color: "#000" },
  subtitle: { fontSize: 14, color: "#666" },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoutButton: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  logoutText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default Header;