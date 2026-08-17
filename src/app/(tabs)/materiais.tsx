// src/app/(tabs)/materiais.tsx
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Keyboard,
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
import { calcularSistema } from "../../utils/calculoSolar";
import { carregarProjetoAtivo } from "../../utils/storage";
import {
  obterPrecosLocais,
  salvarPrecosLocais,
} from "../../utils/storagePrecos";

export default function MateriaisScreen() {
  const router = useRouter();

  const [projeto, setProjeto] = useState<any>(null);
  const [tabelaPrecos, setTabelaPrecos] = useState<MaterialBase[]>([]);

  const [inputPotenciaPlaca, setInputPotenciaPlaca] = useState("");
  const [inputCapacidadeBateria, setInputCapacidadeBateria] = useState("");
  const [inputMaoDeObra, setInputMaoDeObra] = useState("");

  const [modalVisivel, setModalVisivel] = useState(false);
  const [precosEmEdicao, setPrecosEmEdicao] = useState<MaterialBase[]>([]);
  const [novoNomeItem, setNovoNomeItem] = useState("");
  const [novoPrecoItem, setNovoPrecoItem] = useState("");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchDados = async () => {
        const proj = await carregarProjetoAtivo();
        const precos = await obterPrecosLocais();

        if (!isActive) return;

        setProjeto((prevProjeto: any) => {
          const projetoMudou =
            JSON.stringify(prevProjeto) !== JSON.stringify(proj);
          if (projetoMudou) {
            setInputPotenciaPlaca(String(proj?.potenciaPlaca || 550));
            setInputCapacidadeBateria(String(proj?.capacidadeBateria || 220));
            setInputMaoDeObra(String(proj?.maoDeObra || 0));
            return proj;
          }
          return prevProjeto;
        });

        setTabelaPrecos((prev) =>
          JSON.stringify(prev) !== JSON.stringify(precos) ? precos : prev,
        );
      };

      fetchDados();
      return () => {
        isActive = false;
      };
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

  const abrirConfiguracaoPrecos = (sugestaoNome = "") => {
    setNovoNomeItem(sugestaoNome);
    const precosOrdenados = [...tabelaPrecos].sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );
    setPrecosEmEdicao(precosOrdenados);
    setModalVisivel(true);
  };

  const confirmarExclusaoItem = (id: string, nome: string) => {
    const msg = `Deseja excluir "${nome}" permanentemente da sua tabela?`;

    if (Platform.OS === "web") {
      if (window.confirm(msg)) {
        setPrecosEmEdicao((prev) => prev.filter((item) => item.id !== id));
      }
    } else {
      Alert.alert("Atenção", msg, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () =>
            setPrecosEmEdicao((prev) => prev.filter((item) => item.id !== id)),
        },
      ]);
    }
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
      Platform.OS === "web"
        ? window.alert("Preencha o nome e o preço do novo equipamento.")
        : Alert.alert(
            "Atenção",
            "Preencha o nome e o preço do novo equipamento.",
          );
      return;
    }
    const precoNum = parseFloat(novoPrecoItem.replace(",", ".")) || 0;
    const novoId = `mod_${Date.now()}`;
    const novoMaterial: MaterialBase = {
      id: novoId,
      nome: novoNomeItem.trim(),
      precoMedio: precoNum,
      medida: "unidade",
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
    setModalVisivel(false);
    Platform.OS === "web"
      ? window.alert("Sua tabela foi atualizada!")
      : Alert.alert("Sucesso", "Tabela atualizada!");
  };

  const handleBlurPlaca = () => {
    setTimeout(() => {
      setProjeto((p: any) => {
        setInputPotenciaPlaca(String(p?.potenciaPlaca || 550));
        return p;
      });
    }, 200);
  };

  const handleBlurBateria = () => {
    setTimeout(() => {
      setProjeto((p: any) => {
        setInputCapacidadeBateria(String(p?.capacidadeBateria || 220));
        return p;
      });
    }, 200);
  };

  const handleBlurMaoDeObra = () => {
    setTimeout(() => {
      setProjeto((p: any) => {
        setInputMaoDeObra(String(p?.maoDeObra || 0));
        return p;
      });
    }, 200);
  };

  // --- NOVA LÓGICA DE APLICAÇÃO COM BACKUP SEGURO ---
  const aplicarPlaca = async () => {
    Keyboard.dismiss();

    // 💡 1. Salva o backup ANTES de mexer no banco
    const valorAntigo = projeto?.potenciaPlaca || 550;
    const num = parseFloat(inputPotenciaPlaca.replace(",", ".")) || 550;

    // 💡 2. Verifica a tabela de preços primeiro
    const itemEncontrado = tabelaPrecos.find(
      (p) =>
        p.nome.toLowerCase().includes(`${num}w`) ||
        p.nome.toLowerCase().includes(`${num} w`),
    );

    // 💡 3. Se não encontrar, pergunta e trava o salvamento
    if (!itemEncontrado) {
      const msg = `O Módulo de ${num}W não foi encontrado na tabela de preços.\nDeseja cadastrá-lo agora para prosseguir?`;

      const acaoCancelar = () => {
        // Se cancelar, puxa o backup!
        setInputPotenciaPlaca(String(valorAntigo));
      };

      const acaoCadastrar = async () => {
        // Se confirmar, a gente salva e abre a tabela
        await salvarAlteracoes({ potenciaPlaca: num });
        setInputPotenciaPlaca(String(num));
        abrirConfiguracaoPrecos(`Módulo Solar Fotovoltaico ${num}W`);
      };

      if (Platform.OS === "web") {
        const querCadastrar = window.confirm(msg);
        if (querCadastrar) {
          acaoCadastrar();
        } else {
          acaoCancelar();
        }
      } else {
        Alert.alert("Produto Não Cadastrado", msg, [
          { text: "Cancelar", style: "cancel", onPress: acaoCancelar },
          { text: "Cadastrar", onPress: acaoCadastrar },
        ]);
      }
      return;
    }

    // 💡 4. Só salva no banco se tudo deu certo ou se for cadastrar
    await salvarAlteracoes({ potenciaPlaca: num });
    setInputPotenciaPlaca(String(num));
  };

  const aplicarBateria = async () => {
    Keyboard.dismiss();
    const num = parseFloat(inputCapacidadeBateria.replace(",", ".")) || 220;
    await salvarAlteracoes({ capacidadeBateria: num });
    setInputCapacidadeBateria(String(num));
  };

  const aplicarMaoDeObra = async () => {
    Keyboard.dismiss();
    const num = parseFloat(inputMaoDeObra.replace(",", ".")) || 0;
    await salvarAlteracoes({ maoDeObra: num });
    setInputMaoDeObra(String(num));
  };

  const irParaOrcamento = () => {
    Keyboard.dismiss();
    router.push("/orcamento");
  };

  if (!projeto)
    return (
      <View style={styles.container}>
        <Text style={styles.txtCarregando}>Carregando...</Text>
      </View>
    );

  const resultado = calcularSistema(projeto, tabelaPrecos);
  const {
    potenciaPicoWp,
    qtdPlacas,
    inversorKw,
    totalBaterias,
    precos: { pPlaca, pInversor, pEstrutura, pStringBox, pConector, pBateria },
  } = resultado;

  const maoDeObraLocal = parseFloat(projeto?.maoDeObra) || 0;
  const valorTotalEquipamentos =
    resultado.valorTotalProjeto - (resultado.maoDeObra || 0);
  const valorTotalCorreto = valorTotalEquipamentos + maoDeObraLocal;

  const valorPlaca = parseFloat(projeto?.potenciaPlaca) || 550;
  const placaAlterada =
    inputPotenciaPlaca !== String(projeto?.potenciaPlaca || 550);
  const bateriaAlterada =
    inputCapacidadeBateria !== String(projeto?.capacidadeBateria || 220);
  const maoDeObraAlterada = inputMaoDeObra !== String(projeto?.maoDeObra || 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.cardConfig}>
        <View style={styles.cabecalhoConfig}>
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
            onPress={() => abrirConfiguracaoPrecos()}
          >
            <FontAwesome5 name="edit" size={12} color="#FFF" />
            <Text style={styles.textoBotaoConfig}>Gerenciar Tabela</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.label}>Potência do Módulo (W):</Text>
          <View style={styles.grupoInputRecalcular}>
            <TextInput
              style={styles.inputComBotao}
              keyboardType="numeric"
              value={inputPotenciaPlaca}
              onChangeText={setInputPotenciaPlaca}
              onBlur={handleBlurPlaca}
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
              onPress={aplicarPlaca}
            >
              <MaterialCommunityIcons
                name="check"
                size={18}
                color={placaAlterada ? "#FFF" : "#94A3B8"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {!projeto?.temRede && (
          <View style={[styles.inputRow, { marginTop: 15 }]}>
            <Text style={styles.label}>Cap. da Bateria (Ah):</Text>
            <View style={styles.grupoInputRecalcular}>
              <TextInput
                style={styles.inputComBotao}
                keyboardType="numeric"
                value={inputCapacidadeBateria}
                onChangeText={setInputCapacidadeBateria}
                onBlur={handleBlurBateria}
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
                onPress={aplicarBateria}
              >
                <MaterialCommunityIcons
                  name="check"
                  size={18}
                  color={bateriaAlterada ? "#FFF" : "#94A3B8"}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={[styles.inputRow, { marginTop: 15 }]}>
          <Text style={styles.label}>Mão de Obra (R$):</Text>
          <View style={styles.grupoInputRecalcular}>
            <TextInput
              style={styles.inputComBotao}
              keyboardType="numeric"
              value={inputMaoDeObra}
              onChangeText={setInputMaoDeObra}
              onBlur={handleBlurMaoDeObra}
              placeholder="Ex: 1500"
            />
            <TouchableOpacity
              style={[
                styles.botaoRecalcular,
                maoDeObraAlterada
                  ? styles.botaoRecalcularAtivo
                  : styles.botaoRecalcularInativo,
              ]}
              disabled={!maoDeObraAlterada}
              onPress={aplicarMaoDeObra}
            >
              <MaterialCommunityIcons
                name="check"
                size={18}
                color={maoDeObraAlterada ? "#FFF" : "#94A3B8"}
              />
            </TouchableOpacity>
          </View>
        </View>
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
              Trilhos e ganchos dimensionados.
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
              Cabos solares e conectores MC4 padrão.
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
          <View style={styles.itemMaterial}>
            <MaterialCommunityIcons
              name="car-battery"
              size={28}
              color="#F59E0B"
              style={styles.iconeMaterial}
            />
            <View style={styles.infoMaterial}>
              <Text style={styles.nomeMaterial}>Banco de Baterias (12V)</Text>
              <Text style={styles.detalheMaterial}>
                Baterias conectadas para fechar 24V.
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

        {/* --- CARD VISUAL DE MÃO DE OBRA --- */}
        {maoDeObraLocal > 0 && (
          <View
            style={[
              styles.itemMaterial,
              {
                borderBottomWidth: 0,
                borderLeftWidth: 4,
                borderLeftColor: "#F59E0B",
                paddingLeft: 12,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="tools"
              size={28}
              color="#F59E0B"
              style={styles.iconeMaterial}
            />
            <View style={styles.infoMaterial}>
              <Text style={styles.nomeMaterial}>Serviço de Instalação</Text>
              <Text style={styles.detalheMaterial}>
                Mão de Obra do Projeto.
              </Text>
              <Text style={[styles.precoUnitario, { color: "#D97706" }]}>
                R$ {maoDeObraLocal.toFixed(2).replace(".", ",")} / serv
              </Text>
            </View>
            <View
              style={[
                styles.badgeQtd,
                { backgroundColor: "#FFFBEB", borderColor: "#F59E0B" },
              ]}
            >
              <Text style={[styles.txtBadgeQtd, { color: "#D97706" }]}>
                1 serv
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={{ marginTop: 25, marginBottom: 10, paddingHorizontal: 10 }}>
        <TouchableOpacity
          style={styles.botaoOrcamento}
          activeOpacity={0.8}
          onPress={irParaOrcamento}
        >
          <FontAwesome5
            name="file-invoice-dollar"
            size={20}
            color="#FFF"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.textoBotaoOrcamento}>
            Ver Orçamento: R$ {valorTotalCorreto.toFixed(2).replace(".", ",")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- MODAL DA TABELA --- */}
      <Modal
        visible={modalVisivel}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text
                style={{ fontSize: 18, fontWeight: "bold", color: "#1E293B" }}
              >
                Tabela de Preços Ativa
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisivel(false)}
                style={styles.botaoFecharModal}
              >
                <FontAwesome5 name="times" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>

            <View style={styles.cardNovoItem}>
              <Text style={styles.tituloNovoItem}>
                ➕ Cadastrar Novo Produto
              </Text>
              <TextInput
                style={styles.inputNovoNome}
                placeholder="Ex: Módulo 400W"
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
                Produtos Cadastrados:
              </Text>
              {precosEmEdicao.map((item) => {
                const precoFormatado = (item.precoMedio || 0)
                  .toString()
                  .replace(".", ",");
                return (
                  <View key={item.id} style={styles.modalItemRow}>
                    <Text style={styles.modalItemName} numberOfLines={2}>
                      {item.nome}
                    </Text>
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
                      <TouchableOpacity
                        style={{ marginLeft: 8 }}
                        onPress={() =>
                          confirmarExclusaoItem(item.id, item.nome)
                        }
                      >
                        <MaterialCommunityIcons
                          name="close-circle"
                          size={24}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.botaoSalvarModal}
              onPress={salvarNovosPrecos}
            >
              <Text style={styles.textoBotaoSalvar}>Salvar Alterações</Text>
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
  cabecalhoConfig: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
    width: "95%",
    maxWidth: 500,
    maxHeight: "85%",
    padding: 20,
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 15,
    marginBottom: 10,
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
  modalItemName: { flex: 1, fontSize: 13, color: "#374151", paddingRight: 8 },
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
  botaoSalvarModal: {
    backgroundColor: "#F59E0B",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  textoBotaoSalvar: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
