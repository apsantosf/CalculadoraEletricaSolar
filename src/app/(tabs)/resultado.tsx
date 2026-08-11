// src/app/(tabs)/resultado.tsx
import * as Print from "expo-print";
import { useFocusEffect } from "expo-router";
import * as Sharing from "expo-sharing";
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
import { calcularOffGrid, calcularOnGrid } from "../../core/dimensionamento";
import { carregarProjetoAtivo } from "../../utils/storage";

export default function ResultadoScreen() {
  const [consumoDiarioTotal, setConsumoDiarioTotal] = useState(0);
  const [nomeProjeto, setNomeProjeto] = useState("Meu Projeto Solar");

  useFocusEffect(
    useCallback(() => {
      const fetchDados = async () => {
        const projeto = await carregarProjetoAtivo();
        setNomeProjeto(projeto.nome);

        if (projeto.inventario && projeto.inventario.length > 0) {
          const total = projeto.inventario.reduce(
            (acc: number, item: any) =>
              acc + item.potenciaW * item.quantidade * item.horasUsoDia,
            0,
          );
          setConsumoDiarioTotal(total);
        } else {
          setConsumoDiarioTotal(0);
        }
      };
      fetchDados();
    }, []),
  );

  const consumoMensalKwh = (consumoDiarioTotal / 1000) * 30;
  const HSP_REGIAO = 4.5;
  const dadosOnGrid = calcularOnGrid(consumoMensalKwh, HSP_REGIAO);
  const dadosOffGrid = calcularOffGrid(consumoDiarioTotal);

  const gerarPDF = async () => {
    const dataAtual = new Date().toLocaleDateString("pt-BR");
    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Memorial Descritivo - Elétrica Solar</title>
          <style>
            @page { margin: 10mm; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #2c3e50; line-height: 1.4; font-size: 13px; margin: 0; padding: 15px; }
            .header-container { border-bottom: 3px solid #FFD700; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .logo-area h1 { margin: 0; font-size: 20px; color: #111; text-transform: uppercase; letter-spacing: 0.5px; }
            .logo-area p { margin: 2px 0 0 0; font-size: 11px; color: #666; }
            .meta-info { text-align: right; font-size: 11px; color: #555; }
            .section-title { font-size: 14px; font-weight: bold; color: #004085; background-color: #E8F4FD; padding: 6px 10px; border-left: 4px solid #007BFF; margin-top: 20px; margin-bottom: 10px; text-transform: uppercase; }
            .summary-box { background-color: #f8f9fa; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 15px; }
            .summary-grid { display: table; width: 100%; }
            .summary-item { display: table-cell; text-align: center; padding: 5px; }
            .summary-value { font-size: 16px; font-weight: bold; color: #004085; }
            .summary-label { font-size: 10px; color: #555; text-transform: uppercase; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; margin-bottom: 15px; }
            th { background-color: #f1f5f9; color: #334155; font-size: 11px; text-align: left; padding: 8px; border-bottom: 2px solid #cbd5e1; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
            .text-right { text-align: right; font-weight: bold; color: #0f172a; }
            .badge-ongrid { border-left: 5px solid #28A745; background-color: #E8F5E9; }
            .badge-offgrid { border-left: 5px solid #795548; background-color: #EFEBE9; }
            .disclaimer { font-size: 10px; color: #64748b; background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 10px; border-radius: 4px; margin-top: 25px; }
            .signature-area { margin-top: 40px; display: flex; justify-content: space-between; }
            .signature-line { width: 45%; text-align: center; border-top: 1px solid #333; padding-top: 5px; font-size: 11px; color: #444; }
            .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="logo-area">
              <h1>Memorial Descritivo Elétrico</h1>
              <p>Sistema de Dimensionamento de Energia Solar Fotovoltaica</p>
            </div>
            <div class="meta-info">
              <strong>Projeto:</strong> ${nomeProjeto}<br/>
              <strong>Data de Emissão:</strong> ${dataAtual}<br/>
              <strong>Software:</strong> Elétrica Solar v1.0
            </div>
          </div>

          <div class="section-title">1. Resumo do Consumo Energético Projetado</div>
          <div class="summary-box">
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-value">${consumoDiarioTotal} Wh</div>
                <div class="summary-label">Consumo Diário</div>
              </div>
              <div class="summary-item" style="border-left: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1;">
                <div class="summary-value">${consumoMensalKwh.toFixed(1)} kWh</div>
                <div class="summary-label">Consumo Mensal Estimado</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">${HSP_REGIAO} h/dia</div>
                <div class="summary-label">Irradiação (HSP de Referência)</div>
              </div>
            </div>
          </div>

          <div class="section-title">2. Viabilidade Técnica - Sistema Conectado (On-Grid)</div>
          <div class="summary-box badge-ongrid">
            <p style="margin: 0 0 8px 0; font-size: 11px; color: #1e3a8a; font-style: italic;">
              Indicado para áreas urbanas interligadas à rede pública. O excedente de energia é injetado na concessionária gerando créditos.
            </p>
            <table>
              <tr><th>Parâmetro de Dimensionamento</th><th class="text-right">Especificação Técnica</th></tr>
              <tr><td>Potência de Pico Necessária (Arranjo de Painéis)</td><td class="text-right">${dadosOnGrid.potenciaPicoSugeridaWp} Wp</td></tr>
              <tr><td>Capacidade Nominal Sugerida do Inversor</td><td class="text-right">${dadosOnGrid.potenciaPicoSugeridaKw} kW</td></tr>
            </table>
          </div>

          <div class="section-title">3. Viabilidade Técnica - Sistema Isolado (Off-Grid)</div>
          <div class="summary-box badge-offgrid">
            <p style="margin: 0 0 8px 0; font-size: 11px; color: #4e342e; font-style: italic;">
              Indicado para áreas rurais ou isoladas sem acesso à rede de distribuição. Requer banco de acumuladores (baterias).
            </p>
            <table>
              <tr><th>Parâmetro de Dimensionamento</th><th class="text-right">Especificação Técnica</th></tr>
              <tr><td>Autonomia Planejada do Banco de Baterias</td><td class="text-right">2 Dias sem incidência solar</td></tr>
              <tr><td>Tensão Nominal de Operação do Banco</td><td class="text-right">${dadosOffGrid.tensaoBancoSugerida} V</td></tr>
              <tr><td>Capacidade Útil Recomendada dos Acumuladores</td><td class="text-right">${dadosOffGrid.capacidadeSugeridaAh} Ah</td></tr>
            </table>
          </div>

          <div class="disclaimer">
            <strong>Aviso de Isenção de Responsabilidade:</strong> Os dimensionamentos apresentados baseiam-se em cálculos analíticos padronizados de irradiação média e fatores de perdas normativos. A execução da instalação elétrica fotovoltaica obrigatoriamente deve seguir as normas vigentes da ABNT e passar por aprovação técnica da concessionária.
          </div>

          <div class="signature-area">
            <div class="signature-line">Responsável Técnico / Projetista</div>
            <div class="signature-line">Visto / Cliente</div>
          </div>

          <div class="footer">Gerado eletronicamente através da plataforma de engenharia Elétrica Solar.</div>
        </body>
      </html>
    `;

    try {
      if (Platform.OS === "web") {
        const novaJanela = window.open("", "_blank");
        if (novaJanela) {
          novaJanela.document.write(htmlContent);
          novaJanela.document.close();
          setTimeout(() => {
            novaJanela.focus();
            novaJanela.print();
          }, 500);
        } else {
          window.alert(
            "O navegador bloqueou a abertura da nova aba. Por favor, permita pop-ups para este site.",
          );
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            UTI: ".pdf",
            mimeType: "application/pdf",
          });
        } else {
          Alert.alert("Erro", "Compartilhamento indisponível.");
        }
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível gerar o PDF.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.cardResumo}>
        <Text style={styles.tituloResumo}>Consumo Projetado</Text>
        <Text style={styles.dadoDestaque}>{consumoDiarioTotal} Wh/dia</Text>
        <Text style={styles.dadoSecundario}>
          Aprox. {consumoMensalKwh.toFixed(1)} kWh/mês
        </Text>
      </View>

      <Text style={styles.sectionTitle}>1. Sistema Conectado (On-Grid)</Text>
      <View style={[styles.cardBase, styles.cardOnGrid]}>
        <Text style={styles.descricao}>
          Ideal para redução da fatura de energia em áreas urbanas. O excedente
          é injetado na rede.
        </Text>
        <View style={styles.linhaDado}>
          <Text style={styles.labelDado}>Potência Pico Necessária:</Text>
          <Text style={styles.valorDado}>
            {dadosOnGrid.potenciaPicoSugeridaWp} Wp
          </Text>
        </View>
        <View style={styles.linhaDado}>
          <Text style={styles.labelDado}>Inversor Sugerido:</Text>
          <Text style={styles.valorDado}>
            {dadosOnGrid.potenciaPicoSugeridaKw} kW
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>2. Sistema Isolado (Off-Grid)</Text>
      <View style={[styles.cardBase, styles.cardOffGrid]}>
        <Text style={styles.descricao}>
          Ideal para áreas rurais sem acesso à concessionária. Requer banco de
          baterias.
        </Text>
        <View style={styles.linhaDado}>
          <Text style={styles.labelDado}>Autonomia do Sistema:</Text>
          <Text style={styles.valorDado}>2 Dias sem sol</Text>
        </View>
        <View style={styles.linhaDado}>
          <Text style={styles.labelDado}>Tensão do Banco:</Text>
          <Text style={styles.valorDado}>
            {dadosOffGrid.tensaoBancoSugerida}V
          </Text>
        </View>
        <View style={styles.linhaDado}>
          <Text style={styles.labelDado}>Capacidade das Baterias:</Text>
          <Text style={styles.valorDado}>
            {dadosOffGrid.capacidadeSugeridaAh} Ah
          </Text>
        </View>
      </View>

      <View style={styles.areaBotoes}>
        {consumoDiarioTotal > 0 ? (
          <TouchableOpacity style={styles.btnPDF} onPress={gerarPDF}>
            <Text style={styles.txtBtnPDF}>📄 Gerar Memorial em PDF</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.txtVazio}>
            Adicione cargas no Inventário para gerar o relatório.
          </Text>
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", padding: 16 },
  cardResumo: {
    backgroundColor: "#E8F4FD",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#B6D4FE",
  },
  tituloResumo: { fontSize: 14, color: "#004085", fontWeight: "bold" },
  dadoDestaque: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#004085",
    marginVertical: 4,
  },
  dadoSecundario: { fontSize: 14, color: "#555" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    marginTop: 8,
  },
  cardBase: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 6,
    marginBottom: 20,
  },
  cardOnGrid: {
    backgroundColor: "#E8F5E9",
    borderColor: "#C8E6C9",
    borderLeftColor: "#28A745",
  },
  cardOffGrid: {
    backgroundColor: "#EFEBE9",
    borderColor: "#D7CCC8",
    borderLeftColor: "#795548",
  },
  descricao: {
    fontSize: 13,
    color: "#555",
    fontStyle: "italic",
    marginBottom: 12,
  },
  linhaDado: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  labelDado: { fontSize: 14, color: "#444", fontWeight: "500" },
  valorDado: { fontSize: 15, color: "#000", fontWeight: "bold" },
  areaBotoes: { marginTop: 10 },
  btnPDF: {
    backgroundColor: "#007BFF",
    padding: 14,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 12,
  },
  txtBtnPDF: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  txtVazio: { textAlign: "center", color: "#888", fontStyle: "italic" },
});
