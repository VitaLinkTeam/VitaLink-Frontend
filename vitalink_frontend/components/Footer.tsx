import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "expo-router";

const Footer = () => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const tabs =
    user?.rol === 1
      ? [
          { icon: "home-outline", label: "Inicio", route: "/HomeScreen" },
          { icon: "calendar-outline", label: "Citas", route: "/appointments" },
          { icon: "document-text-outline", label: "Historial", route: "/appointmentsHistory" },
          { icon: "people-outline", label: "Pacientes", route: "/patients" },
          { icon: "person-outline", label: "Perfil", route: "/profile" },
        ]
      : user?.rol === 2 || user?.rol === 4
      ? [
          { icon: "home-outline", label: "Inicio", route: "/HomeScreen" },
          { icon: "calendar-outline", label: "Citas", route: "/appointments" },
          { icon: "mail-outline", label: "Inbox", route: "/inbox" },
          { icon: "people-outline", label: "Pacientes", route: "/patients" },
          { icon: "person-outline", label: "Perfil", route: "/profile" },
        ]
      : [
          { icon: "home-outline", label: "Inicio", route: "/HomeScreen" },
          { icon: "calendar-outline", label: "Citas", route: "/appointments" },
          { icon: "document-text-outline", label: "Historial", route: "/appointmentsHistory" },
          { icon: "chatbubble-ellipses-outline", label: "Chat", route: "/chat" },
          { icon: "person-outline", label: "Perfil", route: "/profile" },
        ];

  return (
    <View style={styles.footer}>
      {tabs.map((tab, index) => {
        const isActive = pathname === tab.route; 
        return (
          <TouchableOpacity
            key={index}
            style={[styles.tab, isActive && styles.activeTab]} 
            onPress={() => router.push(tab.route as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={24}
              color={isActive ? "#fff" : "#007AFF"} 
            />
            <Text
              style={[
                styles.label,
                isActive && styles.activeLabel, 
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
  },
  tab: {
    alignItems: "center",
    padding: 6,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: "#007AFF", 
  },
  label: {
    fontSize: 12,
    marginTop: 3,
    color: "#007AFF",
  },
  activeLabel: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default Footer;
