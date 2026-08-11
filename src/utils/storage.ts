// src/utils/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const PROJETO_ATIVO_KEY = "@EletricaSolar_ProjetoAtivo";
const HISTORICO_KEY = "@EletricaSolar_Historico";

// === SESSÃO ATIVA (O projeto que está aberto no momento) ===
export const carregarProjetoAtivo = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(PROJETO_ATIVO_KEY);
    return jsonValue != null
      ? JSON.parse(jsonValue)
      : { nome: "Novo Projeto Solar", inventario: [] };
  } catch (e) {
    return { nome: "Novo Projeto Solar", inventario: [] };
  }
};

export const atualizarNomeProjeto = async (nome: string) => {
  const projeto = await carregarProjetoAtivo();
  projeto.nome = nome;
  await AsyncStorage.setItem(PROJETO_ATIVO_KEY, JSON.stringify(projeto));
};

export const atualizarInventario = async (inventario: any[]) => {
  const projeto = await carregarProjetoAtivo();
  projeto.inventario = inventario;
  await AsyncStorage.setItem(PROJETO_ATIVO_KEY, JSON.stringify(projeto));
};

export const limparProjeto = async () => {
  await AsyncStorage.removeItem(PROJETO_ATIVO_KEY);
};

// === HISTÓRICO DE PROJETOS SALVOS ===
export const carregarHistorico = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(HISTORICO_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    return [];
  }
};

export const salvarNoHistorico = async () => {
  try {
    const projetoAtual = await carregarProjetoAtivo();
    let historico = await carregarHistorico();

    const index = historico.findIndex((p: any) => p.nome === projetoAtual.nome);
    if (index >= 0) {
      historico[index] = projetoAtual; // Atualiza se já existir
    } else {
      historico.push(projetoAtual); // Cria novo
    }
    await AsyncStorage.setItem(HISTORICO_KEY, JSON.stringify(historico));
  } catch (e) {
    console.error(e);
  }
};

export const carregarDoHistorico = async (projetoSalvo: any) => {
  await AsyncStorage.setItem(PROJETO_ATIVO_KEY, JSON.stringify(projetoSalvo));
};

export const excluirDoHistorico = async (nomeProjeto: string) => {
  let historico = await carregarHistorico();
  historico = historico.filter((p: any) => p.nome !== nomeProjeto);
  await AsyncStorage.setItem(HISTORICO_KEY, JSON.stringify(historico));
};
