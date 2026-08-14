// src/app/(tabs)/_layout.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { carregarProjetoAtivo } from "../../utils/storage";

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  const paddingInferior =
    Platform.OS === "web" ? 0 : insets.bottom > 0 ? insets.bottom + 5 : 15;
  const alturaTotal = Platform.OS === "web" ? 65 : 60 + paddingInferior;

  return (
    <View
      style={[
        styles.tabBarContainer,
        { paddingBottom: paddingInferior, height: alturaTotal },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.title !== undefined ? options.title : route.name;
        const isFocused = state.index === index;

        const onPress = async () => {
          const projetoAtivo = await carregarProjetoAtivo();

          if (route.name === "carga") {
            if (projetoAtivo?.tipoCalculo === "direto") {
              const msg =
                "Você selecionou o Cálculo Direto. A lista de equipamentos não é necessária.";
              Platform.OS === "web"
                ? window.alert(msg)
                : Alert.alert("Cálculo Direto ⚡", msg);
              return;
            }
          }

          if (route.name === "memorial" || route.name === "materiais") {
            const isEquip =
              projetoAtivo?.tipoCalculo === "equipamentos" ||
              !projetoAtivo?.tipoCalculo;
            const isDireto = projetoAtivo?.tipoCalculo === "direto";
            const isMisto = projetoAtivo?.tipoCalculo === "misto";

            const temCargas =
              projetoAtivo?.inventario && projetoAtivo.inventario.length > 0;
            const temConsumo =
              projetoAtivo?.consumoDiretokWh &&
              projetoAtivo.consumoDiretokWh > 0;

            if (isEquip && !temCargas) {
              const msg = "Adicione pelo menos um equipamento na aba 'Cargas'.";
              Platform.OS === "web"
                ? window.alert(msg)
                : Alert.alert("Aba Bloqueada 🔒", msg);
              return;
            } else if (isDireto && !temConsumo) {
              const msg =
                "Informe o Consumo Mensal (kWh) na aba Início para processar os dados.";
              Platform.OS === "web"
                ? window.alert(msg)
                : Alert.alert("Aba Bloqueada 🔒", msg);
              return;
            } else if (isMisto && (!temConsumo || !temCargas)) {
              const msg =
                "No MODO MISTO, informe o Consumo Base (aba Início) E adicione Cargas Extras (aba Cargas).";
              Platform.OS === "web"
                ? window.alert(msg)
                : Alert.alert("Aba Bloqueada 🔒", msg);
              return;
            }
          }

          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const color = isFocused ? "#0056B3" : "#475569";

        let iconName: any = "help-circle";
        if (route.name === "inicio") iconName = "home-variant-outline";
        if (route.name === "carga") iconName = "format-list-checks";
        if (route.name === "materiais") iconName = "toolbox-outline";
        if (route.name === "memorial") iconName = "file-document-outline";

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabItem}
          >
            <MaterialCommunityIcons name={iconName} size={24} color={color} />
            <Text style={[styles.tabLabel, { color }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="inicio" options={{ title: "Início" }} />
      <Tabs.Screen name="carga" options={{ title: "Cargas" }} />
      <Tabs.Screen name="materiais" options={{ title: "Materiais" }} />
      <Tabs.Screen name="memorial" options={{ title: "Memorial" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#CBD5E1",
    // @ts-ignore
    boxShadow:
      Platform.OS === "web" ? "0px -2px 5px rgba(0,0,0,0.03)" : undefined,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 5,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 4,
  },
});
