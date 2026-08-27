// src/app/(tabs)/_layout.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { DeviceEventEmitter, Platform } from "react-native";
import { carregarProjetoAtivo } from "../../utils/storage";

export default function TabsLayout() {
  const [modoDireto, setModoDireto] = useState(false);

  useEffect(() => {
    const verificarModo = async () => {
      const p = await carregarProjetoAtivo();
      setModoDireto(p?.tipoCalculo === "direto");
    };
    verificarModo();

    const subscription = DeviceEventEmitter.addListener(
      "projetoModificado",
      (projeto) => {
        setModoDireto(projeto?.tipoCalculo === "direto");
      },
    );

    return () => subscription.remove();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // 💡 TRAVAMOS AS CORES: Combinando perfeitamente com o resto do aplicativo!
        tabBarActiveTintColor: "#0284C7", // Azul vibrante do seu app
        tabBarInactiveTintColor: "#64748B", // Cinza neutro para inativos

        tabBarStyle: {
          backgroundColor: "#FFFFFF", // Fundo sempre branco
          borderTopColor: "#E2E8F0", // Linha divisória sutil
          height: Platform.OS === "web" ? 74 : 65, // 💡 Altura aumentada para não "comer" a fonte na web
          paddingBottom: Platform.OS === "web" ? 14 : 10, // 💡 Empurra as letrinhas pra cima
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "bold", // Negrito para garantir a legibilidade das palavras
        },
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cargas"
        options={{
          title: "Cargas",
          href: modoDireto ? null : "/cargas", // A mágica de esconder a aba continua aqui!
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="format-list-checks"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="materiais"
        options={{
          title: "Materiais",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="toolbox" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="memorial"
        options={{
          title: "Memorial",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="file-document"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
