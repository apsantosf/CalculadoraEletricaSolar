// src/constants/regioes.ts

export interface RegiaoSolar {
  uf: string;
  nome: string;
  hspMedio: number; // Horas de Sol Pleno (Média anual)
}

export const REGIOES_SOLARES: RegiaoSolar[] = [
  // --- REGIÃO SUDESTE ---
  { uf: "SP", nome: "São Paulo", hspMedio: 4.5 },
  { uf: "RJ", nome: "Rio de Janeiro", hspMedio: 4.7 },
  { uf: "MG", nome: "Minas Gerais", hspMedio: 5.0 },
  { uf: "ES", nome: "Espírito Santo", hspMedio: 4.6 },

  // --- REGIÃO SUL ---
  { uf: "RS", nome: "Rio Grande do Sul", hspMedio: 4.2 },
  { uf: "PR", nome: "Paraná", hspMedio: 4.3 },
  { uf: "SC", nome: "Santa Catarina", hspMedio: 4.1 },

  // --- REGIÃO CENTRO-OESTE ---
  { uf: "GO", nome: "Goiás", hspMedio: 5.2 },
  { uf: "MT", nome: "Mato Grosso", hspMedio: 5.4 },
  { uf: "MS", nome: "Mato Grosso do Sul", hspMedio: 5.1 },
  { uf: "DF", nome: "Distrito Federal", hspMedio: 5.3 },

  // --- REGIÃO NORDESTE ---
  { uf: "BA", nome: "Bahia", hspMedio: 5.3 },
  { uf: "CE", nome: "Ceará", hspMedio: 5.5 },
  { uf: "PE", nome: "Pernambuco", hspMedio: 5.4 },
  { uf: "MA", nome: "Maranhão", hspMedio: 5.1 },
  { uf: "PI", nome: "Piauí", hspMedio: 5.6 },
  { uf: "RN", nome: "Rio Grande do Norte", hspMedio: 5.6 },
  { uf: "PB", nome: "Paraíba", hspMedio: 5.4 },
  { uf: "AL", nome: "Alagoas", hspMedio: 5.2 },
  { uf: "SE", nome: "Sergipe", hspMedio: 5.1 },

  // --- REGIÃO NORTE ---
  { uf: "AM", nome: "Amazonas", hspMedio: 4.3 },
  { uf: "PA", nome: "Pará", hspMedio: 4.8 },
  { uf: "TO", nome: "Tocantins", hspMedio: 5.3 },
  { uf: "RO", nome: "Rondônia", hspMedio: 4.6 },
  { uf: "AC", nome: "Acre", hspMedio: 4.3 },
  { uf: "AP", nome: "Amapá", hspMedio: 4.9 },
  { uf: "RR", nome: "Roraima", hspMedio: 4.8 },
];
