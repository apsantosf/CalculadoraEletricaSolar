// src/app/(tabs)/materiais.tsx
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialBase } from "../../data/tabelaMateriais";
import { calcularSistema } from "../../utils/calculoSolar"; // 💡 NOSSO MOTOR CENTRAL INTEGRADO
import { carregarProjetoAtivo } from "../../utils/storage";
import {
  obterPrecosLocais,
  salvarPrecosLocais,
} from "../../utils/storagePrecos";

const CHAVE_CIDADE = "@EletricaSolar_Cidade";

export default function MateriaisScreen() {
  const [projeto, setProjeto] = useState<any>(null);
  const [tabelaPrecos, setTabelaPrecos] = useState<MaterialBase[]>([]);
  const [cidade, setCidade] = useState<string>("Projeto Atual");

  const [inputPotenciaPlaca, setInputPotenciaPlaca] = useState("");
  const [inputCapacidadeBateria, setInputCapacidadeBateria] = useState("");

  const clicouNoBotaoPlaca = useRef(false);
  const clicouNoBotaoBateria = useRef(false);

  const [modalVisivel, setModalVisivel] = useState(false);
  const [precosEmEdicao, setPrecosEmEdicao] = useState<MaterialBase[]>([]);
  const [cidadeEmEdicao, setCidadeEmEdicao] = useState<string>("");
  const [novoNomeItem, setNovoNomeItem] = useState("");
  const [novoPrecoItem, setNovoPrecoItem] = useState("");
  const [novaMedidaItem, setNovaMedidaItem] = useState<
    "unidade" | "metro" | "kit" | "par"
  >("unidade");

  useFocusEffect(
    useCallback(() => {
      const fetchDados = async () => {
        const proj = await carregarProjetoAtivo();
        setProjeto(proj);

        setInputPotenciaPlaca(String(proj?.potenciaPlaca || 550));
        setInputCapacidadeBateria(String(proj?.capacidadeBateria || 220));

        const precos = await obterPrecosLocais();
        setTabelaPrecos(precos);
        const cidadeSalva = await AsyncStorage.getItem(CHAVE_CIDADE);
        if (cidadeSalva) setCidade(cidadeSalva);
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

  const validarPotenciaPlaca = () => {
    const num = parseFloat(inputPotenciaPlaca.replace(",", "."));
    if (isNaN(num) || num <= 0) {
      Platform.OS === "web"
        ? window.alert("A potência da placa não pode ficar vazia ou zerada!")
        : Alert.alert(
            "Atenção",
            "A potência da placa não pode ficar vazia ou zerada!",
          );
      setInputPotenciaPlaca(String(projeto?.potenciaPlaca || 550));
      return;
    }

    const idBusca = `mod_${num}w`;
    const itemEncontrado = tabelaPrecos.find(
      (p) =>
        p.id === idBusca ||
        p.nome.toLowerCase().includes(`${num}w`) ||
        p.nome.toLowerCase().includes(`${num} W`),
    );

    if (!itemEncontrado) {
      const mensagem = `Não encontramos um Módulo de ${num}W na sua Tabela de Preços. Deseja cadastrá-lo agora?`;

      if (Platform.OS === "web") {
        if (window.confirm(mensagem)) {
          abrirConfiguracaoPrecosComPreenchimentoAuto(
            `Módulo Solar Fotovoltaico ${num}W`,
            idBusca,
          );
        } else {
          setInputPotenciaPlaca(String(projeto?.potenciaPlaca || 550));
        }
      } else {
        Alert.alert("Produto Não Cadastrado", mensagem, [
          {
            text: "Cancelar",
            onPress: () =>
              setInputPotenciaPlaca(String(projeto?.potenciaPlaca || 550)),
            style: "cancel",
          },
          {
            text: "Cadastrar",
            onPress: () =>
              abrirConfiguracaoPrecosComPreenchimentoAuto(
                `Módulo Solar Fotovoltaico ${num}W`,
                idBusca,
              ),
          },
        ]);
      }
      return;
    }

    salvarAlteracoes({ potenciaPlaca: num });
    setInputPotenciaPlaca(String(num));
  };

  const validarCapacidadeBateria = () => {
    const num = parseFloat(inputCapacidadeBateria.replace(",", "."));
    if (isNaN(num) || num <= 0) {
      Platform.OS === "web"
        ? window.alert(
            "A capacidade da bateria não pode ficar vazia ou zerada!",
          )
        : Alert.alert(
            "Atenção",
            "A capacidade da bateria não pode ficar vazia ou zerada!",
          );
      setInputCapacidadeBateria(String(projeto?.capacidadeBateria || 220));
    } else {
      salvarAlteracoes({ capacidadeBateria: num });
      setInputCapacidadeBateria(String(num));
    }
  };

  const lidarComPerdaFocoPlaca = () => {
    setTimeout(() => {
      if (clicouNoBotaoPlaca.current) {
        clicouNoBotaoPlaca.current = false;
        return;
      }

      const placaAlterada =
        inputPotenciaPlaca !== String(projeto?.potenciaPlaca || 550);
      if (placaAlterada) {
        if (Platform.OS === "web") {
          window.alert(
            "Você alterou a potência da placa, mas não clicou no botão de recalcular. O valor será aplicado agora.",
          );
          validarPotenciaPlaca();
        } else {
          Alert.alert(
            "Alteração Pendente",
            "Você alterou a potência, mas não clicou em Recalcular. Deseja aplicar?",
            [
              {
                text: "Descartar",
                onPress: () =>
                  setInputPotenciaPlaca(String(projeto?.potenciaPlaca || 550)),
              },
              { text: "Aplicar", onPress: validarPotenciaPlaca },
            ],
          );
        }
      }
    }, 200);
  };

  const lidarComPerdaFocoBateria = () => {
    setTimeout(() => {
      if (clicouNoBotaoBateria.current) {
        clicouNoBotaoBateria.current = false;
        return;
      }

      const bateriaAlterada =
        inputCapacidadeBateria !== String(projeto?.capacidadeBateria || 220);
      if (bateriaAlterada) {
        if (Platform.OS === "web") {
          window.alert(
            "Você alterou a capacidade da bateria, mas não clicou no botão de recalcular. O valor será aplicado agora.",
          );
          validarCapacidadeBateria();
        } else {
          Alert.alert(
            "Alteração Pendente",
            "Você alterou a bateria, mas não clicou em Recalcular. Deseja aplicar?",
            [
              {
                text: "Descartar",
                onPress: () =>
                  setInputCapacidadeBateria(
                    String(projeto?.capacidadeBateria || 220),
                  ),
              },
              { text: "Aplicar", onPress: validarCapacidadeBateria },
            ],
          );
        }
      }
    }, 200);
  };

  const abrirConfiguracaoPrecos = () => {
    setCidadeEmEdicao(cidade);
    const precosOrdenados = [...tabelaPrecos].sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );
    setPrecosEmEdicao(precosOrdenados);
    setModalVisivel(true);
  };

  const abrirConfiguracaoPrecosComPreenchimentoAuto = (
    nomeSugerido: string,
    novoId: string,
  ) => {
    setCidadeEmEdicao(cidade);
    const precosOrdenados = [...tabelaPrecos].sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );
    setPrecosEmEdicao(precosOrdenados);
    setNovoNomeItem(nomeSugerido);
    setModalVisivel(true);
  };

  const atualizarPrecoEditado = (id: string, novoValor: string) => {
    const limpo = novoValor.replace(/[^0-9,]/g, "");
    const valorNumerico = parseFloat(limpo.replace(",", ".")) || 0;
    setPrecosEmEdicao((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, precoMedio: valorNumerico } : item,
      ),
    );
  };

  const adicionarItemCustomizado = () => {
    if (!novoNomeItem.trim() || !novoPrecoItem.trim()) {
      Alert.alert("Atenção", "Preencha o nome e o preço do novo equipamento.");
      return;
    }
    const precoNum = parseFloat(novoPrecoItem.replace(",", ".")) || 0;
    const novoId = `mod_${Date.now()}`;
    const novoMaterial: MaterialBase = {
      id: novoId,
      nome: novoNomeItem.trim(),
      precoMedio: precoNum,
      medida: novaMedidaItem,
      categoria: "modulo",
    };
    setPrecosEmEdicao((prev) =>
      [...prev, novoMaterial].sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR"),
      ),
    );
    setNovoNomeItem("");
    setNovoPrecoItem("");
  };

  const salvarNovosPrecos = async () => {
    setTabelaPrecos(precosEmEdicao);
    await salvarPrecosLocais(precosEmEdicao);
    if (cidadeEmEdicao) {
      setCidade(cidadeEmEdicao);
      await AsyncStorage.setItem(CHAVE_CIDADE, cidadeEmEdicao);
    }
    setModalVisivel(false);
    Platform.OS === "web"
      ? window.alert("Sua tabela de preços foi atualizada!")
      : Alert.alert("Sucesso", "Sua tabela de preços foi atualizada!");
  };

  if (!projeto) {
    return (
      <View style={styles.container}>
        <Text style={styles.txtCarregando}>Carregando lista...</Text>
      </View>
    );
  }

  // 💡 USANDO O NOSSO MOTOR CENTRALIZADO DE CÁLCULO
  const resultado = calcularSistema(projeto, tabelaPrecos);
  const {
    potenciaPicoWp,
    qtdPlacas,
    inversorKw,
    totalBaterias,
    valorTotalBoM,
    precos: { pPlaca, pInversor, pEstrutura, pStringBox, pConector, pBateria },
  } = resultado;

  const valorPlaca = projeto?.potenciaPlaca || 550;
  const valorBateria = projeto?.capacidadeBateria || 220;

  const placaAlterada =
    inputPotenciaPlaca !== String(projeto?.potenciaPlaca || 550);
  const bateriaAlterada =
    inputCapacidadeBateria !== String(projeto?.capacidadeBateria || 220);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.cardConfig}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialCommunityIcons
              name="cog-outline"
              size={20}
              color="#0284C7"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.tituloCard}>Configuração / Preços</Text>
          </View>
          <TouchableOpacity
            style={styles.botaoConfig}
            onPress={abrirConfiguracaoPrecos}
          >
            <FontAwesome5 name="edit" size={12} color="#FFF" />
            <Text style={styles.textoBotaoConfig}>Tabela de Preços</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.label}>Potência do Módulo Solar (W):</Text>
          <View style={styles.grupoInputRecalcular}>
            <TextInput
              style={styles.inputComBotao}
              keyboardType="numeric"
              value={inputPotenciaPlaca}
              onChangeText={setInputPotenciaPlaca}
              onBlur={lidarComPerdaFocoPlaca}
              placeholder="Ex: 550"
            />
            <TouchableOpacity
              style={[
                styles.botaoRecalcular,
                placaAlterada
                  ? styles.botaoRecalcularAtivo
                  : styles.botaoRecalcularInativo,
              ]}
              disabled={!placaAlterada}
              onPressIn={() => {
                clicouNoBotaoPlaca.current = true;
              }}
              onPress={validarPotenciaPlaca}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={18}
                color={placaAlterada ? "#FFF" : "#94A3B8"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {!projeto?.temRede && (
          <View style={[styles.inputRow, { marginTop: 15 }]}>
            <Text style={styles.label}>Capacidade da Bateria 12V (Ah):</Text>
            <View style={styles.grupoInputRecalcular}>
              <TextInput
                style={styles.inputComBotao}
                keyboardType="numeric"
                value={inputCapacidadeBateria}
                onChangeText={setInputCapacidadeBateria}
                onBlur={lidarComPerdaFocoBateria}
                placeholder="Ex: 220"
              />
              <TouchableOpacity
                style={[
                  styles.botaoRecalcular,
                  bateriaAlterada
                    ? styles.botaoRecalcularAtivo
                    : styles.botaoRecalcularInativo,
                ]}
                disabled={!bateriaAlterada}
                onPressIn={() => {
                  clicouNoBotaoBateria.current = true;
                }}
                onPress={validarCapacidadeBateria}
              >
                <MaterialCommunityIcons
                  name="refresh"
                  size={18}
                  color={bateriaAlterada ? "#FFF" : "#94A3B8"}
                />
              </TouchableOpacity>
            </View>
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
            <Text style={styles.precoUnitario}>
              R$ {pPlaca.toFixed(2).replace(".", ",")} / und
            </Text>
          </View>
          <View style={styles.badgeQtd}>
            <Text style={styles.txtBadgeQtd}>{qtdPlacas} und</Text>
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
            <Text style={styles.precoUnitario}>
              R$ {pInversor.toFixed(2).replace(".", ",")} / und
            </Text>
          </View>
          <View style={styles.badgeQtd}>
            <Text style={styles.txtBadgeQtd}>1 und</Text>
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
            <Text style={styles.precoUnitario}>
              R$ {pEstrutura.toFixed(2).replace(".", ",")} / conj.
            </Text>
          </View>
          <View style={styles.badgeQtd}>
            <Text style={styles.txtBadgeQtd}>1 conj.</Text>
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
              <Text style={styles.precoUnitario}>
                R$ {pStringBox.toFixed(2).replace(".", ",")} / und
              </Text>
            </View>
            <View style={styles.badgeQtd}>
              <Text style={styles.txtBadgeQtd}>1 und</Text>
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
            <Text style={styles.precoUnitario}>
              Ref: R$ {pConector.toFixed(2).replace(".", ",")} / par
            </Text>
          </View>
          <View style={styles.badgeQtd}>
            <Text style={styles.txtBadgeQtd}>1 conj.</Text>
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
                Baterias de {valorBateria}Ah conectadas para fechar 24V.
              </Text>
              <Text style={styles.precoUnitario}>
                R$ {pBateria.toFixed(2).replace(".", ",")} / und
              </Text>
            </View>
            <View
              style={[
                styles.badgeQtd,
                { backgroundColor: "#FFFBEB", borderColor: "#F59E0B" },
              ]}
            >
              <Text style={[styles.txtBadgeQtd, { color: "#D97706" }]}>
                {totalBaterias} und
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={{ marginTop: 25, marginBottom: 10, paddingHorizontal: 10 }}>
        <Link href="/orcamento" asChild>
          <TouchableOpacity style={styles.botaoOrcamento} activeOpacity={0.8}>
            <FontAwesome5
              name="file-invoice-dollar"
              size={20}
              color="#FFF"
              style={{ marginRight: 10 }}
            />
            <Text style={styles.textoBotaoOrcamento}>
              Ver Orçamento: R$ {valorTotalBoM.toFixed(2).replace(".", ",")}
            </Text>
          </TouchableOpacity>
        </Link>
      </View>

      <Modal
        visible={modalVisivel}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.grupoEdicaoCidade}>
                <Text style={styles.labelCidade}>
                  Nome do Projeto / Cliente:
                </Text>
                <TextInput
                  style={styles.inputCidade}
                  value={cidadeEmEdicao}
                  onChangeText={setCidadeEmEdicao}
                  placeholder="Ex: Projeto Residência Silva"
                />
              </View>
              <TouchableOpacity
                onPress={() => setModalVisivel(false)}
                style={styles.botaoFecharModal}
              >
                <FontAwesome5 name="times" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.cardNovoItem}>
              <Text style={styles.tituloNovoItem}>
                ➕ Cadastrar Novo Material
              </Text>
              <TextInput
                style={styles.inputNovoNome}
                placeholder="Ex: Trilho de Alumínio 4,40m"
                value={novoNomeItem}
                onChangeText={setNovoNomeItem}
              />
              <View style={styles.rowNovoItem}>
                <TextInput
                  style={styles.inputNovoPreco}
                  placeholder="Preço (R$)"
                  keyboardType="numeric"
                  value={novoPrecoItem}
                  onChangeText={setNovoPrecoItem}
                />
                <TouchableOpacity
                  style={styles.botaoAdicionarNovoItem}
                  onPress={adicionarItemCustomizado}
                >
                  <Text style={styles.textoBotaoAdicionarNovo}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.subtituloEdicaoPrecos}>
                Sua Tabela de Preços Atuais (Ordem Alfabética):
              </Text>
              {precosEmEdicao.map((item) => {
                const sufixo =
                  item.medida === "metro"
                    ? "m"
                    : item.medida === "par"
                      ? "prs"
                      : item.medida === "kit"
                        ? "conjs"
                        : "und";
                const precoFormatado = (item.precoMedio || 0)
                  .toString()
                  .replace(".", ",");
                return (
                  <View key={item.id} style={styles.modalItemRow}>
                    <Text style={styles.modalItemName}>{item.nome}</Text>
                    <View style={styles.modalInputGroup}>
                      <Text style={styles.modalCurrency}>R$</Text>
                      <TextInput
                        style={styles.modalInputPreco}
                        keyboardType="numeric"
                        value={precoFormatado}
                        onChangeText={(texto) =>
                          atualizarPrecoEditado(item.id, texto)
                        }
                      />
                      <Text style={styles.modalSufixo}>/ {sufixo}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.botaoSalvarModal}
              onPress={salvarNovosPrecos}
            >
              <Text style={styles.textoBotaoSalvar}>Salvar Minha Tabela</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  botaoConfig: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#208AEF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  textoBotaoConfig: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFF",
    marginLeft: 6,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  label: {
    fontSize: 13,
    color: "#0369A1",
    fontWeight: "bold",
    flex: 1,
    marginRight: 8,
  },
  grupoInputRecalcular: {
    flexDirection: "row",
    alignItems: "center",
    width: 125,
    height: 38,
  },
  inputComBotao: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#7DD3FC",
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    paddingHorizontal: 4,
    height: 38,
    width: 85,
    textAlign: "center",
    fontWeight: "bold",
    color: "#0F172A",
    borderRightWidth: 0,
  },
  botaoRecalcular: {
    height: 38,
    width: 40,
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
  },
  botaoRecalcularAtivo: { backgroundColor: "#10B981", borderColor: "#059669" },
  botaoRecalcularInativo: {
    backgroundColor: "#E2E8F0",
    borderColor: "#7DD3FC",
  },
  cardLista: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
  precoUnitario: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "bold",
    marginTop: 4,
  },
  badgeQtd: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  txtBadgeQtd: { fontWeight: "bold", color: "#334155", fontSize: 13 },
  botaoOrcamento: {
    backgroundColor: "#208AEF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
    elevation: 3,
  },
  textoBotaoOrcamento: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    maxWidth: 500,
    maxHeight: "85%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 15,
    marginBottom: 10,
  },
  grupoEdicaoCidade: { flex: 1 },
  labelCidade: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
    fontWeight: "600",
  },
  inputCidade: {
    height: 40,
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    fontSize: 14,
    fontWeight: "bold",
  },
  botaoFecharModal: { padding: 4 },
  cardNovoItem: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  tituloNovoItem: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#166534",
    marginBottom: 6,
  },
  inputNovoNome: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 36,
    marginBottom: 6,
  },
  rowNovoItem: { flexDirection: "row", gap: 8 },
  inputNovoPreco: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 36,
    width: 90,
  },
  botaoAdicionarNovoItem: {
    flex: 1,
    backgroundColor: "#16a34a",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    height: 36,
  },
  textoBotaoAdicionarNovo: { color: "#fff", fontWeight: "bold" },
  subtituloEdicaoPrecos: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#4b5563",
    marginBottom: 6,
  },
  modalScroll: { flex: 1 },
  modalItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalItemName: { flex: 1, fontSize: 13, color: "#374151" },
  modalInputGroup: { flexDirection: "row", alignItems: "center" },
  modalCurrency: { fontSize: 13, color: "#6b7280", marginRight: 4 },
  modalInputPreco: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    width: 70,
    height: 36,
    textAlign: "center",
    fontWeight: "bold",
  },
  modalSufixo: { fontSize: 12, color: "#9ca3af", width: 30, marginLeft: 4 },
  botaoSalvarModal: {
    backgroundColor: "#F59E0B",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  textoBotaoSalvar: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
