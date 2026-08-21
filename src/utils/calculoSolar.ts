// src/utils/calculoSolar.ts
import { REGIOES_SOLARES } from "../constants/regioes";
import { MaterialBase } from "../data/tabelaMateriais";

export function calcularSistema(projeto: any, tabelaPrecos: MaterialBase[]) {
  const isDireto = projeto?.tipoCalculo === "direto";
  const isMisto = projeto?.tipoCalculo === "misto";
  const consumoBaseWh =
    ((parseFloat(projeto?.consumoDiretokWh) || 0) * 1000) / 30;

  const consumoEquipamentosWh = (projeto?.inventario || []).reduce(
    (tot: number, item: any) =>
      tot +
      (parseFloat(item.potenciaW) || 0) *
        (parseFloat(item.quantidade) || 0) *
        (parseFloat(item.horasUsoDia) || 0),
    0,
  );

  const consumoDiarioWh = isDireto
    ? consumoBaseWh
    : isMisto
      ? consumoBaseWh + consumoEquipamentosWh
      : consumoEquipamentosWh;

  const regiao = REGIOES_SOLARES.find((r) => r.uf === projeto?.estado);
  const hsp = regiao ? regiao.hspMedio : 4.5;

  // 💡 A MÁGICA DA RESPONSABILIDADE ACONTECE AQUI!
  // Pega a margem digitada (ou assume 20% como padrão seguro)
  let margemPerdas = parseFloat(projeto?.margemSeguranca);
  if (isNaN(margemPerdas)) margemPerdas = 20;

  // Transforma a perda em eficiência. (Ex: 20% de perda = 0.80 de eficiência)
  const eficienciaSistema = (100 - margemPerdas) / 100;

  const potenciaPicoWp =
    hsp > 0 ? consumoDiarioWh / (hsp * eficienciaSistema) : 0;

  const valorPlaca = parseFloat(projeto?.potenciaPlaca) || 550;
  const qtdPlacas = Math.ceil(potenciaPicoWp / valorPlaca);
  const inversorKw = potenciaPicoWp / 1000;

  const valorBateria = parseFloat(projeto?.capacidadeBateria) || 220;
  const tensaoBancoV = 24;
  const diasAutonomia = 2;
  const profundidadeDescarga = 0.5;
  const capacidadeBateriasAh =
    (consumoDiarioWh * diasAutonomia) / (tensaoBancoV * profundidadeDescarga);
  const qtdBateriasSerie = Math.ceil(tensaoBancoV / 12);
  const qtdStringsParalelo = Math.ceil(capacidadeBateriasAh / valorBateria);
  const totalBaterias = qtdBateriasSerie * qtdStringsParalelo;

  const getPreco = (idBusca: string, fallback: number) => {
    const item = tabelaPrecos.find((p) => p.id === idBusca);
    return item ? parseFloat(String(item.precoMedio)) : fallback;
  };

  const idPlacaDinamico =
    tabelaPrecos.find(
      (p) =>
        p.id === `mod_${valorPlaca}w` ||
        p.nome.toLowerCase().includes(`${valorPlaca}w`) ||
        p.nome.toLowerCase().includes(`${valorPlaca} w`),
    )?.id || `mod_${valorPlaca}w`;

  const pPlaca =
    tabelaPrecos.find((p) => p.id === idPlacaDinamico)?.precoMedio || 680;
  const pEstrutura = getPreco("est_ceramico", 350);
  const pStringBox = getPreco("string_box_1", 350);
  const pConector = getPreco("conector_mc4", 15);
  const pBateria = getPreco("bat_est_220ah", 1600);

  let pInversor = 0;
  let idInversor = "";
  if (!projeto?.temRede) {
    idInversor = "inv_off_3kw";
    pInversor = getPreco("inv_off_3kw", 3900);
  } else {
    if (inversorKw <= 3) {
      idInversor = "inv_3kw";
      pInversor = getPreco("inv_3kw", 2800);
    } else if (inversorKw <= 5) {
      idInversor = "inv_5kw";
      pInversor = getPreco("inv_5kw", 3900);
    } else {
      idInversor = "inv_10kw";
      pInversor = getPreco("inv_10kw", 7500);
    }
  }

  let valorTotalBoM = 0;
  if (qtdPlacas > 0) {
    valorTotalBoM += qtdPlacas * pPlaca;
    valorTotalBoM += Math.ceil(qtdPlacas / 4) * pEstrutura;
    if (projeto?.temRede) valorTotalBoM += 1 * pStringBox;
    valorTotalBoM += 2 * pConector;
  }
  if (inversorKw > 0) {
    valorTotalBoM += 1 * pInversor;
    if (!projeto?.temRede) {
      valorTotalBoM += totalBaterias * pBateria;
    }
  }

  const maoDeObra = parseFloat(projeto?.maoDeObra) || 0;
  const valorTotalProjeto = valorTotalBoM + maoDeObra;

  return {
    consumoDiarioWh,
    potenciaPicoWp,
    qtdPlacas,
    inversorKw,
    totalBaterias,
    valorTotalBoM,
    maoDeObra,
    valorTotalProjeto,
    precos: { pPlaca, pInversor, pEstrutura, pStringBox, pConector, pBateria },
    idPlacaDinamico,
    idInversor,
  };
}
