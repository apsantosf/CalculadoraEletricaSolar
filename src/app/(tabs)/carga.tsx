// src/app/(tabs)/carga.tsx
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
import {
  EQUIPAMENTOS_PADRAO,
  EquipamentoPadrao,
} from "../../constants/equipamentos";
import { atualizarInventario, carregarProjetoAtivo } from "../../utils/storage";

export interface EquipamentoCarga {
  id: string;
  nome: string;
  potenciaW: number;
  quantidade: number;
  horasUsoDia: number;
}

export default function CargaScreen() {
  const [inventario, setInventario] = useState<EquipamentoCarga[]>([]);
  const [nome, setNome] = useState("");
  const [potencia, setPotencia] = useState("");
  const [horas, setHoras] = useState("");
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  // Recarrega o inventário ativo sempre que a aba for aberta
  useFocusEffect(
    useCallback(() => {
      const fetchDados = async () => {
        const projeto = await carregarProjetoAtivo();
        setInventario(projeto.inventario || []);
      };
      fetchDados();
    }, []),
  );

  // Salva no banco de dados automaticamente quando o inventário muda
  useEffect(() => {
    atualizarInventario(inventario);
  }, [inventario]);

  const selecionarSugestao = (item: EquipamentoPadrao) => {
    setNome(item.label);
    setPotencia(item.potenciaMediaW.toString());
    setMostrarSugestoes(false);
  };

  const adicionarEquipamento = () => {
    if (!nome || !potencia || !horas) {
      Platform.OS === "web"
        ? window.alert("Preencha todos os campos.")
        : Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }

    const novoEquipamento: EquipamentoCarga = {
      id: Math.random().toString(36).substring(7),
      nome,
      potenciaW: parseFloat(potencia),
      quantidade: 1,
      horasUsoDia: parseFloat(horas),
    };

    setInventario([...inventario, novoEquipamento]);
    setNome("");
    setPotencia("");
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
        <Text style={styles.tituloSecao}>Adicionar Equipamentos (Cargas)</Text>

        <Text style={styles.label}>Sugestões Rápidas:</Text>
        <TouchableOpacity
          style={styles.inputDropdown}
          onPress={() => setMostrarSugestoes(!mostrarSugestoes)}
        >
          <Text style={{ color: nome ? "#000" : "#888" }}>
            {nome || "Selecione ou digite um equipamento..."}
          </Text>
        </TouchableOpacity>

        {mostrarSugestoes && (
          <View style={styles.listaSugestoesContainer}>
            <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled={true}>
              {EQUIPAMENTOS_PADRAO.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemSugestao}
                  onPress={() => selecionarSugestao(item)}
                >
                  <Text style={styles.textoItemSugestao}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Potência (W):</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={potencia}
              onChangeText={setPotencia}
              placeholder="Ex: 820"
            />
          </View>
          <View style={styles.inputGroup}>
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
          <Text style={styles.txtBtnBranco}>Adicionar Carga</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.tituloSecao}>Relação de Cargas</Text>
      <View style={styles.cardTotal}>
        <Text style={styles.txtTotal}>
          Consumo Diário: {calcularConsumo()} Wh
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
              <Text style={styles.nomeItem}>{item.nome}</Text>
              <Text style={styles.detalhesItem}>
                Potência: {item.potenciaW} W | Uso: {item.horasUsoDia}h
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => removerEquipamento(item.id, item.nome)}
              style={styles.btnRemover}
            >
              <Text style={styles.txtRemover}>✖</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.txtVazio}>Nenhuma carga cadastrada.</Text>
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", padding: 16 },
  cardForm: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
  },
  tituloSecao: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 12,
  },
  label: { fontSize: 12, color: "#555", marginBottom: 4, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
    backgroundColor: "#FFF",
  },
  inputDropdown: {
    borderWidth: 1,
    borderColor: "#CCC",
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: "#FAFAFA",
  },
  listaSugestoesContainer: {
    borderWidth: 1,
    borderColor: "#007BFF",
    borderRadius: 6,
    backgroundColor: "#FFF",
    marginBottom: 12,
    elevation: 4,
  },
  itemSugestao: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  textoItemSugestao: { fontSize: 14, color: "#333" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  inputGroup: { width: "48%" },
  btnAdicionar: {
    backgroundColor: "#28A745",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  txtBtnBranco: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
  cardTotal: {
    backgroundColor: "#E8F4FD",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#B6D4FE",
    marginBottom: 16,
  },
  txtTotal: {
    color: "#004085",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 15,
  },
  cardItem: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
    overflow: "hidden",
  },
  faixaLateral: { width: 6, backgroundColor: "#007BFF" },
  dadosItem: { flex: 1, padding: 12 },
  nomeItem: { fontWeight: "bold", fontSize: 15, color: "#333" },
  detalhesItem: { fontSize: 13, color: "#666", marginTop: 4 },
  btnRemover: { justifyContent: "center", paddingHorizontal: 16 },
  txtRemover: { color: "#DC3545", fontWeight: "bold", fontSize: 18 },
  txtVazio: {
    textAlign: "center",
    color: "#999",
    padding: 10,
    fontStyle: "italic",
  },
});
