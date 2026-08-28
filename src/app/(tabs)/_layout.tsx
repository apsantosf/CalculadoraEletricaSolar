// src/app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { DeviceEventEmitter, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context"; 
import { carregarProjetoAtivo } from "../../utils/storage";

export default function TabsLayout() {
  const [modoDireto, setModoDireto] = useState(false);
  const [temDados, setTemDados] = useState(false);
  
  const insets = useSafeAreaInsets(); 

  useEffect(() => {
    const verificarProjeto = async () => {
      const p = await carregarProjetoAtivo();
      atualizarAbas(p);
    };
    verificarProjeto();

    const subscription = DeviceEventEmitter.addListener("projetoModificado", (projeto) => {
      atualizarAbas(projeto);
    });

    return () => subscription.remove();
  }, []);

  const atualizarAbas = (p: any) => {
    if (!p) {
      setModoDireto(false);
      setTemDados(false);
      return;
    }

    setModoDireto(p.tipoCalculo === "direto");

    const consumo = parseFloat(p.consumoDiretokWh) || 0;
    const temInventario = p.inventario && p.inventario.length > 0;
    
    setTemDados(consumo > 0 || temInventario);
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0284C7",
        tabBarInactiveTintColor: "#64748B",
        
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E2E8F0",
          height: Platform.OS === 'web' ? 74 : 65 + insets.bottom, 
          paddingBottom: Platform.OS === 'web' ? 14 : 10 + insets.bottom, 
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
            <MaterialCommunityIcons name="format-list-checks" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="materiais"
        options={{
          title: "Materiais",
          href: temDados ? "/materiais" : null,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="toolbox" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="memorial"
        options={{
          title: "Memorial",
          href: temDados ? "/memorial" : null,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-document" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}