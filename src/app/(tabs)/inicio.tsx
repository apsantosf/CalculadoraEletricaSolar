// src/app/(tabs)/inicio.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  carregarDoHistorico,
  carregarHistorico,
  excluirDoHistorico,
} from "../../utils/storage";

export default function InicioScreen() {
  const [historico, setHistorico] = useState<any[]>([]);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchDados = async () => {
        const hist = await carregarHistorico();
        setHistorico(hist);
      };
      fetchDados();
    }, []),
  );

  const handleCarregar = async (projeto: any) => {
    await carregarDoHistorico(projeto);
    setMostrarDropdown(false);
    Platform.OS === "web"
      ? window.alert(
          `Projeto "${projeto.nome}" carregado. Vá para a aba Cargas.`,
        )
      : Alert.alert(
          "Sucesso",
          `Projeto "${projeto.nome}" carregado. Vá para a aba Cargas.`,
        );
  };

  const handleExcluir = async (nome: string) => {
    const confirmar =
      Platform.OS === "web"
        ? window.confirm(`Excluir "${nome}" do histórico?`)
        : await new Promise((res) =>
            Alert.alert("Excluir", `Excluir "${nome}"?`, [
              { text: "Não", onPress: () => res(false) },
              { text: "Sim", onPress: () => res(true) },
            ]),
          );

    if (confirmar) {
      await excluirDoHistorico(nome);
      const hist = await carregarHistorico();
      setHistorico(hist);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {/* CARD: Histórico (Barra de Pesquisa) */}
      <View style={styles.card}>
        <Text style={styles.tituloCard}>Histórico de Projetos</Text>
        <Text style={styles.descricao}>
          Resgate ou gerencie projetos salvos no dispositivo:
        </Text>

        <TouchableOpacity
          style={styles.dropdownPesquisa}
          onPress={() => setMostrarDropdown(!mostrarDropdown)}
        >
          <MaterialCommunityIcons
            name="folder-open-outline"
            size={22}
            color="#004085"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.txtDropdownPesquisa}>
            Pesquisar e carregar projeto...
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={22} color="#555" />
        </TouchableOpacity>

        {mostrarDropdown && (
          <View style={styles.listaContainer}>
            {historico.length === 0 ? (
              <Text style={styles.txtVazio}>Nenhum projeto salvo ainda.</Text>
            ) : (
              historico.map((proj) => (
                <View key={proj.nome} style={styles.itemLista}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => handleCarregar(proj)}
                  >
                    <Text style={styles.txtNomeProj}>{proj.nome}</Text>
                    <Text style={styles.txtDetalheProj}>
                      {proj.inventario.length} cargas cadastradas
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleExcluir(proj.nome)}>
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={24}
                      color="#DC3545"
                    />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </View>

      {/* CARD: Ajuda e Suporte (Manual) */}
      <View style={styles.card}>
        <Text style={styles.tituloCard}>Ajuda e Suporte</Text>
        <Text style={styles.descricao}>
          Acesse o guia passo a passo e o memorial de cálculos:
        </Text>
        <TouchableOpacity
          style={styles.btnManual}
          onPress={() => {
            /* Futura rota para o manual */
          }}
        >
          <MaterialCommunityIcons
            name="book-open-page-variant"
            size={20}
            color="#FFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.txtBtnBranco}>Ler Manual do Usuário</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9", padding: 16 },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    // @ts-ignore
    boxShadow:
      Platform.OS === "web" ? "0px 2px 8px rgba(0,0,0,0.05)" : undefined,
  },
  tituloCard: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 12,
  },
  descricao: { fontSize: 13, color: "#64748B", marginBottom: 12 },
  btnManual: {
    backgroundColor: "#475569",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  txtBtnBranco: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  dropdownPesquisa: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    padding: 14,
    borderRadius: 8,
  },
  txtDropdownPesquisa: {
    color: "#334155",
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  listaContainer: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    backgroundColor: "#FFF",
    marginTop: -4,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  itemLista: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  txtNomeProj: { fontSize: 15, color: "#0F172A", fontWeight: "bold" },
  txtDetalheProj: { fontSize: 12, color: "#64748B", marginTop: 2 },
  txtVazio: {
    padding: 16,
    textAlign: "center",
    color: "#94A3B8",
    fontStyle: "italic",
  },
});
