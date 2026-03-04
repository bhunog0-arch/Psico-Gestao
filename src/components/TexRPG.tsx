import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  Shield, 
  Heart, 
  Zap, 
  TrendingUp, 
  MessageCircle,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Cat,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateRPGEvent, analyzeRPGAction } from '../services/gemini';
import { RPGEvent, TCCCard, RPGStatus } from '../types';

const INITIAL_CARDS: TCCCard[] = [
  { id: '1', name: 'Questionamento Socrático', category: 'Cognitiva', description: 'Questionar a evidência do pensamento.' },
  { id: '2', name: 'Respiração Diafragmática', category: 'Emocional', description: 'Acalmar o corpo e a mente.' },
  { id: '3', name: 'Exposição Gradual', category: 'Comportamental', description: 'Enfrentar o medo passo a passo.' },
  { id: '4', name: 'Cartão de Enfrentamento', category: 'Cognitiva', description: 'Lembrar de pensamentos alternativos.' },
  { id: '5', name: 'Busca de Apoio Social', category: 'Social', description: 'Conversar com alguém de confiança.' },
];

export default function TexRPG() {
  const [status, setStatus] = useState<RPGStatus>({
    ansiedade: 60,
    confianca: 40,
    evitacao: 50,
    progresso: 10,
  });

  const [currentEvent, setCurrentEvent] = useState<RPGEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [history, setHistory] = useState<string[]>([]);

  const startNewEvent = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const situacoes = [
        "Apresentar um trabalho na escola",
        "Pedir para entrar em um grupo de amigos",
        "Fazer uma prova difícil",
        "Conversar com alguém que você gosta",
        "Ir a uma festa onde não conhece muita gente"
      ];
      const randomSituacao = situacoes[Math.floor(Math.random() * situacoes.length)];
      const event = await generateRPGEvent(randomSituacao, "Social/Escolar");
      setCurrentEvent(event);
      setHistory(prev => [...prev, `Novo desafio: ${event.title}`]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const useCard = async (card: TCCCard) => {
    if (!currentEvent || loading) return;
    setLoading(true);
    try {
      const analysis = await analyzeRPGAction(card, currentEvent);
      setFeedback(analysis);
      
      // Update status based on analysis (mock logic for demo)
      setStatus(prev => ({
        ansiedade: Math.max(0, prev.ansiedade + (analysis.impacto?.ansiedade || -10)),
        confianca: Math.min(100, prev.confianca + (analysis.impacto?.confianca || 15)),
        evitacao: Math.max(0, prev.evitacao + (analysis.impacto?.evitacao || -10)),
        progresso: Math.min(100, prev.progresso + (analysis.impacto?.progresso || 5)),
      }));

      setHistory(prev => [...prev, `Usou ${card.name}: ${analysis.feedback.substring(0, 50)}...`]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startNewEvent();
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Cat className="text-emerald-600" />
            A Busca do Girassol
          </h2>
          <p className="text-gray-500">RPG Terapêutico para Jovens (12-19 anos)</p>
        </div>
        <button 
          onClick={startNewEvent}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          <RefreshCw size={16} />
          Novo Evento
        </button>
      </header>

      {/* Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatusBar label="Ansiedade" value={status.ansiedade} icon={Zap} color="text-amber-500" bg="bg-amber-100" />
        <StatusBar label="Confiança" value={status.confianca} icon={Shield} color="text-blue-500" bg="bg-blue-100" />
        <StatusBar label="Evitação" value={status.evitacao} icon={Heart} color="text-rose-500" bg="bg-rose-100" />
        <StatusBar label="Progresso" value={status.progresso} icon={TrendingUp} color="text-emerald-500" bg="bg-emerald-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Event Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[400px] relative overflow-hidden">
            {loading && !currentEvent ? (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="text-center">
                  <RefreshCw className="animate-spin text-emerald-600 mx-auto mb-4" size={32} />
                  <p className="text-sm font-medium text-gray-600">Tecendo a história...</p>
                </div>
              </div>
            ) : currentEvent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Cenário Atual
                </div>
                <h3 className="text-2xl font-bold">{currentEvent.title}</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {currentEvent.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">Pensamento Automático</p>
                    <p className="text-sm italic text-amber-900">"{currentEvent.pensamento}"</p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                    <p className="text-[10px] font-bold text-rose-700 uppercase mb-1">Emoção</p>
                    <p className="text-sm text-rose-900 font-medium">{currentEvent.emocao} ({currentEvent.intensidade}%)</p>
                  </div>
                </div>
              </motion.div>
            )}

            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-4"
              >
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <Sparkles size={20} />
                  Resultado da Ação
                </div>
                <p className="text-sm text-emerald-900 leading-relaxed">{feedback.feedback}</p>
                <div className="p-4 bg-white rounded-xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Reflexão TCC</p>
                  <p className="text-sm text-gray-700">{feedback.reflexao}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                  <Info size={14} />
                  Dica de Ação Real: {feedback.acao_na_vida_real}
                </div>
              </motion.div>
            )}
          </div>

          {/* Cards Inventory */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400">Suas Cartas TCC</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {INITIAL_CARDS.map(card => (
                <button
                  key={card.id}
                  onClick={() => useCard(card)}
                  disabled={loading || !!feedback}
                  className="group relative bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all text-left disabled:opacity-50"
                >
                  <div className={`w-8 h-8 rounded-lg mb-3 flex items-center justify-center ${
                    card.category === 'Cognitiva' ? 'bg-blue-100 text-blue-600' :
                    card.category === 'Emocional' ? 'bg-rose-100 text-rose-600' :
                    card.category === 'Comportamental' ? 'bg-amber-100 text-amber-600' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    <Zap size={16} />
                  </div>
                  <h5 className="text-xs font-bold mb-1 group-hover:text-emerald-700">{card.name}</h5>
                  <p className="text-[10px] text-gray-500 line-clamp-2">{card.description}</p>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={14} className="text-emerald-500" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar / History */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
              <MessageCircle size={18} className="text-emerald-600" />
              Diário de Jornada
            </h4>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {history.map((entry, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="w-1 bg-emerald-100 rounded-full shrink-0" />
                  <p className="text-gray-600">{entry}</p>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-xs text-gray-400 italic">Sua jornada começa aqui...</p>
              )}
            </div>
          </div>

          <div className="bg-emerald-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-bold mb-2">Dica do Terapeuta</h4>
              <p className="text-xs text-emerald-100 leading-relaxed">
                "Lembre-se: pensamentos não são fatos. Eles são apenas hipóteses que nossa mente cria. Vamos testá-los?"
              </p>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-10">
              <Cat size={100} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBar({ label, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${bg} ${color}`}>
          <Icon size={16} />
        </div>
        <span className={`text-sm font-bold ${color}`}>{value}%</span>
      </div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${color.replace('text', 'bg')}`}
        />
      </div>
    </div>
  );
}
