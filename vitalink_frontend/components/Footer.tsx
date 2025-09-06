import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";

const Footer = () => {
  const { user } = useAuth();
  const router = useRouter();

  const tabs =
    user?.rol === 1
      ? [
          { icon: "home-outline", label: "Home", route: "/HomeScreen" },
          { icon: "calendar-outline", label: "Appointments", route: "/appointments" },
          { icon: "document-text-outline", label: "History", route: "/history" },
          { icon: "people-outline", label: "Patients", route: "/patients" },
          { icon: "person-outline", label: "Profile", route: "/profile" },
        ]
      : user?.rol === 2 || user?.rol === 4
      ? [
          { icon: "home-outline", label: "Home", route: "/HomeScreen" },
          { icon: "calendar-outline", label: "Appointments", route: "/appointments" },
          { icon: "mail-outline", label: "Inbox", route: "/inbox" },
          { icon: "people-outline", label: "Patients", route: "/patients" },
          { icon: "person-outline", label: "Profile", route: "/profile" },
        ]
      : [
          { icon: "home-outline", label: "Home", route: "/HomeScreen" },
          { icon: "calendar-outline", label: "Appointments", route: "/appointments" },
          { icon: "document-text-outline", label: "History", route: "/history" },
          { icon: "chatbubble-ellipses-outline", label: "Chat", route: "/chat" },
          { icon: "person-outline", label: "Profile", route: "/profile" },
        ];

  return (
    <View style={styles.footer}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={styles.tab}
          onPress={() => router.push(tab.route as any)}
        >
          <Ionicons name={tab.icon as any} size={24} color="#007AFF" />
          <Text style={styles.label}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
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
  tab: { alignItems: "center" },
  label: { fontSize: 12, marginTop: 3, color: "#007AFF" },
});

export default Footer;