// src/utils/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EQUIPAMENTOS_PADRAO } from "../constants/equipamentos";

const PROJETO_ATIVO_KEY = "@EletricaSolar_ProjetoAtivo";
const HISTORICO_KEY = "@EletricaSolar_Historico";
const EQUIPAMENTOS_CUSTOM_KEY = "@EletricaSolar_EquipamentosCustom";

// 💡 FUNÇÃO AUXILIAR PARA GERAR ID ÚNICO (O "RG" do Projeto)
const gerarId = () => Math.random().toString(36).substring(7);

// === SESSÃO ATIVA (O projeto que está aberto no momento) ===
export const carregarProjetoAtivo = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(PROJETO_ATIVO_KEY);
    if (jsonValue != null) {
      const projeto = JSON.parse(jsonValue);
      // 💡 RETROCOMPATIBILIDADE: Se for um projeto antigo sem ID, cria um agora
      if (!projeto.id) {
        projeto.id = gerarId();
        await AsyncStorage.setItem(PROJETO_ATIVO_KEY, JSON.stringify(projeto));
      }
      return projeto;
    }

    // Se não tiver nada, cria um novo já com ID
    return {
      id: gerarId(),
      nome: "Novo Projeto Solar",
      inventario: [],
      estado: "SP",
      temRede: true,
      faseRede: "Bifasico",
      tipoCalculo: "equipamentos",
      consumoDiretokWh: 0,
    };
  } catch (e) {
    return {
      id: gerarId(),
      nome: "Novo Projeto Solar",
      inventario: [],
      estado: "SP",
      temRede: true,
      faseRede: "Bifasico",
      tipoCalculo: "equipamentos",
      consumoDiretokWh: 0,
    };
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
    let historico = jsonValue != null ? JSON.parse(jsonValue) : [];

    // 💡 RETROCOMPATIBILIDADE: Garante que todos no histórico tenham ID
    let atualizou = false;
    historico = historico.map((p: any) => {
      if (!p.id) {
        atualizou = true;
        return { ...p, id: gerarId() };
      }
      return p;
    });

    if (atualizou) {
      await AsyncStorage.setItem(HISTORICO_KEY, JSON.stringify(historico));
    }

    return historico;
  } catch (e) {
    return [];
  }
};

export const salvarNoHistorico = async () => {
  try {
    const projetoAtual = await carregarProjetoAtivo();
    let historico = await carregarHistorico();

    // 💡 A MÁGICA: Agora busca pelo ID (RG), e não mais pelo Nome!
    // Assim o usuário pode mudar o nome quantas vezes quiser.
    const index = historico.findIndex((p: any) => p.id === projetoAtual.id);
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
  if (!projetoSalvo.id) projetoSalvo.id = gerarId();
  await AsyncStorage.setItem(PROJETO_ATIVO_KEY, JSON.stringify(projetoSalvo));
};

export const excluirDoHistorico = async (nomeOuId: string) => {
  let historico = await carregarHistorico();
  // 💡 Exclui procurando tanto pelo ID quanto pelo Nome (para proteger o código antigo da tela inicial)
  historico = historico.filter(
    (p: any) => p.id !== nomeOuId && p.nome !== nomeOuId,
  );
  await AsyncStorage.setItem(HISTORICO_KEY, JSON.stringify(historico));
};

// ==========================================================
// === BANCO DE DADOS INTELIGENTE DE EQUIPAMENTOS ===
// ==========================================================

export const carregarListaEquipamentos = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(EQUIPAMENTOS_CUSTOM_KEY);
    let lista =
      jsonValue != null ? JSON.parse(jsonValue) : [...EQUIPAMENTOS_PADRAO];

    // ORDEM ALFABÉTICA SEMPRE ANTES DE MOSTRAR NA TELA
    lista.sort((a: any, b: any) => a.label.localeCompare(b.label));
    return lista;
  } catch (e) {
    return [...EQUIPAMENTOS_PADRAO].sort((a: any, b: any) =>
      a.label.localeCompare(b.label),
    );
  }
};

export const salvarNovoEquipamentoNoBanco = async (
  nome: string,
  potenciaW: number,
) => {
  try {
    const lista = await carregarListaEquipamentos();

    const existe = lista.find(
      (item: any) =>
        item.label.trim().toLowerCase() === nome.trim().toLowerCase(),
    );

    if (!existe) {
      const novoItem = {
        id: Math.random().toString(36).substring(7),
        label: nome.trim(),
        potenciaMediaW: potenciaW,
      };

      lista.push(novoItem);

      // ORDENA A LISTA DEPOIS DE ADICIONAR O NOVO ITEM
      lista.sort((a: any, b: any) => a.label.localeCompare(b.label));

      await AsyncStorage.setItem(
        EQUIPAMENTOS_CUSTOM_KEY,
        JSON.stringify(lista),
      );
      return lista;
    }
    return null;
  } catch (e) {
    console.error("Erro ao salvar novo equipamento:", e);
    return null;
  }
};

// NOVA FUNÇÃO: PERMITE EXCLUIR DEFINITIVAMENTE UM ITEM DO BANCO DE SUGESTÕES
export const excluirEquipamentoDoBanco = async (id: string) => {
  try {
    let lista = await carregarListaEquipamentos();
    lista = lista.filter((item: any) => item.id !== id);
    await AsyncStorage.setItem(EQUIPAMENTOS_CUSTOM_KEY, JSON.stringify(lista));
    return lista; // Retorna a lista atualizada para a tela
  } catch (e) {
    console.error("Erro ao excluir equipamento:", e);
    return null;
  }
};
