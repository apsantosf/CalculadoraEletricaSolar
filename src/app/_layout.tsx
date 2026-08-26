// src/app/_layout.tsx
import Constants from "expo-constants";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  DeviceEventEmitter,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { checarAtualizacao } from "../utils/UpdateHelper";

import {
  atualizarNomeProjeto,
  carregarProjetoAtivo,
  limparProjeto,
  salvarNoHistorico,
} from "../utils/storage";

export default function RootLayout() {
  const [modalVisivel, setModalVisivel] = useState(false);
  const [nomeProjetoModal, setNomeProjetoModal] = useState("");
  const [isNovo, setIsNovo] = useState(true);
  const [isEncerrado, setIsEncerrado] = useState(false);

  const router = useRouter();

  useEffect(() => {
    checarAtualizacao();
  }, []);

  const abrirModal = async () => {
    const projAtivo = await carregarProjetoAtivo();
    setNomeProjetoModal(
      projAtivo.nome === "Novo Projeto Solar" ? "" : projAtivo.nome,
    );
    setIsNovo(projAtivo.nome === "Novo Projeto Solar");
    setModalVisivel(true);
  };

  const handleSalvarProjeto = async () => {
    if (!nomeProjetoModal.trim()) {
      Platform.OS === "web"
        ? window.alert("Digite um nome para salvar o projeto.")
        : Alert.alert("Aviso", "Digite um nome para salvar o projeto.");
      return;
    }

    await atualizarNomeProjeto(nomeProjetoModal);
    await salvarNoHistorico();
    setModalVisivel(false);

    if (Platform.OS === "web") {
      window.alert("Projeto salvo no histórico com sucesso!");
      window.location.reload();
    } else {
      Alert.alert("Sucesso", "Projeto salvo no histórico com sucesso!");
      // 💡 A BALA DE PRATA: Espera o banco salvar e grita no rádio!
      setTimeout(() => {
        DeviceEventEmitter.emit("projetoSalvo", Date.now());
      }, 300);
    }
  };

  const reiniciarProjeto = async () => {
    await limparProjeto();
    setModalVisivel(false);
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.href = "/";
    } else {
      router.replace("/");
    }
  };

  const encerrarApp = async () => {
    await limparProjeto();
    setModalVisivel(false);

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.open("", "_self", "");
      window.close();
      setTimeout(() => {
        setIsEncerrado(true);
      }, 300);
    } else {
      BackHandler.exitApp();
    }
  };

  const HeaderDireita = () => {
    const versaoApp = Constants.expoConfig?.version || "1.0.0";
    return (
      <View style={styles.headerRightContainer}>
        <Text style={styles.versaoTexto}>v{versaoApp}</Text>
        <TouchableOpacity onPress={abrirModal} style={styles.btnFechar}>
          <Text style={styles.iconeFechar}>X</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isEncerrado) {
    return (
      <View style={styles.telaEncerramento}>
        <Text style={styles.tituloEncerramento}>Sessão Encerrada</Text>
        <Text style={styles.textoEncerramento}>
          Os dados foram apagados com segurança.
        </Text>
        <Text style={styles.textoEncerramento}>
          Você já pode fechar esta aba do navegador.
        </Text>
      </View>
    );
  }

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
          name="(tabs)"
          options={{
            title: "Elétrica Solar",
            headerLeft: () => (
              <Image
                source={require("../../assets/images/banner-solar.png")}
                style={styles.logoHeader}
              />
            ),
          }}
        />
        <Stack.Screen name="index" options={{ title: "Carregando..." }} />
      </Stack>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisivel}
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitulo}>Opções do Projeto</Text>

            <Text style={styles.modalLabel}>Nome do Projeto:</Text>
            <TextInput
              style={styles.modalInput}
              value={nomeProjetoModal}
              onChangeText={setNomeProjetoModal}
              placeholder="Digite o nome..."
            />

            <TouchableOpacity
              style={[styles.modalBtn, styles.btnVerde]}
              onPress={handleSalvarProjeto}
            >
              <Text style={styles.modalBtnTextoBranco}>
                {isNovo ? "Salvar Projeto" : "Atualizar Projeto"}
              </Text>
            </TouchableOpacity>

            <View style={styles.divisor} />

            <Text style={styles.modalTexto}>
              Deseja iniciar um projeto do zero ou sair?
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
  logoHeader: {
    width: 44,
    height: 32,
    borderRadius: 6,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
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
    marginBottom: 15,
    textAlign: "center",
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#444",
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  modalInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#CCC",
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
    backgroundColor: "#F9F9F9",
  },
  divisor: {
    height: 1,
    width: "100%",
    backgroundColor: "#EEE",
    marginVertical: 15,
  },
  modalTexto: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
    marginBottom: 15,
  },
  modalBtn: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 8,
  },
  btnVerde: { backgroundColor: "#28A745" },
  btnAzul: { backgroundColor: "#007BFF" },
  btnVermelho: { backgroundColor: "#DC3545" },
  btnBranco: {
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#DCDCDC",
  },
  modalBtnTextoBranco: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  modalBtnTextoCinza: { color: "#444", fontWeight: "bold", fontSize: 14 },
  telaEncerramento: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 20,
  },
  tituloEncerramento: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 10,
  },
  textoEncerramento: {
    fontSize: 15,
    color: "#64748B",
    marginBottom: 6,
    textAlign: "center",
  },
});
