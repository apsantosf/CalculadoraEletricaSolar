// src/app/(tabs)/_layout.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { DeviceEventEmitter, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // 💡 NOVA IMPORTAÇÃO: O Detetive de Tela!
import { carregarProjetoAtivo } from "../../utils/storage";

export default function TabsLayout() {
  const [modoDireto, setModoDireto] = useState(false);

  // 💡 Ele descobre o tamanho exato dos botões nativos do celular do usuário
  const insets = useSafeAreaInsets();

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
        tabBarActiveTintColor: "#0284C7",
        tabBarInactiveTintColor: "#64748B",

        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E2E8F0",
          // 💡 A MÁGICA: Somamos a margem de segurança (insets.bottom) à altura!
          height: Platform.OS === "web" ? 74 : 65 + insets.bottom,
          // 💡 Empurramos o conteúdo das abas para cima para não bater nos botões
          paddingBottom: Platform.OS === "web" ? 14 : 10 + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "bold",
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
          href: modoDireto ? null : "/cargas",
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
