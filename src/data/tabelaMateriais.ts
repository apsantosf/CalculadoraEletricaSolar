// src/data/tabelaMateriais.ts

// 💡 Mantemos a sua tipagem segura, adaptando para as medidas do mercado solar
export type TipoMedida = "rolo" | "metro" | "unidade" | "peça" | "kit" | "par";

// 💡 Novas categorias focadas no sistema fotovoltaico
export type CategoriaMaterial =
  | "modulo"
  | "inversor"
  | "bateria"
  | "estrutura"
  | "cabo"
  | "protecao";

export interface MaterialBase {
  id: string;
  nome: string;
  categoria: CategoriaMaterial;
  medida: TipoMedida;
  precoMedio: number;
}

export const MATERIAIS_PADRAO: MaterialBase[] = [
  // --- MÓDULOS SOLARES ---
  {
    id: "mod_450w",
    nome: "Módulo Solar Fotovoltaico 450W",
    categoria: "modulo",
    medida: "unidade",
    precoMedio: 550.0,
  },
  {
    id: "mod_550w",
    nome: "Módulo Solar Fotovoltaico 550W",
    categoria: "modulo",
    medida: "unidade",
    precoMedio: 680.0,
  },
  {
    id: "mod_600w",
    nome: "Módulo Solar Fotovoltaico 600W",
    categoria: "modulo",
    medida: "unidade",
    precoMedio: 750.0,
  },

  // --- INVERSORES (ON-GRID) ---
  {
    id: "inv_3kw",
    nome: "Inversor On-Grid 3kW (Mono/Bi)",
    categoria: "inversor",
    medida: "unidade",
    precoMedio: 2800.0,
  },
  {
    id: "inv_5kw",
    nome: "Inversor On-Grid 5kW (Mono/Bi)",
    categoria: "inversor",
    medida: "unidade",
    precoMedio: 3900.0,
  },
  {
    id: "inv_10kw",
    nome: "Inversor On-Grid 10kW (Trifásico)",
    categoria: "inversor",
    medida: "unidade",
    precoMedio: 7500.0,
  },

  // --- INVERSORES E BATERIAS (OFF-GRID) ---
  {
    id: "inv_off_3kw",
    nome: "Inversor Off-Grid 3kW 24V",
    categoria: "inversor",
    medida: "unidade",
    precoMedio: 3200.0,
  },
  {
    id: "bat_est_100ah",
    nome: "Bateria Estacionária 100Ah",
    categoria: "bateria",
    medida: "unidade",
    precoMedio: 850.0,
  },
  {
    id: "bat_est_220ah",
    nome: "Bateria Estacionária 220Ah",
    categoria: "bateria",
    medida: "unidade",
    precoMedio: 1600.0,
  },

  // --- ESTRUTURAS DE FIXAÇÃO ---
  {
    id: "est_ceramico",
    nome: "Kit Fixação (Telha Cerâmica) - 4 Placas",
    categoria: "estrutura",
    medida: "kit",
    precoMedio: 350.0,
  },
  {
    id: "est_fibro",
    nome: "Kit Fixação (Fibrocimento) - 4 Placas",
    categoria: "estrutura",
    medida: "kit",
    precoMedio: 280.0,
  },

  // --- PROTEÇÃO E CABEAMENTO ---
  {
    id: "string_box_1",
    nome: "String Box CC (1 Entrada / 1 Saída)",
    categoria: "protecao",
    medida: "unidade",
    precoMedio: 350.0,
  },
  {
    id: "cabo_solar_4mm",
    nome: "Cabo Solar 4mm² (Preto/Vermelho)",
    categoria: "cabo",
    medida: "metro",
    precoMedio: 4.5,
  },
  {
    id: "conector_mc4",
    nome: "Par de Conectores MC4",
    categoria: "cabo",
    medida: "par",
    precoMedio: 15.0,
  },
];
