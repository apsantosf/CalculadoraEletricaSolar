// src/app/(tabs)/resultado.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import { REGIOES_SOLARES } from "../../constants/regioes";
import { carregarProjetoAtivo } from "../../utils/storage";

export default function ResultadoScreen() {
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

  if (!projeto) {
    return (
      <View style={styles.container}>
        <Text style={styles.txtCarregando}>Carregando memorial...</Text>
      </View>
    );
  }

  // === BLINDAGEM MATEMÁTICA INTELIGENTE ===
  const isDireto = projeto?.tipoCalculo === "direto";

  const consumoDiarioWh = isDireto
    ? ((projeto?.consumoDiretokWh || 0) * 1000) / 30
    : (projeto?.inventario || []).reduce(
        (tot: number, item: any) =>
          tot + item.potenciaW * item.quantidade * item.horasUsoDia,
        0,
      );

  const consumoMensalkWh = isDireto
    ? projeto?.consumoDiretokWh || 0
    : (consumoDiarioWh * 30) / 1000;

  const regiao = REGIOES_SOLARES.find((r) => r.uf === projeto?.estado);
  const hsp = regiao ? regiao.hspMedio : 4.5;
  const nomeEstado = regiao ? regiao.nome : "Não informado";
  const siglaEstado = projeto?.estado ? `(${projeto.estado})` : "";

  // On-Grid
  const eficienciaSistema = 0.75;
  const potenciaPicoWp =
    hsp > 0 ? consumoDiarioWh / (hsp * eficienciaSistema) : 0;
  const inversorKw = potenciaPicoWp / 1000;

  // Off-Grid
  const diasAutonomia = 2;
  const tensaoBancoV = 24;
  const profundidadeDescarga = 0.5;
  const capacidadeBateriasAh =
    (consumoDiarioWh * diasAutonomia) / (tensaoBancoV * profundidadeDescarga);

  // ==========================================
  // === MÓDULO GERADOR DE PDF PROFISSIONAL ===
  // ==========================================
  const exportarPDF = async () => {
    try {
      const dataAtual = new Date().toLocaleDateString("pt-BR");

      // Tabela muda se for cálculo direto
      const linhasTabela = !isDireto
        ? (projeto?.inventario || [])
            .map(
              (item: any) => `
        <tr>
          <td>${item.quantidade}x</td>
          <td class="left">${item.nome}</td>
          <td>${item.potenciaW} W</td>
          <td>${item.horasUsoDia} h</td>
          <td>${(item.potenciaW * item.quantidade * item.horasUsoDia).toFixed(0)} Wh</td>
        </tr>
      `,
            )
            .join("")
        : `
        <tr>
          <td colspan="5" style="text-align: center; padding: 20px; font-weight: bold; color: #64748B;">
            Cálculo realizado via entrada direta de consumo mensal fornecido pelo cliente (${projeto?.consumoDiretokWh || 0} kWh/mês).<br/>
            Lista de equipamentos não aplicável neste cenário.
          </td>
        </tr>
      `;

      // HTML Laudo Técnico Oficial
      const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <style>
            @page { margin: 20mm; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155; line-height: 1.5; font-size: 12px; }
            
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0056B3; padding-bottom: 15px; margin-bottom: 25px; }
            .logo-placeholder { background-color: #0056B3; color: white; padding: 12px 24px; font-size: 20px; font-weight: bold; border-radius: 4px; letter-spacing: 1px; }
            .doc-info { text-align: right; }
            .doc-title { font-size: 22px; font-weight: bold; color: #0F172A; margin: 0; text-transform: uppercase; }
            .doc-date { font-size: 12px; color: #64748B; margin: 5px 0 0 0; }
            
            .section-title { font-size: 14px; font-weight: bold; color: #0056B3; text-transform: uppercase; border-bottom: 1px solid #CBD5E1; padding-bottom: 5px; margin: 30px 0 15px 0; }
            
            .client-grid { display: flex; flex-wrap: wrap; background: #F8FAFC; padding: 15px; border-radius: 8px; border: 1px solid #E2E8F0; gap: 15px; }
            .client-item { flex: 1 1 40%; }
            .client-label { display: block; font-size: 10px; color: #64748B; text-transform: uppercase; font-weight: bold; margin-bottom: 3px; }
            .client-value { font-size: 14px; color: #0F172A; font-weight: bold; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background-color: #F1F5F9; color: #475569; font-size: 11px; text-transform: uppercase; padding: 12px 8px; text-align: center; border-bottom: 2px solid #CBD5E1; }
            th.left { text-align: left; }
            td { padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: center; color: #334155; }
            td.left { text-align: left; font-weight: 500; }
            .tr-total { background-color: #F8FAFC; }
            .tr-total td { font-weight: bold; font-size: 14px; color: #0056B3; border-top: 2px solid #CBD5E1; }
            
            .result-container { display: flex; gap: 20px; margin-top: 20px; page-break-inside: avoid; }
            .result-box { flex: 1; border-radius: 8px; padding: 20px; border: 1px solid #E2E8F0; }
            .box-ongrid { border-top: 5px solid #10B981; background: #F0FDF4; }
            .box-offgrid { border-top: 5px solid #F59E0B; background: #FFFBEB; }
            .box-title { font-size: 16px; font-weight: bold; margin: 0 0 15px 0; color: #0F172A; }
            
            .metric { margin-bottom: 15px; }
            .metric:last-child { margin-bottom: 0; }
            .metric-label { font-size: 11px; color: #64748B; text-transform: uppercase; display: block; margin-bottom: 2px; }
            .metric-value { font-size: 18px; font-weight: bold; color: #0F172A; }
            .metric-value.highlight-green { color: #059669; font-size: 22px; }
            .metric-value.highlight-orange { color: #D97706; font-size: 22px; }
            
            .signature-area { margin-top: 80px; text-align: center; page-break-inside: avoid; }
            .line { border-top: 1px solid #000; width: 300px; margin: 0 auto 10px auto; }
            .signature-name { font-weight: bold; color: #0F172A; font-size: 14px; margin: 0; }
            .signature-role { color: #64748B; font-size: 12px; margin: 2px 0 0 0; }
          </style>
        </head>
        <body>
          
          <div class="header">
            <div class="logo-placeholder">ELÉTRICA SOLAR</div>
            <div class="doc-info">
              <h1 class="doc-title">Memorial de Cálculo</h1>
              <p class="doc-date">Emitido em: ${dataAtual}</p>
            </div>
          </div>

          <h2 class="section-title">1. Identificação do Projeto e Local</h2>
          <div class="client-grid">
            <div class="client-item">
              <span class="client-label">Cliente / Projeto</span>
              <span class="client-value">${projeto?.nome || "Não informado"}</span>
            </div>
            <div class="client-item">
              <span class="client-label">Local de Instalação</span>
              <span class="client-value">${nomeEstado} ${siglaEstado}</span>
            </div>
            <div class="client-item">
              <span class="client-label">Índice Solar Local</span>
              <span class="client-value">${hsp} HSP (Horas de Sol Pleno)</span>
            </div>
            <div class="client-item">
              <span class="client-label">Rede da Concessionária</span>
              <span class="client-value">${projeto?.temRede ? "Sim (" + projeto.faseRede + ")" : "Não (Sistema Isolado)"}</span>
            </div>
          </div>

          <h2 class="section-title">2. Consumo Projetado</h2>
          <table>
            <tr>
              <th>Qtd</th>
              <th class="left">Equipamento</th>
              <th>Potência (W)</th>
              <th>Uso Diário</th>
              <th>Subtotal</th>
            </tr>
            ${linhasTabela}
            <tr class="tr-total">
              <td colspan="4" class="left">Consumo Total Diário Estimado:</td>
              <td>${consumoDiarioWh.toFixed(0)} Wh/dia</td>
            </tr>
            <tr class="tr-total" style="background-color: #E0F2FE;">
              <td colspan="4" class="left" style="color: #0369A1;">Consumo Total Mensal Estimado:</td>
              <td style="color: #0369A1;">${consumoMensalkWh.toFixed(1)} kWh/mês</td>
            </tr>
          </table>

          <h2 class="section-title">3. Dimensionamento Técnico</h2>
          
          <div class="result-container">
            <div class="result-box box-ongrid">
              <h3 class="box-title">Sistema Conectado (On-Grid)</h3>
              <p style="font-size: 11px; color: #64748B; margin-top: -10px; margin-bottom: 20px;">
                Recomendado para abatimento na fatura de energia.
              </p>
              
              <div class="metric">
                <span class="metric-label">Potência Pico Necessária (Módulos)</span>
                <span class="metric-value highlight-green">${potenciaPicoWp.toFixed(0)} Wp</span>
              </div>
              <div class="metric">
                <span class="metric-label">Potência Mínima do Inversor</span>
                <span class="metric-value">${inversorKw.toFixed(2)} kW</span>
              </div>
            </div>

            <div class="result-box box-offgrid">
              <h3 class="box-title">Sistema Isolado (Off-Grid)</h3>
              <p style="font-size: 11px; color: #64748B; margin-top: -10px; margin-bottom: 20px;">
                Recomendado exclusivamente para áreas rurais isoladas.
              </p>
              
              <div class="metric">
                <span class="metric-label">Capacidade Necessária do Banco</span>
                <span class="metric-value highlight-orange">${capacidadeBateriasAh.toFixed(0)} Ah</span>
              </div>
              <div class="metric" style="display: flex; gap: 20px;">
                <div>
                  <span class="metric-label">Autonomia</span>
                  <span class="metric-value">${diasAutonomia} Dias</span>
                </div>
                <div>
                  <span class="metric-label">Tensão</span>
                  <span class="metric-value">${tensaoBancoV} V</span>
                </div>
              </div>
            </div>
          </div>

          <div class="signature-area">
            <div class="line"></div>
            <p class="signature-name">Responsável Técnico</p>
            <p class="signature-role">Projeto e Dimensionamento Fotovoltaico</p>
          </div>

        </body>
        </html>
      `;

      if (Platform.OS === "web") {
        const novaGuia = window.open("", "_blank");
        if (novaGuia) {
          novaGuia.document.write(html);
          novaGuia.document.close();
          setTimeout(() => {
            novaGuia.print();
          }, 500);
        } else {
          window.alert(
            "Por favor, libere os pop-ups do seu navegador para gerar o PDF.",
          );
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, {
          UTI: ".pdf",
          mimeType: "application/pdf",
          dialogTitle: "Compartilhar Memorial Técnico",
        });
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível gerar o PDF.");
      console.error(error);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={styles.cardConsumoGeral}>
        <Text style={styles.txtConsumoTitulo}>Consumo Projetado</Text>
        <Text style={styles.txtConsumoValor}>
          {consumoDiarioWh.toFixed(0)} Wh/dia
        </Text>
        <Text style={styles.txtConsumoSub}>
          Aprox. {consumoMensalkWh.toFixed(1)} kWh/mês
        </Text>
      </View>

      {/* SÓ MOSTRA A LISTA DE CARGAS NA TELA SE FOR MODO EQUIPAMENTO */}
      {!isDireto && (
        <View style={styles.cardCargas}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <MaterialCommunityIcons
              name="format-list-checks"
              size={20}
              color="#475569"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.tituloCard}>Cargas Computadas</Text>
          </View>

          {(projeto?.inventario || []).map((item: any, index: number) => (
            <View key={index} style={styles.itemCarga}>
              <Text style={styles.txtCargaNome}>
                <Text style={{ fontWeight: "bold", color: "#0056B3" }}>
                  {item.quantidade}x
                </Text>{" "}
                {item.nome}
              </Text>
              <Text style={styles.txtCargaDetalhe}>
                {item.potenciaW}W • {item.horasUsoDia}h/dia ={" "}
                <Text style={{ color: "#475569", fontWeight: "bold" }}>
                  {(
                    item.potenciaW *
                    item.quantidade *
                    item.horasUsoDia
                  ).toFixed(0)}{" "}
                  Wh
                </Text>
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* SÓ MOSTRA ESSE AVISO SE FOR CÁLCULO DIRETO */}
      {isDireto && (
        <View
          style={[
            styles.cardCargas,
            { backgroundColor: "#F8FAFC", padding: 20, alignItems: "center" },
          ]}
        >
          <MaterialCommunityIcons
            name="lightning-bolt-circle"
            size={32}
            color="#94A3B8"
            style={{ marginBottom: 8 }}
          />
          <Text
            style={{
              color: "#64748B",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            Cálculo Direto Ativado
          </Text>
          <Text
            style={{
              color: "#94A3B8",
              textAlign: "center",
              fontSize: 12,
              marginTop: 4,
            }}
          >
            O dimensionamento foi realizado com base na entrada direta de{" "}
            {projeto?.consumoDiretokWh || 0} kWh/mês informada na aba Início.
          </Text>
        </View>
      )}

      <Text style={styles.tituloSecao}>1. Sistema Conectado (On-Grid)</Text>
      <View style={[styles.cardVeredito, styles.bordaVerde]}>
        <Text style={styles.txtDescricaoVeredito}>
          Ideal para redução da fatura de energia. O excedente gera créditos na
          rede da concessionária.
          {projeto?.temRede
            ? ` (Rede Local: ${projeto?.faseRede})`
            : " ATENÇÃO: Cliente informou não ter rede no local."}
        </Text>

        <View style={styles.linhaDado}>
          <Text style={styles.labelDado}>Potência Pico Necessária:</Text>
          <Text style={styles.valorDado}>{potenciaPicoWp.toFixed(0)} Wp</Text>
        </View>
        <View style={styles.linhaDadoSemBorda}>
          <Text style={styles.labelDado}>Inversor Sugerido:</Text>
          <Text style={styles.valorDado}>{inversorKw.toFixed(2)} kW</Text>
        </View>
      </View>

      <Text style={styles.tituloSecao}>2. Sistema Isolado (Off-Grid)</Text>
      <View style={[styles.cardVeredito, styles.bordaMarrom]}>
        <Text style={styles.txtDescricaoVeredito}>
          Ideal para áreas rurais sem acesso à concessionária. Requer banco de
          baterias rigoroso.
        </Text>

        <View style={styles.linhaDado}>
          <Text style={styles.labelDado}>Autonomia do Sistema:</Text>
          <Text style={styles.valorDado}>{diasAutonomia} Dias sem sol</Text>
        </View>
        <View style={styles.linhaDado}>
          <Text style={styles.labelDado}>Tensão do Banco:</Text>
          <Text style={styles.valorDado}>{tensaoBancoV}V</Text>
        </View>
        <View style={styles.linhaDadoSemBorda}>
          <Text style={styles.labelDado}>Capacidade das Baterias:</Text>
          <Text style={styles.valorDado}>
            {capacidadeBateriasAh.toFixed(0)} Ah
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.btnPdf} onPress={exportarPDF}>
        <MaterialCommunityIcons
          name="file-pdf-box"
          size={24}
          color="#FFF"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.txtBtnBranco}>Gerar Memorial em PDF</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16 },
  txtCarregando: { textAlign: "center", marginTop: 50, color: "#64748B" },

  cardConsumoGeral: {
    backgroundColor: "#E0F2FE",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  txtConsumoTitulo: {
    fontSize: 14,
    color: "#0284C7",
    fontWeight: "bold",
    marginBottom: 4,
  },
  txtConsumoValor: { fontSize: 28, color: "#0369A1", fontWeight: "bold" },
  txtConsumoSub: { fontSize: 13, color: "#38BDF8", marginTop: 4 },

  cardCargas: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 24,
    // @ts-ignore
    boxShadow:
      Platform.OS === "web" ? "0px 2px 4px rgba(0,0,0,0.02)" : undefined,
    elevation: 1,
  },
  tituloCard: { fontSize: 15, fontWeight: "bold", color: "#1E293B" },
  itemCarga: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingVertical: 8,
  },
  txtCargaNome: { fontSize: 14, color: "#334155", marginBottom: 2 },
  txtCargaDetalhe: { fontSize: 12, color: "#94A3B8" },

  tituloSecao: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 10,
    marginLeft: 4,
  },
  cardVeredito: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 24,
    borderLeftWidth: 6,
    // @ts-ignore
    boxShadow:
      Platform.OS === "web" ? "0px 2px 4px rgba(0,0,0,0.02)" : undefined,
    elevation: 2,
  },
  bordaVerde: { borderLeftColor: "#10B981" },
  bordaMarrom: { borderLeftColor: "#A8A29E" },

  txtDescricaoVeredito: {
    fontSize: 13,
    color: "#64748B",
    fontStyle: "italic",
    marginBottom: 16,
    lineHeight: 20,
  },

  linhaDado: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingVertical: 10,
  },
  linhaDadoSemBorda: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  labelDado: { fontSize: 14, color: "#475569" },
  valorDado: { fontSize: 15, fontWeight: "bold", color: "#0F172A" },

  btnPdf: {
    backgroundColor: "#0056B3",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  txtBtnBranco: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});
