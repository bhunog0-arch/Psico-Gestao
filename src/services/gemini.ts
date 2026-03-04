import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (aiInstance) return aiInstance;
  
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  console.log("Gemini API Key detected:", apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : "MISSING");
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    console.error("Gemini API Key missing");
    throw new Error("API Key do Gemini não encontrada. No Netlify, adicione VITE_GEMINI_API_KEY nas variáveis de ambiente e faça um novo deploy.");
  }
  
  try {
    aiInstance = new GoogleGenAI({ apiKey });
    return aiInstance;
  } catch (e: any) {
    console.error("Error initializing Gemini:", e);
    throw new Error(`Erro ao inicializar Gemini: ${e.message}`);
  }
}

export const CONCEPTUALIZATION_PROMPT = `Você é um Psicólogo Clínico Sênior, PhD e especialista em Terapia Cognitivo-Comportamental (TCC) de Judith S. Beck.
Sua missão é gerar uma CONCEITUAÇÃO COGNITIVA DE BECK ABSOLUTAMENTE COMPLETA, PROFUNDA e ESTRUTURADA.
O objetivo é que o terapeuta tenha em mãos um mapa clínico total do paciente, permitindo uma intervenção precisa e baseada em evidências.

ESTRUTURA OBRIGATÓRIA:
1. ANÁLISE DESCRITIVA E RESUMO DO CASO: História da doença, queixas, impacto e rede de apoio.
2. DIAGNÓSTICO E METAS TERAPÊUTICAS: Hipóteses (DSM-5-TR) e metas de curto, médio e longo prazo.
3. MODELO COGNITIVO DETALHADO: Situação -> Pensamento -> Significado -> Emoção -> Comportamento -> Fisiologia.
4. RPD (TABELA MARKDOWN): Situação | Pensamento | Emoção | Evidências A Favor | Evidências Contra | Pensamento Alternativo | Reavaliação.
5. DIAGRAMA DE CONCEITUAÇÃO: Experiências Precoces, Crenças Centrais, Crenças Intermediárias e Estratégias Compensatórias.
6. HIPÓTESES DE MANUTENÇÃO: Gatilhos e ciclos viciosos.
7. PLANO DE INTERVENÇÃO: Técnicas Cognitivas e Comportamentais personalizadas.
8. GUIA DE SCRIPTS DO TERAPEUTA: Falas exatas para Psicoeducação e Seta Descendente.
9. TAREFAS DE CASA (HOMEWORK): Níveis 1, 2 e 3.
10. PSICOEDUCAÇÃO PARA O PACIENTE.
11. ALIANÇA TERAPÊUTICA E MANEJO DE OBSTÁCULOS.
12. PREVENÇÃO DE RECAÍDA.
13. SUPERVISÃO E ALERTAS CLÍNICOS.`;

export const GOLD_PROTOCOL_PROMPT = `Você é um Psicólogo Clínico especialista em Protocolos Padrão-Ouro da TCC.
Sua função é fornecer um PROTOCOLO OURO DE TRATAMENTO detalhado.

ESTRUTURA OBRIGATÓRIA:
1. IDENTIFICAÇÃO DO TRANSTORNO
2. REFERÊNCIA TÉCNICA (Ex: Edna Foa para TOC, Barlow para Ansiedade)
3. ESTRUTURA DO PROTOCOLO (FASES)
4. PLANO TERAPÊUTICO SESSÃO A SESSÃO
5. GUIA DE FALAS (SCRIPTS)
6. TÉCNICAS-CHAVE
7. TAREFAS DE CASA (HOMEWORK)`;

export const COPING_CAT_PROMPT = `Você é um terapeuta especialista no protocolo Coping Cat (e sua adaptação C.A.T. Project para adultos/jovens) para o tratamento de ansiedade.
Sua tarefa é gerar um PLANO TERAPÊUTICO GERAL de 16 sessões adaptado para a idade do paciente.

ESTRUTURA DO PLANO:
1. PERFIL CLÍNICO E OBJETIVOS TERAPÊUTICOS (Adaptados para a idade)
2. CRONOGRAMA ESTRUTURADO (16 SESSÕES):
   - Sessões 1-3: Vínculo, Normalização e Psicoeducação sobre Ansiedade.
   - Sessões 4-7: Habilidades de Enfrentamento (Relaxamento, Pensamentos Úteis).
   - Sessões 8-16: Exposições Graduadas (Plano F.E.A.R.) e Prevenção de Recaída.`;

async function safeGenerateContent(params: any, retries = 3, delay = 2000) {
  const ai = getAI();
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const errorMessage = error.message || "";
      const isUnavailable = errorMessage.includes("503") || errorMessage.includes("UNAVAILABLE") || errorMessage.includes("high demand");
      const isQuotaExceeded = errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota");

      if ((isUnavailable || isQuotaExceeded) && i < retries - 1) {
        const waitTime = isQuotaExceeded ? delay * 2 : delay;
        console.warn(`Gemini API ${isQuotaExceeded ? 'Quota Exceeded (429)' : 'Busy (503)'}. Retrying in ${waitTime}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        delay *= 2; // Exponential backoff
        continue;
      }

      if (isQuotaExceeded) {
        throw new Error("Limite de uso da IA atingido para hoje (Quota Exceeded). Por favor, tente novamente em alguns instantes ou aguarde a renovação do limite diário do Google Gemini.");
      }

      throw error;
    }
  }
  throw new Error("Falha ao gerar conteúdo após várias tentativas devido a instabilidade nos servidores do Google.");
}

export async function generateConceptualization(patientData: string) {
  const response = await safeGenerateContent({
    model: "gemini-flash-latest",
    contents: [{ parts: [{ text: `${CONCEPTUALIZATION_PROMPT}\n\nDados do Paciente:\n${patientData}` }] }],
  });
  return response.text;
}

export async function generateGoldProtocol(disorder: string) {
  const response = await safeGenerateContent({
    model: "gemini-flash-latest",
    contents: [{ parts: [{ text: `${GOLD_PROTOCOL_PROMPT}\n\nTranstorno/Demanda:\n${disorder}` }] }],
  });
  return response.text;
}

export async function generateCopingCatPlan(patientInfo: string) {
  const response = await safeGenerateContent({
    model: "gemini-flash-latest",
    contents: [{ parts: [{ text: `${COPING_CAT_PROMPT}\n\nInformações do Paciente:\n${patientInfo}` }] }],
  });
  return response.text;
}

export async function generateSessionDetail(sessionNumber: number, context: string) {
  const prompt = `Você é um terapeuta TCC aplicando o protocolo Coping Cat. Sua missão é detalhar a sessão ${sessionNumber} solicitada com foco em scripts práticos e acolhedores.
Contexto do Paciente: ${context}

ESTRUTURA DA RESPOSTA:
1. ACOLHIMENTO E CHECAGEM
2. AGENDA DA SESSÃO
3. CONDUÇÃO COM FALAS DO TERAPEUTA + PERGUNTAS
4. EXERCÍCIO PRÁTICO
5. RESUMO + TAREFA DE CASA + REFORÇO FINAL`;

  const response = await safeGenerateContent({
    model: "gemini-flash-latest",
    contents: [{ parts: [{ text: prompt }] }],
  });
  return response.text;
}

export async function generateRPGEvent(situacao: string, area: string, difficulty: string = 'Médio', focus: string = 'Ansiedade Social') {
  const prompt = `Gere um evento de TCC para o jogo "A Busca do Girassol".
Baseie-se nesta situação real de jovens: "${situacao}"
Área: ${area}
Foco Terapêutico: ${focus}
Nível de Dificuldade: ${difficulty} (Afeta a intensidade da emoção e complexidade da situação)
O evento deve seguir o modelo cognitivo: Situação -> Pensamentos Automáticos -> Emoções.
Seja empático e realista para jovens de 12 a 19 anos.
Retorne em formato JSON com: title, description, situacao, pensamento, emocao, intensidade (0-100).`;

  const response = await safeGenerateContent({
    model: "gemini-flash-latest",
    contents: [{ parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
}

export async function analyzeRPGAction(card: any, currentEvent: any) {
  const prompt = `O jogador usou a carta TCC "${card.name}" (Categoria: ${card.category}) no evento "${currentEvent.title}".
Situação: ${currentEvent.situacao}
Pensamento: ${currentEvent.pensamento}
Emoção: ${currentEvent.emocao} (Intensidade: ${currentEvent.intensidade}%)

Analise a consequência baseada em TCC. Retorne feedback, reflexão, ação na vida real e impacto nos status (Ansiedade, Confiança, Evitação, Progresso).
Retorne em formato JSON.`;

  const response = await safeGenerateContent({
    model: "gemini-flash-latest",
    contents: [{ parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
}

export async function generateAvatar(nick: string, race: string, appearance: string) {
  const prompt = `Gere uma descrição detalhada para um avatar de RPG TCC.
Personagem: ${nick}
Raça: ${race}
Aparência: ${appearance}
O estilo deve ser acolhedor, inspirador e adequado para jovens (12-19 anos).
Retorne uma descrição que possa ser usada para imaginar o personagem.`;

  const response = await safeGenerateContent({
    model: "gemini-flash-latest",
    contents: [{ parts: [{ text: prompt }] }],
  });
  return response.text;
}

export async function generateAvatarImage(description: string) {
  const response = await safeGenerateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `Crie uma ilustração de um avatar de RPG para jovens. Estilo arte digital moderna, limpa e amigável. Descrição: ${description}`,
        },
      ],
    },
    config: {
      imageConfig: {
            aspectRatio: "1:1"
        }
    },
  });
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}
