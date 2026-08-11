// src/app/resultado.tsx
import * as Print from "expo-print";
import { useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { calcularOffGrid, calcularOnGrid } from "../core/dimensionamento";

export default function ResultadoScreen() {
  const { consumoWh } = useLocalSearchParams();
  const consumoDiarioTotal = Number(consumoWh) || 0;

  const consumoMensalKwh = (consumoDiarioTotal / 1000) * 30;
  const HSP_REGIAO = 4.5;

  const dadosOnGrid = calcularOnGrid(consumoMensalKwh, HSP_REGIAO);
  const dadosOffGrid = calcularOffGrid(consumoDiarioTotal);

  // === MOTOR DE GERAÇÃO DE PDF SEPARADO POR PLATAFORMA ===
  const gerarPDF = async () => {
    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Memorial Descritivo - Elétrica Solar</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; }
            .header { background-color: #FFD700; color: #000; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            h1 { margin: 0; font-size: 24px; }
            h2 { color: #004085; border-bottom: 2px solid #B6D4FE; padding-bottom: 5px; margin-top: 30px; }
            .card { background: #E8F5E9; padding: 15px; border-left: 6px solid #28A745; margin-bottom: 20px; border-radius: 4px; }
            .card-offgrid { border-left-color: #795548; background: #EFEBE9; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            td { padding: 10px 0; border-bottom: 1px solid #ddd; }
            .text-right { text-align: right; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #777; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Memorial Descritivo Elétrico</h1>
            <p>Dimensionamento de Sistema Solar Integrado</p>
          </div>
          
          <h2>Consumo Projetado</h2>
          <p>Baseado no inventário de cargas fornecido pelo cliente:</p>
          <ul>
            <li><strong>Consumo Diário:</strong> ${consumoDiarioTotal} Wh/dia</li>
            <li><strong>Consumo Mensal Estimado:</strong> ${consumoMensalKwh.toFixed(1)} kWh/mês</li>
            <li><strong>Índice Solar (HSP):</strong> ${HSP_REGIAO} horas úteis</li>
          </ul>

          <h2>1. Viabilidade: Sistema Conectado (On-Grid)</h2>
          <div class="card">
            <table>
              <tr><td>Potência Pico Sugerida (Painéis)</td><td class="text-right">${dadosOnGrid.potenciaPicoSugeridaWp} Wp</td></tr>
              <tr><td>Capacidade Mínima do Inversor</td><td class="text-right">${dadosOnGrid.potenciaPicoSugeridaKw} kW</td></tr>
            </table>
          </div>

          <h2>2. Viabilidade: Sistema Isolado (Off-Grid)</h2>
          <div class="card card-offgrid">
            <table>
              <tr><td>Autonomia Garantida s/ Sol</td><td class="text-right">2 Dias</td></tr>
              <tr><td>Tensão de Operação do Banco</td><td class="text-right">${dadosOffGrid.tensaoBancoSugerida} V</td></tr>
              <tr><td>Capacidade Sugerida (Baterias)</td><td class="text-right">${dadosOffGrid.capacidadeSugeridaAh} Ah</td></tr>
            </table>
          </div>

          <div class="footer">
            <p>Relatório gerado pelo aplicativo <strong>Elétrica Solar</strong>.</p>
          </div>
        </body>
      </html>
    `;

    try {
      if (Platform.OS === "web") {
        // SOLUÇÃO WEB: Abre uma nova aba isolada no navegador com o conteúdo limpo e chama a impressão sem afetar o app
        const novaJanela = window.open("", "_blank");
        if (novaJanela) {
          novaJanela.document.write(htmlContent);
          novaJanela.document.close();
          // Aguarda o carregamento e dispara o print nativo da nova aba
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
        // SOLUÇÃO MOBILE: Usa expo-print e compartilhamento nativo no Android/iOS
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
      console.error(error);
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
        <TouchableOpacity style={styles.btnPDF} onPress={gerarPDF}>
          <Text style={styles.txtBtnPDF}>📄 Gerar Memorial em PDF</Text>
        </TouchableOpacity>
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
});
