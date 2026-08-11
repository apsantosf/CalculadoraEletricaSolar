// src/app/(tabs)/_layout.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0056B3",
        tabBarInactiveTintColor: "#475569",
        tabBarLabelStyle: { fontWeight: "bold", fontSize: 12 },
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFF",
          borderTopWidth: 1,
          borderTopColor: "#CBD5E1",
          height: 75, // <-- Altura aumentada
          paddingBottom: 20, // <-- Empurra os ícones para cima (foge da barra do celular)
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="home-variant-outline"
              size={26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="carga"
        options={{
          title: "Cargas",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="format-list-checks"
              size={26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="resultado"
        options={{
          title: "Memorial",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="solar-power"
              size={26}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
