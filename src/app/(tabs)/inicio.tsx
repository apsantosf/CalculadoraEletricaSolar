// src/app/(tabs)/inicio.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { REGIOES_SOLARES } from "../../constants/regioes";
import {
  carregarDoHistorico,
  carregarHistorico,
  carregarProjetoAtivo,
  excluirDoHistorico,
} from "../../utils/storage";

export default function InicioScreen() {
  const router = useRouter();
  const [projeto, setProjeto] = useState<any>(null);
  const [historico, setHistorico] = useState<any[]>([]);

  const [mostrarPickerEstado, setMostrarPickerEstado] = useState(false);
  const [mostrarPickerHistorico, setMostrarPickerHistorico] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchDados = async () => {
        const p = await carregarProjetoAtivo();
        setProjeto(p);
        const hist = await carregarHistorico();
        setHistorico(hist);
      };
      fetchDados();
    }, []),
  );

  const salvarAlteracoes = async (novosValores: any) => {
    const pAtualizado = { ...(projeto || {}), ...novosValores };
    setProjeto(pAtualizado);
    await AsyncStorage.setItem(
      "@EletricaSolar_ProjetoAtivo",
      JSON.stringify(pAtualizado),
    );
  };

  // === LÓGICA ATUALIZADA COM O MODO MISTO ===
  const alternarTipoCalculo = (
    novoTipo: "equipamentos" | "direto" | "misto",
  ) => {
    if (projeto?.tipoCalculo === novoTipo) return;

    const temEquipamentos =
      projeto?.inventario && projeto.inventario.length > 0;
    const temConsumo =
      projeto?.consumoDiretokWh && projeto.consumoDiretokWh > 0;

    // Vai perder a lista de equipamentos?
    const perdeEquipamentos =
      (projeto?.tipoCalculo === "equipamentos" ||
        projeto?.tipoCalculo === "misto") &&
      novoTipo === "direto" &&
      temEquipamentos;
    // Vai perder o consumo digitado?
    const perdeConsumo =
      (projeto?.tipoCalculo === "direto" || projeto?.tipoCalculo === "misto") &&
      novoTipo === "equipamentos" &&
      temConsumo;

    const executarTroca = () => {
      if (novoTipo === "direto")
        salvarAlteracoes({ tipoCalculo: novoTipo, inventario: [] });
      else if (novoTipo === "equipamentos")
        salvarAlteracoes({ tipoCalculo: novoTipo, consumoDiretokWh: 0 });
      else salvarAlteracoes({ tipoCalculo: novoTipo }); // Para 'misto' não apaga nada!
    };

    if (perdeEquipamentos) {
      const msg =
        "Mudar para 'Consumo Total' apagará a lista de cargas atuais. Deseja continuar?";
      if (Platform.OS === "web") {
        if (window.confirm(msg)) executarTroca();
      } else {
        Alert.alert("Aviso ⚠️", msg, [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Sim, apagar e mudar",
            style: "destructive",
            onPress: executarTroca,
          },
        ]);
      }
    } else if (perdeConsumo) {
      const msg =
        "Mudar para 'Por Equipamentos' apagará o consumo base atual da conta. Deseja continuar?";
      if (Platform.OS === "web") {
        if (window.confirm(msg)) executarTroca();
      } else {
        Alert.alert("Aviso ⚠️", msg, [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Sim, apagar e mudar",
            style: "destructive",
            onPress: executarTroca,
          },
        ]);
      }
    } else {
      executarTroca();
    }
  };

  // Gerenciamento de Histórico
  const selecionarProjetoSalvo = async (proj: any) => {
    const msg = `Deseja carregar o projeto "${proj.nome}"?\n\nQualquer alteração não salva no rascunho atual será perdida.`;
    const executar = async () => {
      await carregarDoHistorico(proj);
      setProjeto(proj);
      setMostrarPickerHistorico(false);
    };
    if (Platform.OS === "web") {
      if (window.confirm(msg)) await executar();
    } else {
      Alert.alert("Abrir Projeto 📂", msg, [
        { text: "Cancelar", style: "cancel" },
        { text: "Sim, carregar", onPress: executar },
      ]);
    }
  };

  const deletarProjetoDoHistorico = async (nome: string) => {
    const msg = `Deseja excluir permanentemente o projeto "${nome}" do histórico?`;
    const executar = async () => {
      await excluirDoHistorico(nome);
      const novoHist = await carregarHistorico();
      setHistorico(novoHist);
    };
    if (Platform.OS === "web") {
      if (window.confirm(msg)) await executar();
    } else {
      Alert.alert("Excluir Projeto 🗑️", msg, [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: executar },
      ]);
    }
  };

  if (!projeto)
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );

  const regioesOrdenadas = [...REGIOES_SOLARES].sort((a, b) =>
    a.nome.localeCompare(b.nome),
  );
  const estadoAtual = regioesOrdenadas.find((r) => r.uf === projeto?.estado);
  const textoBotaoEstado = estadoAtual
    ? `${estadoAtual.nome} - ${estadoAtual.uf} (${estadoAtual.hspMedio} HSP)`
    : "Selecione um Estado";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* IDENTIFICAÇÃO DO CLIENTE E CARREGAMENTO DE HISTÓRICO */}
      <View style={styles.card}>
        <View style={styles.cabecalhoCard}>
          <Text style={styles.tituloCard}>Identificação do Cliente</Text>

          <TouchableOpacity
            onPress={() => setMostrarPickerHistorico(!mostrarPickerHistorico)}
            style={styles.btnAbreHistorico}
          >
            <MaterialCommunityIcons
              name="folder-open"
              size={16}
              color="#0284C7"
            />
            <Text style={styles.txtBtnHistorico}>Projetos Salvos</Text>
          </TouchableOpacity>
        </View>

        {mostrarPickerHistorico && (
          <View style={styles.dropdownBox}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
              {historico.length === 0 ? (
                <Text style={styles.txtHistoricoVazio}>
                  Nenhum projeto salvo ainda.
                </Text>
              ) : (
                historico.map((item, index) => (
                  <View key={index} style={styles.historicoRow}>
                    <TouchableOpacity
                      style={styles.historicoItem}
                      onPress={() => selecionarProjetoSalvo(item)}
                    >
                      <Text style={styles.dropdownItemText}>{item.nome}</Text>
                      <Text style={styles.historicoDetalhe}>
                        {item.tipoCalculo === "direto"
                          ? "Consumo Total"
                          : item.tipoCalculo === "misto"
                            ? "Modo Misto"
                            : "Equipamentos"}{" "}
                        • {item.estado || "Sem estado"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.btnDeletarHist}
                      onPress={() => deletarProjetoDoHistorico(item.nome)}
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={22}
                        color="#DC3545"
                      />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        )}

        <TextInput
          style={styles.input}
          value={projeto?.nome || ""}
          onChangeText={(texto) => salvarAlteracoes({ nome: texto })}
          placeholder="Ex: Chácara Igaratá"
        />
      </View>

      {/* DADOS DO LOCAL DE INSTALAÇÃO */}
      <View style={styles.card}>
        <Text style={styles.tituloCard}>Dados do Local de Instalação</Text>

        <Text style={styles.label}>Estado / Região (Índice Solar):</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setMostrarPickerEstado(!mostrarPickerEstado)}
        >
          <Text style={styles.pickerButtonText}>{textoBotaoEstado}</Text>
          <MaterialCommunityIcons
            name={mostrarPickerEstado ? "chevron-up" : "chevron-down"}
            size={24}
            color="#0056B3"
          />
        </TouchableOpacity>

        {mostrarPickerEstado && (
          <View style={styles.dropdownBox}>
            <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled={true}>
              {regioesOrdenadas.map((reg) => (
                <TouchableOpacity
                  key={reg.uf}
                  style={styles.dropdownItem}
                  onPress={() => {
                    salvarAlteracoes({ estado: reg.uf });
                    setMostrarPickerEstado(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{reg.nome}</Text>
                  <Text style={styles.dropdownItemHsp}>{reg.hspMedio} HSP</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ==================================================== */}
        {/* MODO DE CÁLCULO (AGORA COM 3 BOTÕES LADO A LADO) */}
        {/* ==================================================== */}
        <Text style={styles.label}>Método de Dimensionamento:</Text>
        <View style={styles.linhaBotoes}>
          <TouchableOpacity
            style={[
              styles.btnPillDuplo,
              projeto?.tipoCalculo === "equipamentos" && styles.btnPillAtivo,
            ]}
            onPress={() => alternarTipoCalculo("equipamentos")}
          >
            <MaterialCommunityIcons
              name="format-list-checks"
              size={16}
              color={
                projeto?.tipoCalculo === "equipamentos" ? "#FFF" : "#475569"
              }
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.txtPill,
                projeto?.tipoCalculo === "equipamentos" && styles.txtPillAtivo,
                { fontSize: 11 },
              ]}
            >
              Cargas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btnPillDuplo,
              projeto?.tipoCalculo === "direto" && styles.btnPillAtivo,
            ]}
            onPress={() => alternarTipoCalculo("direto")}
          >
            <MaterialCommunityIcons
              name="lightning-bolt"
              size={16}
              color={projeto?.tipoCalculo === "direto" ? "#FFF" : "#475569"}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.txtPill,
                projeto?.tipoCalculo === "direto" && styles.txtPillAtivo,
                { fontSize: 11 },
              ]}
            >
              Conta
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btnPillDuplo,
              projeto?.tipoCalculo === "misto" && styles.btnPillAtivo,
            ]}
            onPress={() => alternarTipoCalculo("misto")}
          >
            <MaterialCommunityIcons
              name="layers-plus"
              size={16}
              color={projeto?.tipoCalculo === "misto" ? "#FFF" : "#475569"}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.txtPill,
                projeto?.tipoCalculo === "misto" && styles.txtPillAtivo,
                { fontSize: 11 },
              ]}
            >
              Misto
            </Text>
          </TouchableOpacity>
        </View>

        {/* CAMPO DE DIGITAR O CONSUMO (Aparece no Direto E no Misto) */}
        {(projeto?.tipoCalculo === "direto" ||
          projeto?.tipoCalculo === "misto") && (
          <View style={{ marginBottom: 10, marginTop: 8 }}>
            <Text style={styles.label}>
              {projeto?.tipoCalculo === "misto"
                ? "Consumo Base Atual (kWh):"
                : "Consumo Mensal da Conta (kWh):"}
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={
                projeto?.consumoDiretokWh
                  ? String(projeto.consumoDiretokWh)
                  : ""
              }
              onChangeText={(t) =>
                salvarAlteracoes({
                  consumoDiretokWh: parseFloat(t.replace(",", ".")) || 0,
                })
              }
              placeholder={
                projeto?.tipoCalculo === "misto"
                  ? "Ex: 250 (Conta atual)"
                  : "Ex: 450"
              }
            />
            {projeto?.tipoCalculo === "misto" && (
              <Text style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                * Adicione os novos equipamentos (Ex: Piscina) na aba "Cargas".
              </Text>
            )}
          </View>
        )}

        <Text style={styles.label}>
          A propriedade possui rede da Concessionária?
        </Text>
        <View style={styles.linhaBotoes}>
          <TouchableOpacity
            style={[
              styles.btnPillDuplo,
              projeto?.temRede === true && styles.btnPillAtivo,
            ]}
            onPress={() => salvarAlteracoes({ temRede: true })}
          >
            <MaterialCommunityIcons
              name="transmission-tower"
              size={18}
              color={projeto?.temRede ? "#FFF" : "#475569"}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.txtPill,
                projeto?.temRede === true && styles.txtPillAtivo,
              ]}
            >
              Sim (Rede Pública)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btnPillDuplo,
              projeto?.temRede === false && styles.btnPillAtivoOff,
            ]}
            onPress={() => salvarAlteracoes({ temRede: false })}
          >
            <MaterialCommunityIcons
              name="pine-tree"
              size={18}
              color={projeto?.temRede === false ? "#FFF" : "#475569"}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.txtPill,
                projeto?.temRede === false && styles.txtPillAtivo,
              ]}
            >
              Não (Isolado)
            </Text>
          </TouchableOpacity>
        </View>

        {projeto?.temRede && (
          <>
            <Text style={styles.label}>Tipo de Ligação (Taxa Mínima):</Text>
            <View style={styles.linhaBotoes}>
              {["Monofasico", "Bifasico", "Trifasico"].map((fase) => (
                <TouchableOpacity
                  key={fase}
                  style={[
                    styles.btnPill,
                    projeto?.faseRede === fase && styles.btnPillAtivo,
                  ]}
                  onPress={() => salvarAlteracoes({ faseRede: fase })}
                >
                  <Text
                    style={[
                      styles.txtPill,
                      projeto?.faseRede === fase && styles.txtPillAtivo,
                    ]}
                  >
                    {fase === "Monofasico"
                      ? "Mono (30kWh)"
                      : fase === "Bifasico"
                        ? "Bi (50kWh)"
                        : "Tri (100kWh)"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.tituloCard}>Ajuda e Suporte</Text>
        <Text style={{ fontSize: 13, color: "#64748B", marginBottom: 12 }}>
          Acesse o guia passo a passo e o memorial de cálculos:
        </Text>
        <TouchableOpacity
          style={styles.btnManual}
          onPress={() =>
            Linking.openURL(
              "https://drive.google.com/file/d/1CGrskMd7bXegSEzePB0c0gwPUNkvT3a2/view?usp=sharing",
            )
          }
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
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16 },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    // @ts-ignore
    boxShadow:
      Platform.OS === "web" ? "0px 2px 4px rgba(0,0,0,0.02)" : undefined,
    elevation: 1,
  },

  cabecalhoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tituloCard: { fontSize: 16, fontWeight: "bold", color: "#1E293B", flex: 1 },
  btnAbreHistorico: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  txtBtnHistorico: {
    color: "#0284C7",
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 4,
  },

  txtHistoricoVazio: {
    padding: 14,
    textAlign: "center",
    color: "#94A3B8",
    fontStyle: "italic",
  },
  historicoRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  historicoItem: { flex: 1, padding: 14 },
  historicoDetalhe: { fontSize: 11, color: "#64748B", marginTop: 2 },
  btnDeletarHist: {
    padding: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  label: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 8,
    fontWeight: "bold",
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FFF",
    fontSize: 15,
  },

  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 14,
    backgroundColor: "#FFF",
    marginBottom: 16,
  },
  pickerButtonText: { fontSize: 15, color: "#0F172A" },
  dropdownBox: {
    borderWidth: 1,
    borderColor: "#0056B3",
    borderRadius: 8,
    backgroundColor: "#FFF",
    marginBottom: 16,
    marginTop: -10,
    elevation: 3,
    // @ts-ignore
    boxShadow:
      Platform.OS === "web" ? "0px 4px 6px rgba(0,0,0,0.1)" : undefined,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownItemText: { fontSize: 15, color: "#334155", fontWeight: "500" },
  dropdownItemHsp: { fontSize: 14, color: "#0056B3", fontWeight: "bold" },

  linhaBotoes: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
    gap: 8,
  },
  btnPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F1F5F9",
    marginRight: 8,
  },
  btnPillDuplo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F1F5F9",
  },
  btnPillAtivo: { backgroundColor: "#0056B3", borderColor: "#0056B3" },
  btnPillAtivoOff: { backgroundColor: "#059669", borderColor: "#059669" },
  txtPill: { color: "#475569", fontWeight: "bold", fontSize: 13 },
  txtPillAtivo: { color: "#FFF" },

  btnManual: {
    backgroundColor: "#475569",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  txtBtnBranco: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
});
