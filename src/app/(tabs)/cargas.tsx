// src/app/(tabs)/cargas.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { EquipamentoPadrao } from "../../constants/equipamentos";
import {
  atualizarInventario,
  carregarListaEquipamentos,
  carregarProjetoAtivo,
  excluirEquipamentoDoBanco,
  salvarNovoEquipamentoNoBanco,
} from "../../utils/storage";

export interface EquipamentoCarga {
  id: string;
  nome: string;
  potenciaW: number;
  quantidade: number;
  horasUsoDia: number;
}

export default function CargaScreen() {
  const [inventario, setInventario] = useState<EquipamentoCarga[]>([]);
  const [listaSugestoes, setListaSugestoes] = useState<EquipamentoPadrao[]>([]);

  const [nome, setNome] = useState("");
  const [potencia, setPotencia] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [horas, setHoras] = useState("");
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  // === ESTADOS DOS CÁLCULOS ESPECIAIS ===
  const [temCiclo, setTemCiclo] = useState(false);
  const [usarInmetro, setUsarInmetro] = useState(false);
  const [consumoInmetro, setConsumoInmetro] = useState("");
  const [tempoInmetro, setTempoInmetro] = useState("");

  useFocusEffect(
    useCallback(() => {
      const fetchDados = async () => {
        const projeto = await carregarProjetoAtivo();
        setInventario(projeto.inventario || []);
        const listaBD = await carregarListaEquipamentos();
        setListaSugestoes(listaBD);
      };
      fetchDados();
    }, []),
  );

  useEffect(() => {
    atualizarInventario(inventario);
  }, [inventario]);

  const selecionarSugestao = (item: EquipamentoPadrao) => {
    setNome(item.label);
    setPotencia(item.potenciaMediaW.toString());
    setQuantidade("1");
    setMostrarSugestoes(false);

    setTemCiclo(false);
    setUsarInmetro(false);
    setConsumoInmetro("");
    setTempoInmetro("");
  };

  const excluirSugestaoBd = async (id: string, nomeSugestao: string) => {
    const msg = `Deseja excluir "${nomeSugestao}" da sua lista de sugestões permanentemente?`;
    if (Platform.OS === "web") {
      if (window.confirm(msg)) {
        const novaLista = await excluirEquipamentoDoBanco(id);
        if (novaLista) setListaSugestoes(novaLista);
      }
    } else {
      Alert.alert("Excluir Sugestão", msg, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, excluir",
          style: "destructive",
          onPress: async () => {
            const novaLista = await excluirEquipamentoDoBanco(id);
            if (novaLista) setListaSugestoes(novaLista);
          },
        },
      ]);
    }
  };

  const handleToggleCiclo = () => {
    if (usarInmetro) {
      const msg =
        "Desmarque a caixa 'Selo Inmetro' primeiro para usar o ciclo.";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("Atenção", msg);
      return;
    }
    const novoEstado = !temCiclo;
    setTemCiclo(novoEstado);
  };

  const handleToggleInmetro = () => {
    if (temCiclo) {
      const msg = "Desmarque a caixa 'Equipamento com ciclo' primeiro.";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("Atenção", msg);
      return;
    }

    const novoEstado = !usarInmetro;
    setUsarInmetro(novoEstado);

    if (novoEstado) {
      setPotencia("");
      setHoras("");
    } else {
      setConsumoInmetro("");
      setTempoInmetro("");
      setPotencia("");
      setHoras("");
    }
  };

  const handleTempoInmetro = (texto: string) => {
    setTempoInmetro(texto);
    const t = parseFloat(texto.replace(",", "."));
    if (!isNaN(t) && t > 0) {
      const horasDiarias = t > 744 ? t / 365 : t / 30;
      setHoras(horasDiarias.toFixed(1).replace(".0", ""));
    } else {
      setHoras("");
    }
  };

  const adicionarEquipamento = async () => {
    if (!nome || !quantidade) {
      Platform.OS === "web"
        ? window.alert("Preencha o nome e a quantidade.")
        : Alert.alert("Atenção", "Preencha o nome e a quantidade.");
      return;
    }

    if (usarInmetro && (!consumoInmetro || !tempoInmetro)) {
      Platform.OS === "web"
        ? window.alert("Digite o consumo (kWh) e as horas da etiqueta Inmetro.")
        : Alert.alert(
            "Atenção",
            "Digite o consumo (kWh) e as horas da etiqueta Inmetro.",
          );
      return;
    }

    if (!usarInmetro && !potencia) {
      Platform.OS === "web"
        ? window.alert("Preencha a Potência (W).")
        : Alert.alert("Atenção", "Preencha a Potência (W).");
      return;
    }

    if (!horas) {
      Platform.OS === "web"
        ? window.alert("Preencha a quantidade de Horas/Dia.")
        : Alert.alert("Atenção", "Preencha a quantidade de Horas/Dia.");
      return;
    }

    const quantidadeNumerica = parseInt(quantidade, 10);
    let potenciaNumerica = 0;
    let horasNumerica = parseFloat(horas.replace(",", "."));

    if (usarInmetro) {
      const c = parseFloat(consumoInmetro.replace(",", "."));
      const t = parseFloat(tempoInmetro.replace(",", "."));
      potenciaNumerica = parseFloat(((c * 1000) / t).toFixed(2));
    } else {
      potenciaNumerica = parseFloat(potencia.replace(",", "."));
    }

    if (temCiclo) {
      horasNumerica = parseFloat((horasNumerica * 0.35).toFixed(2));
    }

    const novoEquipamento: EquipamentoCarga = {
      id: Math.random().toString(36).substring(7),
      nome: nome.trim(),
      potenciaW: potenciaNumerica,
      quantidade: quantidadeNumerica,
      horasUsoDia: horasNumerica,
    };

    setInventario([...inventario, novoEquipamento]);

    if (!usarInmetro) {
      const listaAtualizada = await salvarNovoEquipamentoNoBanco(
        nome,
        potenciaNumerica,
      );
      if (listaAtualizada) setListaSugestoes(listaAtualizada);
    }

    setNome("");
    setPotencia("");
    setQuantidade("1");
    setHoras("");
    setTemCiclo(false);
    setUsarInmetro(false);
    setConsumoInmetro("");
    setTempoInmetro("");
  };

  const removerEquipamento = (id: string, nomeEquipamento: string) => {
    const msg = `Apagar "${nomeEquipamento}" do projeto?`;
    if (Platform.OS === "web") {
      if (window.confirm(msg))
        setInventario(inventario.filter((item) => item.id !== id));
    } else {
      Alert.alert("Remover", msg, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim",
          style: "destructive",
          onPress: () =>
            setInventario(inventario.filter((item) => item.id !== id)),
        },
      ]);
    }
  };

  const calcularConsumo = () =>
    inventario.reduce(
      (tot, item) => tot + item.potenciaW * item.quantidade * item.horasUsoDia,
      0,
    );

  let horasExibicao = horas;
  if (temCiclo && horas !== "") {
    const h = parseFloat(horas.replace(",", "."));
    if (!isNaN(h)) horasExibicao = (h * 0.35).toFixed(1);
  }

  let potenciaExibicao = potencia;
  if (usarInmetro) {
    const c = parseFloat(consumoInmetro.replace(",", "."));
    const t = parseFloat(tempoInmetro.replace(",", "."));
    if (!isNaN(c) && c > 0 && !isNaN(t) && t > 0) {
      potenciaExibicao = ((c * 1000) / t).toFixed(1);
    } else {
      potenciaExibicao = "0.0";
    }
  }

  // 💡 NOVO: CÁLCULO DA MÉDIA INMETRO ORIGINAL (Para o "Rastro" visual)
  let horasInmetroOriginal = "";
  if (usarInmetro && tempoInmetro !== "") {
    const t = parseFloat(tempoInmetro.replace(",", "."));
    if (!isNaN(t) && t > 0) {
      horasInmetroOriginal = (t > 744 ? t / 365 : t / 30)
        .toFixed(1)
        .replace(".0", "");
    }
  }

  const mostrarDicaInmetro = () => {
    const titulo = "Engenharia dos Fatores";
    const mensagem =
      "• Ciclo 35%: Reduz as horas digitadas (útil para motores antigos).\n\n• Selo Inmetro: Digite o consumo (kWh) e o tempo avaliado na etiqueta (Ex: 2080h ou 720h). O app trava a potência real e já sugere a média de horas diárias, mas deixa você livre para editar o tempo se o cliente usar mais ou menos que o Inmetro!";
    if (Platform.OS === "web") {
      window.alert(`${titulo}\n\n${mensagem}`);
    } else {
      Alert.alert(titulo, mensagem);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.cardForm}>
        <Text style={styles.tituloSecao}>Adicionar Carga</Text>
        <Text style={styles.label}>Nome do Equipamento:</Text>
        <View style={styles.hybridContainer}>
          <TextInput
            style={styles.inputHybrid}
            value={nome}
            onChangeText={setNome}
            placeholder="Ex: Lâmpada LED (Digite ou escolha ➡️)"
          />
          <TouchableOpacity
            style={styles.btnSeta}
            onPress={() => setMostrarSugestoes(!mostrarSugestoes)}
          >
            <MaterialCommunityIcons
              name={mostrarSugestoes ? "chevron-up" : "chevron-down"}
              size={24}
              color="#0056B3"
            />
          </TouchableOpacity>
        </View>

        {mostrarSugestoes && (
          <View style={styles.sugestoesBox}>
            <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled={true}>
              {listaSugestoes.map((item, index) => (
                <View key={`${item.id}-${index}`} style={styles.sugestaoRow}>
                  <TouchableOpacity
                    style={styles.sugestaoItem}
                    onPress={() => selecionarSugestao(item)}
                  >
                    <Text style={styles.textoItemSugestao}>{item.label}</Text>
                    <Text style={styles.textoPotenciaSugestao}>
                      {item.potenciaMediaW}W
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnDeletarSugestao}
                    onPress={() => excluirSugestaoBd(item.id, item.label)}
                  >
                    <MaterialCommunityIcons
                      name="close-circle-outline"
                      size={20}
                      color="#DC3545"
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.row}>
          <View style={styles.inputGroup33}>
            <Text style={styles.label}>Quantidade:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={quantidade}
              onChangeText={(texto) =>
                setQuantidade(texto.replace(/[^0-9]/g, ""))
              }
              placeholder="Ex: 5"
            />
          </View>
          <View style={styles.inputGroup33}>
            <Text style={styles.label}>Potência (W):</Text>
            <TextInput
              style={[
                styles.input,
                usarInmetro && styles.inputTravado,
                usarInmetro && potencia !== "" && { marginBottom: 2 },
              ]}
              keyboardType="numeric"
              value={
                usarInmetro
                  ? potenciaExibicao === "0.0" && potencia === ""
                    ? potencia
                    : potenciaExibicao
                  : potencia
              }
              onChangeText={setPotencia}
              placeholder="Ex: 10"
              editable={!usarInmetro}
            />
            {usarInmetro && potenciaExibicao !== "0.0" && (
              <Text style={styles.dicaVerde}>Real/Média</Text>
            )}
          </View>
          <View style={styles.inputGroup33}>
            <Text style={styles.label}>Horas/Dia/Un:</Text>
            <TextInput
              style={[
                styles.input,
                temCiclo && horas !== "" && { marginBottom: 2 },
                usarInmetro &&
                  horasInmetroOriginal !== "" && { marginBottom: 2 },
              ]}
              keyboardType="numeric"
              value={horas}
              onChangeText={setHoras}
              placeholder="Ex: 24"
            />
            {temCiclo && horas !== "" && (
              <Text style={styles.dicaVerde}>= {horasExibicao}h reais</Text>
            )}

            {/* 💡 NOVO: MÁGICA VISUAL DO RASTRO INMETRO */}
            {usarInmetro && horasInmetroOriginal !== "" && (
              <Text
                style={[
                  styles.dicaVerde,
                  horas !== horasInmetroOriginal ? { color: "#F59E0B" } : {},
                ]}
              >
                {horas !== horasInmetroOriginal
                  ? "⚠️ Inmetro: "
                  : "Média Inmetro: "}
                {horasInmetroOriginal}h
              </Text>
            )}
          </View>
        </View>

        {usarInmetro && (
          <View
            style={{
              marginBottom: 16,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <View style={{ width: "48%" }}>
              <Text style={styles.label}>Etiqueta (kWh):</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: "#10B981",
                    backgroundColor: "#ECFDF5",
                    marginBottom: 0,
                  },
                ]}
                keyboardType="numeric"
                value={consumoInmetro}
                onChangeText={setConsumoInmetro}
                placeholder="Ex: 286"
              />
            </View>
            <View style={{ width: "48%" }}>
              <Text style={styles.label}>Tempo Avaliado (h):</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: "#10B981",
                    backgroundColor: "#ECFDF5",
                    marginBottom: 0,
                  },
                ]}
                keyboardType="numeric"
                value={tempoInmetro}
                onChangeText={handleTempoInmetro}
                placeholder="2080(Ano) 720(Mês)"
              />
            </View>
          </View>
        )}

        <View style={styles.caixaControlesContainer}>
          <View style={styles.checkboxWrapper}>
            <TouchableOpacity
              style={[
                styles.checkboxContainer,
                usarInmetro && { opacity: 0.5 },
              ]}
              onPress={handleToggleCiclo}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={temCiclo ? "checkbox-marked" : "checkbox-blank-outline"}
                size={24}
                color={
                  usarInmetro ? "#CBD5E1" : temCiclo ? "#0056B3" : "#64748B"
                }
              />
              <Text
                style={[
                  styles.checkboxLabel,
                  usarInmetro && { color: "#94A3B8" },
                ]}
              >
                Equipamento com ciclo (Ex: 35%)
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.checkboxWrapper}>
            <TouchableOpacity
              style={[styles.checkboxContainer, temCiclo && { opacity: 0.5 }]}
              onPress={handleToggleInmetro}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={
                  usarInmetro ? "checkbox-marked" : "checkbox-blank-outline"
                }
                size={24}
                color={
                  temCiclo ? "#CBD5E1" : usarInmetro ? "#10B981" : "#64748B"
                }
              />
              <Text
                style={[styles.checkboxLabel, temCiclo && { color: "#94A3B8" }]}
              >
                Usar Selo Inmetro (Exato)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnInfo}
              onPress={mostrarDicaInmetro}
            >
              <MaterialCommunityIcons
                name="information-outline"
                size={22}
                color="#0284C7"
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.btnAdicionar}
          onPress={adicionarEquipamento}
        >
          <MaterialCommunityIcons
            name="plus-circle-outline"
            size={20}
            color="#FFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.txtBtnBranco}>Adicionar ao Projeto</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.tituloSecao}>Inventário do Sistema</Text>
      <View style={styles.cardTotal}>
        <Text style={styles.txtTotal}>
          Consumo Diário: {calcularConsumo().toFixed(0)} Wh
        </Text>
      </View>

      <FlatList
        data={inventario}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardItem}>
            <View style={styles.faixaLateral} />
            <View style={styles.dadosItem}>
              <Text style={styles.nomeItem}>
                {item.quantidade}x {item.nome}
              </Text>
              <Text style={styles.detalhesItem}>
                Potência: {item.potenciaW}W | Uso: {item.horasUsoDia}h/dia
              </Text>
              <Text style={styles.subtotalItem}>
                Subtotal:{" "}
                {(item.potenciaW * item.quantidade * item.horasUsoDia).toFixed(
                  0,
                )}{" "}
                Wh
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => removerEquipamento(item.id, item.nome)}
              style={styles.btnRemover}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={22}
                color="#DC3545"
              />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.txtVazio}>Nenhuma carga cadastrada ainda.</Text>
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16 },
  cardForm: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  tituloSecao: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 6,
    fontWeight: "bold",
  },
  hybridContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#FFF",
  },
  inputHybrid: { flex: 1, padding: 12, fontSize: 14, color: "#0F172A" },
  btnSeta: {
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: "#E2E8F0",
    backgroundColor: "#F1F5F9",
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  sugestoesBox: {
    borderWidth: 1,
    borderColor: "#0056B3",
    borderRadius: 8,
    backgroundColor: "#FFF",
    marginBottom: 16,
    marginTop: -10,
    elevation: 3,
  },
  sugestaoRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sugestaoItem: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
  },
  btnDeletarSugestao: {
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  textoItemSugestao: { fontSize: 14, color: "#334155", fontWeight: "500" },
  textoPotenciaSugestao: { fontSize: 14, color: "#0056B3", fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#FFF",
  },
  inputTravado: {
    backgroundColor: "#E2E8F0",
    color: "#0F172A",
    fontWeight: "bold",
  },

  // 💡 Mudei o nome de dicaHoraReal para dicaVerde para abranger Inmetro e Ciclo
  dicaVerde: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    marginTop: -2,
  },

  caixaControlesContainer: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
    marginBottom: 16,
  },
  checkboxWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  btnInfo: {
    padding: 4,
    marginLeft: 10,
    justifyContent: "center",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
    marginLeft: 8,
  },

  row: { flexDirection: "row", justifyContent: "space-between" },
  inputGroup33: { width: "31%" },
  btnAdicionar: {
    backgroundColor: "#0056B3",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  txtBtnBranco: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
  cardTotal: {
    backgroundColor: "#E0F2FE",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    marginBottom: 16,
  },
  txtTotal: {
    color: "#0284C7",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  cardItem: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
    overflow: "hidden",
  },
  faixaLateral: { width: 6, backgroundColor: "#0056B3" },
  dadosItem: { flex: 1, padding: 14 },
  nomeItem: { fontWeight: "bold", fontSize: 15, color: "#0F172A" },
  detalhesItem: { fontSize: 13, color: "#64748B", marginTop: 4 },
  subtotalItem: {
    fontSize: 12,
    color: "#0284C7",
    marginTop: 4,
    fontWeight: "bold",
  },
  btnRemover: { justifyContent: "center", paddingHorizontal: 16 },
  txtVazio: {
    textAlign: "center",
    color: "#94A3B8",
    padding: 20,
    fontStyle: "italic",
  },
});
