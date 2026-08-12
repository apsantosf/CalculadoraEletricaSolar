// src/app/(tabs)/carga.tsx
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
  const [quantidade, setQuantidade] = useState("1"); // NOVO: Campo de quantidade (começa com 1)
  const [horas, setHoras] = useState("");
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

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
    setQuantidade("1"); // Reseta a quantidade para 1 ao escolher algo novo
    setMostrarSugestoes(false);
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

  const adicionarEquipamento = async () => {
    if (!nome || !potencia || !horas || !quantidade) {
      Platform.OS === "web"
        ? window.alert("Preencha todos os campos.")
        : Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }

    const potenciaNumerica = parseFloat(potencia.replace(",", "."));
    const horasNumerica = parseFloat(horas.replace(",", "."));
    const quantidadeNumerica = parseInt(quantidade, 10); // Lendo a quantidade

    const novoEquipamento: EquipamentoCarga = {
      id: Math.random().toString(36).substring(7),
      nome: nome.trim(),
      potenciaW: potenciaNumerica,
      quantidade: quantidadeNumerica, // Agora usa o valor digitado!
      horasUsoDia: horasNumerica,
    };

    setInventario([...inventario, novoEquipamento]);

    const listaAtualizada = await salvarNovoEquipamentoNoBanco(
      nome,
      potenciaNumerica,
    );
    if (listaAtualizada) {
      setListaSugestoes(listaAtualizada);
    }

    setNome("");
    setPotencia("");
    setQuantidade("1"); // Volta pro padrão
    setHoras("");
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 }}
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

        {/* NOVA LINHA COM 3 CAMPOS DIVIDIDOS */}
        <View style={styles.row}>
          <View style={styles.inputGroup33}>
            <Text style={styles.label}>Qtd:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={quantidade}
              onChangeText={setQuantidade}
              placeholder="Ex: 5"
            />
          </View>
          <View style={styles.inputGroup33}>
            <Text style={styles.label}>Pot. (W):</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={potencia}
              onChangeText={setPotencia}
              placeholder="Ex: 10"
            />
          </View>
          <View style={styles.inputGroup33}>
            <Text style={styles.label}>Horas/Dia:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={horas}
              onChangeText={setHoras}
              placeholder="Ex: 8"
            />
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
    // @ts-ignore
    boxShadow:
      Platform.OS === "web" ? "0px 4px 6px rgba(0,0,0,0.1)" : undefined,
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#FFF",
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  inputGroup33: { width: "31%" }, // NOVO: Dividido em 3 colunas iguais

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
  }, // NOVO: Mostra o subtotal de consumo do item
  btnRemover: { justifyContent: "center", paddingHorizontal: 16 },
  txtVazio: {
    textAlign: "center",
    color: "#94A3B8",
    padding: 20,
    fontStyle: "italic",
  },
});
