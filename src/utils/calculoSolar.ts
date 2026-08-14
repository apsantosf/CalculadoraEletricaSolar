// src/utils/calculoSolar.ts
import { REGIOES_SOLARES } from "../constants/regioes";
import { MaterialBase } from "../data/tabelaMateriais";

export function calcularSistema(projeto: any, tabelaPrecos: MaterialBase[]) {
  // 1. Cálculo de Consumo
  const isDireto = projeto?.tipoCalculo === "direto";
  const isMisto = projeto?.tipoCalculo === "misto";
  const consumoBaseWh = ((projeto?.consumoDiretokWh || 0) * 1000) / 30;
  const consumoEquipamentosWh = (projeto?.inventario || []).reduce(
    (tot: number, item: any) =>
      tot + item.potenciaW * item.quantidade * item.horasUsoDia,
    0,
  );

  const consumoDiarioWh = isDireto
    ? consumoBaseWh
    : isMisto
      ? consumoBaseWh + consumoEquipamentosWh
      : consumoEquipamentosWh;

  // 2. Dimensionamento
  const regiao = REGIOES_SOLARES.find((r) => r.uf === projeto?.estado);
  const hsp = regiao ? regiao.hspMedio : 4.5;
  const eficienciaSistema = 0.75;
  const potenciaPicoWp =
    hsp > 0 ? consumoDiarioWh / (hsp * eficienciaSistema) : 0;

  const valorPlaca = projeto?.potenciaPlaca || 550;
  const qtdPlacas = Math.ceil(potenciaPicoWp / valorPlaca);
  const inversorKw = potenciaPicoWp / 1000;

  // 3. Baterias (Se for Off-Grid)
  const valorBateria = projeto?.capacidadeBateria || 220;
  const tensaoBancoV = 24;
  const diasAutonomia = 2;
  const profundidadeDescarga = 0.5;
  const capacidadeBateriasAh =
    (consumoDiarioWh * diasAutonomia) / (tensaoBancoV * profundidadeDescarga);
  const qtdBateriasSerie = tensaoBancoV / 12;
  const qtdStringsParalelo = Math.ceil(capacidadeBateriasAh / valorBateria);
  const totalBaterias = qtdBateriasSerie * qtdStringsParalelo;

  // 4. Preços Dinâmicos
  const getPreco = (id: string) =>
    tabelaPrecos.find((p) => p.id === id)?.precoMedio || 0;

  // Função para pegar preço específico da placa ou fallback
  const getPrecoPlaca = () => {
    const buscaExata = tabelaPrecos.find(
      (p) =>
        p.id === `mod_${valorPlaca}w` ||
        p.nome.toLowerCase().includes(`${valorPlaca}w`) ||
        p.nome.toLowerCase().includes(`${valorPlaca} W`),
    );
    return buscaExata ? buscaExata.precoMedio : getPreco("mod_550w") || 680;
  };

  const pPlaca = getPrecoPlaca();
  const pInversor = !projeto.temRede
    ? getPreco("inv_off_3kw")
    : inversorKw <= 3
      ? getPreco("inv_3kw")
      : inversorKw <= 5
        ? getPreco("inv_5kw")
        : getPreco("inv_10kw");
  const pEstrutura = getPreco("est_ceramico");
  const pStringBox = getPreco("string_box_1");
  const pConector = getPreco("conector_mc4");
  const pBateria = getPreco("bat_est_220ah");

  let valorTotalBoM = 0;
  if (qtdPlacas > 0) {
    valorTotalBoM += qtdPlacas * pPlaca;
    valorTotalBoM += Math.ceil(qtdPlacas / 4) * pEstrutura;
    if (projeto.temRede) valorTotalBoM += 1 * pStringBox;
    valorTotalBoM += 2 * pConector;
  }
  if (inversorKw > 0) {
    if (!projeto.temRede) {
      valorTotalBoM += 1 * getPreco("inv_off_3kw");
      valorTotalBoM += totalBaterias * pBateria;
    } else {
      valorTotalBoM += 1 * pInversor;
    }
  }

  return {
    consumoDiarioWh,
    potenciaPicoWp,
    qtdPlacas,
    inversorKw,
    totalBaterias,
    valorTotalBoM,
    precos: { pPlaca, pInversor, pEstrutura, pStringBox, pConector, pBateria },
  };
}
