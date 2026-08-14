// src/app/orcamento.tsx
import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import { Stack, router, useFocusEffect } from "expo-router";
import * as Sharing from "expo-sharing";
import { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import CustomHeader from "../components/ui/CustomHeader";
import { MaterialBase } from "../data/tabelaMateriais";
import { calcularSistema } from "../utils/calculoSolar";
import { carregarProjetoAtivo } from "../utils/storage";
import { obterPrecosLocais } from "../utils/storagePrecos";

const CHAVE_CARRINHO = "@EletricaSolar_Carrinho_V1";
const CHAVE_CIDADE = "@EletricaSolar_Cidade";

export default function ScreenOrcamento() {
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [tabelaPrecos, setTabelaPrecos] = useState<MaterialBase[]>([]);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [cidade, setCidade] = useState<string>("Projeto Atual");

  useFocusEffect(
    useCallback(() => {
      const inicializarBD = async () => {
        const precos = await obterPrecosLocais();
        setTabelaPrecos(precos);

        const cidadeSalva = await AsyncStorage.getItem(CHAVE_CIDADE);
        if (cidadeSalva) setCidade(cidadeSalva);

        let quantidadesAtuais: Record<string, number> = {};
        const carrinhoSalvo = await AsyncStorage.getItem(CHAVE_CARRINHO);
        if (carrinhoSalvo) quantidadesAtuais = JSON.parse(carrinhoSalvo);

        const proj = await carregarProjetoAtivo();
        if (proj) {
          const resultado = calcularSistema(proj, precos);
          const { qtdPlacas, inversorKw, totalBaterias } = resultado;
          const sistemaIsolado = !proj.temRede;
          const valorPlaca = proj.potenciaPlaca || 550;

          // Identifica o ID exato da placa ativa
          const idPlacaDinamico =
            precos.find(
              (p) =>
                p.id === `mod_${valorPlaca}w` ||
                p.nome.toLowerCase().includes(`${valorPlaca}w`) ||
                p.nome.toLowerCase().includes(`${valorPlaca} W`),
            )?.id || `mod_${valorPlaca}w`;

          // 💡 Zera todos os outros módulos da tabela para evitar duplicidade fantasma
          precos.forEach((item) => {
            if (item.id.startsWith("mod_") || item.categoria === "modulo") {
              quantidadesAtuais[item.id] = 0;
            }
          });

          if (qtdPlacas > 0) {
            quantidadesAtuais[idPlacaDinamico] = qtdPlacas;
            quantidadesAtuais["est_ceramico"] = Math.ceil(qtdPlacas / 4);
            if (!sistemaIsolado) {
              quantidadesAtuais["string_box_1"] = 1;
            }
            quantidadesAtuais["conector_mc4"] = 2;
          }

          if (inversorKw > 0) {
            if (sistemaIsolado) {
              quantidadesAtuais["inv_off_3kw"] = 1;
              quantidadesAtuais["bat_est_220ah"] = totalBaterias;
            } else {
              // Zera inversores antigos antes de definir o novo
              ["inv_3kw", "inv_5kw", "inv_10kw"].forEach((invId) => {
                quantidadesAtuais[invId] = 0;
              });
              if (inversorKw <= 3) quantidadesAtuais["inv_3kw"] = 1;
              else if (inversorKw <= 5) quantidadesAtuais["inv_5kw"] = 1;
              else quantidadesAtuais["inv_10kw"] = 1;
            }
          }
        }

        setQuantidades(quantidadesAtuais);
        await AsyncStorage.setItem(
          CHAVE_CARRINHO,
          JSON.stringify(quantidadesAtuais),
        );
      };

      inicializarBD();
    }, []),
  );

  const atualizarQuantidade = async (id: string, valor: string) => {
    const limpo = valor.replace(/[^0-9]/g, "");
    const num = parseInt(limpo) || 0;
    const novasQuantidades = { ...quantidades, [id]: num };
    setQuantidades(novasQuantidades);
    await AsyncStorage.setItem(
      CHAVE_CARRINHO,
      JSON.stringify(novasQuantidades),
    );
  };

  const valorTotal = tabelaPrecos.reduce(
    (acc, item) => acc + (quantidades[item.id] || 0) * (item.precoMedio || 0),
    0,
  );

  const materiaisVisiveis = [...tabelaPrecos]
    .filter((item) => mostrarTodos || (quantidades[item.id] || 0) > 0)
    .sort((a, b) => {
      const categoriaA = a.categoria || "";
      const categoriaB = b.categoria || "";
      return categoriaA.localeCompare(categoriaB, "pt-BR");
    });

  const gerarPdfOrcamento = async () => {
    try {
      const itensHtml = materiaisVisiveis
        .map((item) => {
          const qtd = quantidades[item.id] || 0;
          if (qtd === 0 && !mostrarTodos) return "";
          const preco = item.precoMedio || 0;
          const subtotal = qtd * preco;
          const sufixo =
            item.medida === "metro"
              ? "m"
              : item.medida === "par"
                ? "prs"
                : item.medida === "kit"
                  ? "conjs"
                  : "und";

          return `
            <tr>
              <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px;">${item.nome}</td>
              <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #4b5563; font-size: 14px;">${qtd} ${sufixo}</td>
              <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #4b5563; font-size: 14px;">R$ ${preco.toFixed(2).replace(".", ",")}</td>
              <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #059669; font-size: 14px;">R$ ${subtotal.toFixed(2).replace(".", ",")}</td>
            </tr>
          `;
        })
        .join("");

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Orçamento - Elétrica Solar</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 30px; color: #1f2937; margin: 0; }
              .header-top { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #F59E0B; padding-bottom: 15px; }
              .title { font-size: 22px; font-weight: bold; color: #208AEF; text-transform: uppercase; }
              .subtitle { font-size: 13px; color: #6b7280; margin-top: 6px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th { background-color: #f3f4f6; padding: 12px 10px; text-align: left; font-size: 13px; border-bottom: 2px solid #d1d5db; }
              th:nth-child(2) { text-align: center; }
              th:nth-child(3), th:nth-child(4) { text-align: right; }
              .total-box { margin-top: 25px; border-top: 2px solid #F59E0B; padding-top: 15px; text-align: right; font-size: 18px; font-weight: bold; color: #208AEF; }
            </style>
          </head>
          <body>
            <div class="header-top">
              <div class="title">☀️ Orçamento - Sistema Fotovoltaico</div>
              <div class="subtitle">Projeto: ${cidade}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Equipamento / Material</th>
                  <th>Qtd</th>
                  <th>Preço Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itensHtml}
              </tbody>
            </table>
            <div class="total-box">
              VALOR TOTAL ESTIMADO: R$ ${valorTotal.toFixed(2).replace(".", ",")}
            </div>
          </body>
        </html>
      `;

      if (Platform.OS === "web") {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert("Sucesso", "PDF gerado!");
        }
      }
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <CustomHeader
        title="Orçamento Financeiro"
        onBackPress={() => {
          if (mostrarTodos) {
            setMostrarTodos(false);
          } else {
            router.back();
          }
        }}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.content}
      >
        <View style={styles.cabecalhoSecao}>
          <Text style={styles.tituloSecao}>Itens do Gerador Fotovoltaico</Text>
        </View>

        {materiaisVisiveis.map((item) => {
          const qtdAtual = quantidades[item.id] || 0;
          const preco = item.precoMedio || 0;
          const subtotal = qtdAtual * preco;
          const sufixo =
            item.medida === "metro"
              ? "m"
              : item.medida === "par"
                ? "prs"
                : item.medida === "kit"
                  ? "conjs"
                  : "und";

          return (
            <View key={item.id} style={styles.cardMaterial}>
              <View style={styles.infoMaterial}>
                <Text style={styles.nomeMaterial}>{item.nome}</Text>
                <Text style={styles.precoUnidade}>
                  R$ {preco.toFixed(2).replace(".", ",")} / {sufixo}
                </Text>
              </View>
              <View style={styles.controles}>
                <View style={styles.grupoInput}>
                  <TextInput
                    style={styles.inputQtd}
                    keyboardType="numeric"
                    value={qtdAtual === 0 ? "" : qtdAtual.toString()}
                    onChangeText={(texto) =>
                      atualizarQuantidade(item.id, texto)
                    }
                    placeholder="0"
                  />
                  <Text style={styles.textoSufixoInput}>{sufixo}</Text>
                </View>
                <Text style={styles.textoSubtotal}>
                  R$ {subtotal.toFixed(2).replace(".", ",")}
                </Text>
              </View>
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.botaoMostrarMais}
          onPress={() => setMostrarTodos(!mostrarTodos)}
        >
          <Text style={styles.textoBotaoMostrarMais}>
            {mostrarTodos
              ? "Ocultar itens zerados"
              : "+ Adicionar Outros Materiais"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botaoPdf} onPress={gerarPdfOrcamento}>
          <FontAwesome5
            name="file-pdf"
            size={16}
            color="#ffffff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.textoBotaoPdf}>Gerar Orçamento em PDF</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footerTotal}>
        <Text style={styles.textoTotalLabel}>Total dos Equipamentos:</Text>
        <Text style={styles.textoTotalValor}>
          R$ {valorTotal.toFixed(2).replace(".", ",")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  scrollArea: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 30,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  cabecalhoSecao: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tituloSecao: { fontSize: 16, fontWeight: "bold", color: "#374151", flex: 1 },
  cardMaterial: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 1,
  },
  infoMaterial: { flex: 1, paddingRight: 10 },
  nomeMaterial: { fontSize: 14, fontWeight: "600", color: "#1f2937" },
  precoUnidade: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  controles: { alignItems: "flex-end" },
  grupoInput: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  inputQtd: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    width: 50,
    height: 36,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    color: "#208AEF",
  },
  textoSufixoInput: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
    width: 35,
  },
  textoSubtotal: { fontSize: 13, fontWeight: "bold", color: "#059669" },
  botaoMostrarMais: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#e0e7ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  textoBotaoMostrarMais: { color: "#208AEF", fontSize: 15, fontWeight: "bold" },
  botaoPdf: {
    marginTop: 14,
    backgroundColor: "#F59E0B",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  textoBotaoPdf: { color: "#ffffff", fontSize: 15, fontWeight: "bold" },
  footerTotal: {
    backgroundColor: "#208AEF",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textoTotalLabel: { color: "#fff", fontSize: 16, fontWeight: "600" },
  textoTotalValor: { color: "#fff", fontSize: 20, fontWeight: "bold" },
});
