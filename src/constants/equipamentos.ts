// src/constants/equipamentos.ts

export interface EquipamentoPadrao {
  id: string;
  label: string;
  potenciaMediaW: number;
}

export const EQUIPAMENTOS_PADRAO: EquipamentoPadrao[] = [
  { id: "1", label: "Lâmpada LED", potenciaMediaW: 10 },
  { id: "2", label: 'TV LED 42"', potenciaMediaW: 90 },
  { id: "3", label: "Geladeira Duplex", potenciaMediaW: 400 },
  { id: "4", label: "Freezer Vertical", potenciaMediaW: 500 },
  { id: "5", label: "Ar Condicionado 9000 BTUs", potenciaMediaW: 820 },
  { id: "6", label: "Ar Condicionado 12000 BTUs", potenciaMediaW: 1100 },
  { id: "7", label: "Chuveiro Elétrico", potenciaMediaW: 5500 },
  { id: "8", label: "Bomba d'Água (1/2 cv)", potenciaMediaW: 370 },
  { id: "9", label: "Micro-ondas", potenciaMediaW: 1200 },
  { id: "10", label: "Máquina de Lavar", potenciaMediaW: 600 },
  { id: "11", label: "Betoneira 400L", potenciaMediaW: 1500 },
  { id: "12", label: "Refletor LED Externo", potenciaMediaW: 50 },
];
