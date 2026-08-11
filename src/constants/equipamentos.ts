// src/constants/equipamentos.ts

export interface EquipamentoPadrao {
  id: string;
  label: string;
  potenciaMediaW: number;
}

export const EQUIPAMENTOS_PADRAO: EquipamentoPadrao[] = [
  { id: "1", label: "Lâmpada LED", potenciaMediaW: 10 },
  { id: "2", label: 'TV LED 42"', potenciaMediaW: 100 },
  { id: "3", label: "Geladeira Duplex", potenciaMediaW: 400 },
  { id: "4", label: "Ar-condicionado 9000 BTUs", potenciaMediaW: 1000 },
  { id: "5", label: "Chuveiro Elétrico", potenciaMediaW: 5500 },
  { id: "6", label: "Bomba d'água 1CV", potenciaMediaW: 735 },
  { id: "7", label: "Betoneira 400L", potenciaMediaW: 1500 },
  { id: "8", label: "Refletor LED Externo", potenciaMediaW: 50 },
];
