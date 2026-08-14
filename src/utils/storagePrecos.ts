// src/utils/storagePrecos.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MATERIAIS_PADRAO, MaterialBase } from "../data/tabelaMateriais";

// Mudamos a chave para não dar conflito com o seu outro aplicativo
const CHAVE_STORAGE_PRECOS = "@EletricaSolar_PrecosPersonalizados";

/**
 * Salva a lista de materiais editada pelo integrador na memória do celular.
 */
export async function salvarPrecosLocais(materiais: MaterialBase[]) {
  try {
    await AsyncStorage.setItem(CHAVE_STORAGE_PRECOS, JSON.stringify(materiais));
    console.log("Preços salvos com sucesso no modo offline!");
  } catch (error) {
    console.error("Erro ao salvar preços localmente", error);
  }
}

/**
 * Busca os preços na memória do celular.
 * Se for a primeira vez que abre o App (memória vazia), retorna os valores padrão.
 */
export async function obterPrecosLocais(): Promise<MaterialBase[]> {
  try {
    const dadosSalvos = await AsyncStorage.getItem(CHAVE_STORAGE_PRECOS);
    if (dadosSalvos) {
      return JSON.parse(dadosSalvos);
    }
    // Se não houver nada salvo, retorna a base padrão
    return MATERIAIS_PADRAO;
  } catch (error) {
    console.error("Erro ao buscar preços", error);
    return MATERIAIS_PADRAO;
  }
}
