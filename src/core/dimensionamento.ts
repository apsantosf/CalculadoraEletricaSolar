// src/core/dimensionamento.ts

export interface OnGridResult {
  modelo: "On-Grid";
  consumoDiarioKwh: number;
  potenciaPicoSugeridaWp: number;
  potenciaPicoSugeridaKw: number;
}

export interface OffGridResult {
  modelo: "Off-Grid";
  energiaAutonomiaWh: number;
  tensaoBancoSugerida: number;
  capacidadeSugeridaAh: number;
}

/**
 * Calcula a Potência Pico (Wp) necessária para um sistema On-Grid.
 *
 * @param consumoMensalKwh - O consumo em kWh da fatura de energia.
 * @param hsp - Horas de Sol Pleno diárias da região.
 * @param taxaEficiencia - Fator de perda do sistema (padrão 0.80 ou 80%).
 */
export const calcularOnGrid = (
  consumoMensalKwh: number,
  hsp: number,
  taxaEficiencia: number = 0.8,
): OnGridResult => {
  const consumoDiario = consumoMensalKwh / 30;
  const geracaoNecessariaDiaria = consumoDiario / taxaEficiencia;
  const potenciaPicoKw = geracaoNecessariaDiaria / hsp;
  const potenciaPicoWp = Math.ceil(potenciaPicoKw * 1000);

  return {
    modelo: "On-Grid",
    consumoDiarioKwh: Number(consumoDiario.toFixed(2)),
    potenciaPicoSugeridaWp: potenciaPicoWp,
    potenciaPicoSugeridaKw: Number(potenciaPicoKw.toFixed(2)),
  };
};

/**
 * Calcula a capacidade do banco de baterias para um sistema Off-Grid.
 *
 * @param consumoDiarioWh - Consumo total do Picker Híbrido em Watts-hora.
 * @param diasAutonomia - Quantos dias o sistema deve aguentar sem sol.
 * @param tensaoSistema - Tensão do banco de baterias (12V, 24V ou 48V).
 * @param profundidadeDescarga - Limite de descarga para preservar a bateria (padrão 0.5 para Chumbo-ácido).
 */
export const calcularOffGrid = (
  consumoDiarioWh: number,
  diasAutonomia: number = 2,
  tensaoSistema: number = 24,
  profundidadeDescarga: number = 0.5,
): OffGridResult => {
  const energiaNecessaria = consumoDiarioWh * diasAutonomia;
  const capacidadeBancoAh = Math.ceil(
    energiaNecessaria / (tensaoSistema * profundidadeDescarga),
  );

  return {
    modelo: "Off-Grid",
    energiaAutonomiaWh: energiaNecessaria,
    tensaoBancoSugerida: tensaoSistema,
    capacidadeSugeridaAh: capacidadeBancoAh,
  };
};
