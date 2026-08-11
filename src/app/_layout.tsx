// src/app/_layout.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  BackHandler,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function RootLayout() {
  const [modalVisivel, setModalVisivel] = useState(false);
  const router = useRouter();

  const reiniciarProjeto = () => {
    setModalVisivel(false);
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.reload();
    } else {
      router.replace("/");
    }
  };

  const encerrarApp = () => {
    setModalVisivel(false);
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert("Para encerrar, por favor, feche a aba do seu navegador.");
    } else {
      BackHandler.exitApp();
    }
  };

  const HeaderDireita = () => (
    <View style={styles.headerRightContainer}>
      <Text style={styles.versaoTexto}>v1.0.0</Text>
      <TouchableOpacity
        onPress={() => setModalVisivel(true)}
        style={styles.btnFechar}
      >
        <Text style={styles.iconeFechar}>X</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.webContainer}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#FFD700" },
          headerTintColor: "#000",
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
          headerRight: () => <HeaderDireita />,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Elétrica Solar",
            headerLeft: () => (
              <MaterialCommunityIcons
                name="solar-panel-large"
                size={26}
                color="#000"
                style={{ marginLeft: 10 }}
              />
            ),
          }}
        />
        <Stack.Screen
          name="resultado"
          options={{
            title: "Dimensionamento",
          }}
        />
      </Stack>

      {/* MODAL DE ALERTA AJUSTADO */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisivel}
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitulo}>Atenção</Text>
            <Text style={styles.modalTexto}>
              Deseja realmente iniciar um Novo Projeto? Todos os dados atuais
              serão perdidos. Ou deseja encerrar o aplicativo?
            </Text>

            <TouchableOpacity
              style={[styles.modalBtn, styles.btnAzul]}
              onPress={reiniciarProjeto}
            >
              <Text style={styles.modalBtnTextoBranco}>
                Iniciar Novo Projeto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalBtn, styles.btnVermelho]}
              onPress={encerrarApp}
            >
              <Text style={styles.modalBtnTextoBranco}>
                Encerrar Aplicativo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalBtn, styles.btnBranco]}
              onPress={() => setModalVisivel(false)}
            >
              <Text style={styles.modalBtnTextoCinza}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 480 : "100%",
    alignSelf: "center",
    backgroundColor: "#fff",
    elevation: 5,
    // @ts-ignore
    boxShadow:
      Platform.OS === "web" ? "0px 0px 10px rgba(0, 0, 0, 0.1)" : undefined,
  },
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  versaoTexto: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
    marginRight: 12,
  },
  btnFechar: { paddingHorizontal: 6, paddingVertical: 2 },
  iconeFechar: { fontWeight: "bold", fontSize: 18, color: "#000" },

  // Fundo escuro cobrindo o app
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  // Caixa do Modal travada em tamanho proporcional (máximo 340px)
  modalContainer: {
    width: "90%",
    maxWidth: 340,
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    elevation: 10,
    // @ts-ignore
    boxShadow:
      Platform.OS === "web" ? "0px 4px 20px rgba(0, 0, 0, 0.25)" : undefined,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
    textAlign: "center",
  },
  modalTexto: {
    fontSize: 13,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },

  modalBtn: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 8,
  },
  btnAzul: { backgroundColor: "#007BFF" },
  btnVermelho: { backgroundColor: "#DC3545" },
  btnBranco: {
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#DCDCDC",
  },

  modalBtnTextoBranco: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  modalBtnTextoCinza: { color: "#444", fontWeight: "bold", fontSize: 14 },
});
