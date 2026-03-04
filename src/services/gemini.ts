import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

export async function generateConceptualization(patientData: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ parts: [{ text: `${CONCEPTUALIZATION_PROMPT}\n\nDados do Paciente:\n${patientData}` }] }],
  });
  return response.text;
}

export async function generateGoldProtocol(disorder: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ parts: [{ text: `${GOLD_PROTOCOL_PROMPT}\n\nTranstorno/Demanda:\n${disorder}` }] }],
  });
  return response.text;
}

export async function generateCopingCatPlan(patientInfo: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
  });
  return response.text;
}

export async function generateRPGEvent(situacao: string, area: string) {
  const prompt = `Gere um evento de TCC para o jogo "A Busca do Girassol".
Baseie-se nesta situação real de jovens: "${situacao}"
Área: ${area}
O evento deve seguir o modelo cognitivo: Situação -> Pensamentos Automáticos -> Emoções.
Seja empático e realista para jovens de 12 a 19 anos.
Retorne em formato JSON com: title, description, situacao, pensamento, emocao, intensidade (0-100).`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
}
