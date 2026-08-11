// src/components/Calculadora/PickerHibrido.tsx
import { useRouter } from "expo-router";
import { useState } from "react";
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

export interface EquipamentoCarga {
  id: string;
  nome: string;
  potenciaW: number;
  quantidade: number;
  horasUsoDia: number;
}

export const PickerHibrido = () => {
  const [inventario, setInventario] = useState<EquipamentoCarga[]>([]);
  const [nome, setNome] = useState("");
  const [potencia, setPotencia] = useState("");
  const [horas, setHoras] = useState("");
  const router = useRouter();

  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  const selecionarSugestao = (item: EquipamentoPadrao) => {
    setNome(item.label);
    setPotencia(item.potenciaMediaW.toString());
    setMostrarSugestoes(false);
  };

  const adicionarEquipamento = () => {
    if (!nome || !potencia || !horas) {
      const msg = "Preencha todos os campos para adicionar a carga.";
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(msg);
      } else {
        Alert.alert("Atenção", msg);
      }
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
    const mensagem = `Tem certeza que deseja apagar "${nomeEquipamento}" do projeto?`;

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const confirmar = window.confirm(mensagem);
      if (confirmar) {
        setInventario(inventario.filter((item) => item.id !== id));
      }
    } else {
      Alert.alert("Remover Carga", mensagem, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, apagar",
          style: "destructive",
          onPress: () =>
            setInventario(inventario.filter((item) => item.id !== id)),
        },
      ]);
    }
  };

  const calcularConsumoDiarioWh = () => {
    return inventario.reduce((total, item) => {
      return total + item.potenciaW * item.quantidade * item.horasUsoDia;
    }, 0);
  };

  const irParaResultado = () => {
    const consumoTotal = calcularConsumoDiarioWh();

    if (consumoTotal <= 0) {
      const msg =
        "Por favor, adicione pelo menos uma carga ao inventário antes de calcular.";
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(msg);
      } else {
        Alert.alert("Aviso", msg);
      }
      return;
    }

    router.push({
      pathname: "/resultado",
      params: { consumoWh: consumoTotal },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardForm}>
        <Text style={styles.label}>Sugestões de Equipamentos (Cargas):</Text>

        <TouchableOpacity
          style={styles.inputDropdown}
          onPress={() => setMostrarSugestoes(!mostrarSugestoes)}
        >
          <Text style={{ color: nome ? "#000" : "#888" }}>
            {nome || "Selecione ou digite um equipamento..."}
          </Text>
        </TouchableOpacity>

        {/* Lista de Sugestões com rolagem interna travada e elegante */}
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
          <Text style={styles.txtBtnAdicionar}>Adicionar Carga</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.tituloSecao}>Relação de Cargas</Text>

      <View style={styles.cardTotal}>
        <Text style={styles.txtTotal}>
          Consumo Diário Projetado: {calcularConsumoDiarioWh()} Wh
        </Text>
      </View>

      <FlatList
        data={inventario}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardItem}>
            <View style={styles.faixaLateral} />
            <View style={styles.dadosItem}>
              <Text style={styles.nomeItem}>{item.nome}</Text>
              <Text style={styles.detalhesItem}>
                Potência: {item.potenciaW} W | Uso: {item.horasUsoDia}h/dia
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

      {inventario.length > 0 && (
        <TouchableOpacity
          style={[
            styles.btnAdicionar,
            { marginTop: 16, backgroundColor: "#007BFF" },
          ]}
          onPress={irParaResultado}
        >
          <Text style={styles.txtBtnAdicionar}>Dimensionar Sistema Solar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", padding: 16 },

  cardForm: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
    zIndex: 10,
  },
  label: { fontSize: 12, color: "#555", marginBottom: 4, fontWeight: "bold" },

  inputDropdown: {
    borderWidth: 1,
    borderColor: "#CCC",
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: "#FAFAFA",
  },

  // Container com barra de rolagem interna controlada
  listaSugestoesContainer: {
    borderWidth: 1,
    borderColor: "#007BFF",
    borderRadius: 6,
    backgroundColor: "#FFF",
    marginBottom: 12,
    elevation: 4,
    // @ts-ignore
    boxShadow: "0px 4px 10px rgba(0,0,0,0.15)",
  },

  itemSugestao: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  textoItemSugestao: {
    fontSize: 14,
    color: "#333",
  },

  row: { flexDirection: "row", justifyContent: "space-between" },
  inputGroup: { width: "48%" },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
    backgroundColor: "#FFF",
  },

  btnAdicionar: {
    backgroundColor: "#28A745",
    padding: 14,
    borderRadius: 6,
    alignItems: "center",
  },
  txtBtnAdicionar: { color: "#FFF", fontWeight: "bold", fontSize: 16 },

  tituloSecao: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },

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

  txtVazio: { textAlign: "center", color: "#999", marginTop: 20 },
});
