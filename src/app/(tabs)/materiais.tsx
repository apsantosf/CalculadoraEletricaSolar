// src/app/(tabs)/materiais.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { REGIOES_SOLARES } from "../../constants/regioes";
import { carregarProjetoAtivo } from "../../utils/storage";

export default function MateriaisScreen() {
  const [projeto, setProjeto] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchDados = async () => {
        const proj = await carregarProjetoAtivo();
        setProjeto(proj);
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

  if (!projeto) {
    return (
      <View style={styles.container}>
        <Text style={styles.txtCarregando}>Carregando lista...</Text>
      </View>
    );
  }

  const isDireto = projeto?.tipoCalculo === "direto";
  const isMisto = projeto?.tipoCalculo === "misto";
  const consumoBaseWh = ((projeto?.consumoDiretokWh || 0) * 1000) / 30;
  const consumoEquipamentosWh = (projeto?.inventario || []).reduce(
    (tot: number, item: any) =>
      tot + item.potenciaW * item.quantidade * item.horasUsoDia,
    0,
  );

  let consumoDiarioWh = 0;
  if (isDireto) consumoDiarioWh = consumoBaseWh;
  else if (isMisto) consumoDiarioWh = consumoBaseWh + consumoEquipamentosWh;
  else consumoDiarioWh = consumoEquipamentosWh;

  const regiao = REGIOES_SOLARES.find((r) => r.uf === projeto?.estado);
  const hsp = regiao ? regiao.hspMedio : 4.5;
  const eficienciaSistema = 0.75;
  const potenciaPicoWp =
    hsp > 0 ? consumoDiarioWh / (hsp * eficienciaSistema) : 0;
  const inversorKw = potenciaPicoWp / 1000;

  // Lógica dos Materiais com fallback inteligente
  const valorPlaca = projeto?.potenciaPlaca || 550;
  const qtdPlacas = Math.ceil(potenciaPicoWp / valorPlaca);

  const valorBateria = projeto?.capacidadeBateria || 220;
  const tensaoBancoV = 24;
  const diasAutonomia = 2;
  const profundidadeDescarga = 0.5;
  const capacidadeBateriasAh =
    (consumoDiarioWh * diasAutonomia) / (tensaoBancoV * profundidadeDescarga);

  const qtdBateriasSerie = tensaoBancoV / 12;
  const qtdStringsParalelo = Math.ceil(capacidadeBateriasAh / valorBateria);
  const totalBaterias = qtdBateriasSerie * qtdStringsParalelo;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={styles.cardConfig}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <MaterialCommunityIcons
            name="cog-outline"
            size={20}
            color="#0284C7"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.tituloCard}>Configurações de Compra</Text>
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.label}>Potência do Módulo Solar (W):</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={
              projeto?.potenciaPlaca ? String(projeto.potenciaPlaca) : "550"
            }
            onChangeText={(t) =>
              salvarAlteracoes({
                potenciaPlaca: parseFloat(t.replace(",", ".")) || 0,
              })
            }
            placeholder="Ex: 550"
          />
        </View>

        {!projeto?.temRede && (
          <View style={[styles.inputRow, { marginTop: 10 }]}>
            <Text style={styles.label}>Capacidade da Bateria 12V (Ah):</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={
                projeto?.capacidadeBateria
                  ? String(projeto.capacidadeBateria)
                  : "220"
              }
              onChangeText={(t) =>
                salvarAlteracoes({
                  capacidadeBateria: parseFloat(t.replace(",", ".")) || 0,
                })
              }
              placeholder="Ex: 220"
            />
          </View>
        )}
      </View>

      <View style={styles.cardLista}>
        <Text style={styles.tituloSecao}>Lista de Materiais (BoM)</Text>
        <Text style={styles.subtituloSecao}>
          Kit pré-dimensionado para {potenciaPicoWp.toFixed(0)} Wp
        </Text>

        <View style={styles.itemMaterial}>
          <MaterialCommunityIcons
            name="solar-panel-large"
            size={28}
            color="#0056B3"
            style={styles.iconeMaterial}
          />
          <View style={styles.infoMaterial}>
            <Text style={styles.nomeMaterial}>Módulos Fotovoltaicos</Text>
            <Text style={styles.detalheMaterial}>
              Placas de {valorPlaca}W para compor o arranjo.
            </Text>
          </View>
          <View style={styles.badgeQtd}>
            <Text style={styles.txtBadgeQtd}>{qtdPlacas} un</Text>
          </View>
        </View>

        <View style={styles.itemMaterial}>
          <MaterialCommunityIcons
            name="flash-outline"
            size={28}
            color="#0056B3"
            style={styles.iconeMaterial}
          />
          <View style={styles.infoMaterial}>
            <Text style={styles.nomeMaterial}>
              Inversor Solar ({projeto.temRede ? "On-Grid" : "Off-Grid"})
            </Text>
            <Text style={styles.detalheMaterial}>
              Potência mínima sugerida: {inversorKw.toFixed(2)} kW
            </Text>
          </View>
          <View style={styles.badgeQtd}>
            <Text style={styles.txtBadgeQtd}>1 un</Text>
          </View>
        </View>

        <View style={styles.itemMaterial}>
          <MaterialCommunityIcons
            name="home-roof"
            size={28}
            color="#0056B3"
            style={styles.iconeMaterial}
          />
          <View style={styles.infoMaterial}>
            <Text style={styles.nomeMaterial}>Estrutura de Fixação</Text>
            <Text style={styles.detalheMaterial}>
              Trilhos e ganchos dimensionados para {qtdPlacas} módulos.
            </Text>
          </View>
          <View style={styles.badgeQtd}>
            <Text style={styles.txtBadgeQtd}>1 kit</Text>
          </View>
        </View>

        {projeto.temRede && (
          <View style={styles.itemMaterial}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={28}
              color="#0056B3"
              style={styles.iconeMaterial}
            />
            <View style={styles.infoMaterial}>
              <Text style={styles.nomeMaterial}>
                Quadro de Proteção (String Box)
              </Text>
              <Text style={styles.detalheMaterial}>
                Proteção CA e CC integrada.
              </Text>
            </View>
            <View style={styles.badgeQtd}>
              <Text style={styles.txtBadgeQtd}>1 un</Text>
            </View>
          </View>
        )}

        <View style={styles.itemMaterial}>
          <MaterialCommunityIcons
            name="cable-data"
            size={28}
            color="#0056B3"
            style={styles.iconeMaterial}
          />
          <View style={styles.infoMaterial}>
            <Text style={styles.nomeMaterial}>Cabeamento e Conectores</Text>
            <Text style={styles.detalheMaterial}>
              Cabos solares e pares de conectores MC4 padrão.
            </Text>
          </View>
          <View style={styles.badgeQtd}>
            <Text style={styles.txtBadgeQtd}>1 kit</Text>
          </View>
        </View>

        {!projeto.temRede && (
          <View style={[styles.itemMaterial, { borderBottomWidth: 0 }]}>
            <MaterialCommunityIcons
              name="car-battery"
              size={28}
              color="#F59E0B"
              style={styles.iconeMaterial}
            />
            <View style={styles.infoMaterial}>
              <Text style={styles.nomeMaterial}>Banco de Baterias (12V)</Text>
              <Text style={styles.detalheMaterial}>
                Baterias de {valorBateria}Ah conectadas para fechar{" "}
                {tensaoBancoV}V.
              </Text>
            </View>
            <View
              style={[
                styles.badgeQtd,
                { backgroundColor: "#FFFBEB", borderColor: "#F59E0B" },
              ]}
            >
              <Text style={[styles.txtBadgeQtd, { color: "#D97706" }]}>
                {totalBaterias} un
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16 },
  txtCarregando: { textAlign: "center", marginTop: 50, color: "#64748B" },

  cardConfig: {
    backgroundColor: "#E0F2FE",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    marginBottom: 20,
  },
  tituloCard: { fontSize: 15, fontWeight: "bold", color: "#0284C7" },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { fontSize: 13, color: "#0369A1", fontWeight: "bold", flex: 1 },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#7DD3FC",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 100,
    textAlign: "center",
    fontWeight: "bold",
    color: "#0F172A",
  },

  cardLista: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    // @ts-ignore
    boxShadow:
      Platform.OS === "web" ? "0px 2px 4px rgba(0,0,0,0.02)" : undefined,
    elevation: 1,
  },
  tituloSecao: { fontSize: 18, fontWeight: "bold", color: "#1E293B" },
  subtituloSecao: { fontSize: 13, color: "#64748B", marginBottom: 20 },

  itemMaterial: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  iconeMaterial: { marginRight: 16, width: 32, textAlign: "center" },
  infoMaterial: { flex: 1, paddingRight: 10 },
  nomeMaterial: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 2,
  },
  detalheMaterial: { fontSize: 12, color: "#64748B" },

  badgeQtd: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  txtBadgeQtd: { fontWeight: "bold", color: "#334155", fontSize: 13 },
});
