import React, { useState, useEffect, useRef } from 'react';
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
  Info,
  User,
  Wand2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateRPGEvent, analyzeRPGAction, generateAvatar, generateAvatarImage } from '../services/gemini';
import { RPGEvent, TCCCard, RPGStatus } from '../types';

const INITIAL_CARDS: TCCCard[] = [
  { id: '1', name: 'Questionamento Socrático', category: 'Cognitiva', description: 'Questionar a evidência do pensamento.' },
  { id: '2', name: 'Respiração Diafragmática', category: 'Emocional', description: 'Acalmar o corpo e a mente.' },
  { id: '3', name: 'Exposição Gradual', category: 'Comportamental', description: 'Enfrentar o medo passo a passo.' },
  { id: '4', name: 'Cartão de Enfrentamento', category: 'Cognitiva', description: 'Lembrar de pensamentos alternativos.' },
  { id: '5', name: 'Busca de Apoio Social', category: 'Social', description: 'Conversar com alguém de confiança.' },
];

interface Character {
  nick: string;
  race: string;
  appearance: string;
  avatarUrl?: string;
  description?: string;
}

export default function TexRPG() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [creating, setCreating] = useState(false);
  const [newChar, setNewChar] = useState<Character>({ nick: '', race: 'Humano', appearance: '' });
  
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
  const [muted, setMuted] = useState(false);

  // Audio refs
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = (type: 'action' | 'success' | 'event') => {
    if (muted) return;
    const sounds: any = {
      action: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
      success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
      event: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'
    };
    const audio = new Audio(sounds[type]);
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  const handleCreateCharacter = async () => {
    setLoading(true);
    try {
      const description = await generateAvatar(newChar.nick, newChar.race, newChar.appearance);
      const avatarUrl = await generateAvatarImage(description);
      setCharacter({ ...newChar, description, avatarUrl: avatarUrl || undefined });
      setCreating(false);
      playSound('success');
      startNewEvent();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
      playSound('event');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const useCard = async (card: TCCCard) => {
    if (!currentEvent || loading) return;
    setLoading(true);
    playSound('action');
    try {
      const analysis = await analyzeRPGAction(card, currentEvent);
      setFeedback(analysis);
      
      setStatus(prev => ({
        ansiedade: Math.max(0, prev.ansiedade + (analysis.impacto?.ansiedade || -10)),
        confianca: Math.min(100, prev.confianca + (analysis.impacto?.confianca || 15)),
        evitacao: Math.max(0, prev.evitacao + (analysis.impacto?.evitacao || -10)),
        progresso: Math.min(100, prev.progresso + (analysis.impacto?.progresso || 5)),
      }));

      setHistory(prev => [...prev, `Usou ${card.name}: ${analysis.feedback.substring(0, 50)}...`]);
      if (analysis.impacto?.progresso > 0) playSound('success');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!character && !creating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-8">
        <div className="p-8 bg-emerald-50 rounded-[3rem] border-4 border-emerald-100 shadow-xl">
          <Gamepad2 size={80} className="text-emerald-600 animate-pulse" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-4xl font-black text-gray-900 mb-4">A Busca do Girassol</h2>
          <p className="text-gray-500 font-medium leading-relaxed">
            Uma jornada gamificada de Terapia Cognitivo-Comportamental. Enfrente desafios, colete cartas e evolua seu autoconhecimento.
          </p>
        </div>
        <button 
          onClick={() => setCreating(true)}
          className="px-12 py-5 bg-emerald-600 text-white rounded-2xl font-black text-xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 flex items-center gap-3 group"
        >
          Criar Personagem
          <ChevronRight className="group-hover:translate-x-2 transition-transform" />
        </button>
      </div>
    );
  }

  if (creating) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-12">
        <div className="text-center">
          <h2 className="text-3xl font-black text-gray-900">Criação de Avatar</h2>
          <p className="text-gray-500">Como você quer ser visto nesta jornada?</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Nome / Nick</label>
            <input 
              type="text" 
              placeholder="Ex: Explorador da Mente" 
              value={newChar.nick}
              onChange={e => setNewChar({...newChar, nick: e.target.value})}
              className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Raça / Estilo</label>
            <select 
              value={newChar.race}
              onChange={e => setNewChar({...newChar, race: e.target.value})}
              className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-bold"
            >
              <option>Humano</option>
              <option>Elfo da Empatia</option>
              <option>Anão da Resiliência</option>
              <option>Guardião da Calma</option>
              <option>Sábio do Pensamento</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Aparência / Detalhes</label>
            <textarea 
              placeholder="Descreva detalhes como roupas, cores ou acessórios que representem você..." 
              value={newChar.appearance}
              onChange={e => setNewChar({...newChar, appearance: e.target.value})}
              className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-medium h-32 resize-none"
            />
          </div>

          <button 
            onClick={handleCreateCharacter}
            disabled={loading || !newChar.nick}
            className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3"
          >
            {loading ? <RefreshCw className="animate-spin" /> : <Wand2 />}
            Gerar Avatar com IA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {character?.avatarUrl ? (
            <div className="w-16 h-16 rounded-2xl border-2 border-emerald-500 overflow-hidden shadow-lg">
              <img src={character.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 border-2 border-emerald-200">
              <User size={32} />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2">
              {character?.nick}
              <span className="text-xs font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                {character?.race}
              </span>
            </h2>
            <p className="text-gray-500 text-sm font-medium">A Busca do Girassol • RPG TCC</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setMuted(!muted)}
            className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {muted ? <VolumeX size={20} className="text-gray-400" /> : <Volume2 size={20} className="text-emerald-600" />}
          </button>
          <button 
            onClick={startNewEvent}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm font-bold shadow-sm"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Novo Evento
          </button>
        </div>
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
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 min-h-[450px] relative overflow-hidden">
            {loading && !currentEvent ? (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="text-center">
                  <RefreshCw className="animate-spin text-emerald-600 mx-auto mb-4" size={48} />
                  <p className="text-lg font-bold text-gray-600">Tecendo a sua história...</p>
                </div>
              </div>
            ) : currentEvent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-start">
                  <div className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                    Desafio Atual
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`w-2 h-2 rounded-full ${i <= status.progresso / 33 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                    ))}
                  </div>
                </div>
                
                <h3 className="text-3xl font-black text-gray-900 leading-tight">{currentEvent.title}</h3>
                <p className="text-gray-600 leading-relaxed text-xl font-medium">
                  {currentEvent.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                  <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 shadow-sm relative group">
                    <div className="absolute -top-3 -left-3 p-2 bg-amber-500 text-white rounded-xl shadow-lg">
                      <Brain size={16} />
                    </div>
                    <p className="text-[10px] font-black text-amber-700 uppercase mb-2 tracking-widest">Pensamento Automático</p>
                    <p className="text-base italic text-amber-900 font-bold leading-relaxed">"{currentEvent.pensamento}"</p>
                  </div>
                  <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 shadow-sm relative">
                    <div className="absolute -top-3 -left-3 p-2 bg-rose-500 text-white rounded-xl shadow-lg">
                      <Heart size={16} />
                    </div>
                    <p className="text-[10px] font-black text-rose-700 uppercase mb-2 tracking-widest">Emoção Dominante</p>
                    <p className="text-base text-rose-900 font-black">{currentEvent.emocao} <span className="text-rose-400 font-bold ml-2">({currentEvent.intensidade}%)</span></p>
                  </div>
                </div>
              </motion.div>
            )}

            {feedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-10 p-8 bg-emerald-900 text-white rounded-[2rem] shadow-2xl space-y-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-12 bg-white/5 rounded-full blur-3xl -mr-12 -mt-12"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 text-emerald-300 font-black uppercase tracking-[0.2em] text-xs mb-4">
                    <Sparkles size={20} />
                    Consequência da Ação
                  </div>
                  <p className="text-lg font-bold leading-relaxed mb-6">{feedback.feedback}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                      <p className="text-[10px] font-black text-emerald-300 uppercase mb-2 tracking-widest">Reflexão TCC</p>
                      <p className="text-sm text-emerald-50 leading-relaxed font-medium">{feedback.reflexao}</p>
                    </div>
                    <div className="p-5 bg-emerald-800/50 rounded-2xl border border-emerald-700/50">
                      <p className="text-[10px] font-black text-emerald-300 uppercase mb-2 tracking-widest">Ação na Vida Real</p>
                      <p className="text-sm text-emerald-100 leading-relaxed font-bold">{feedback.acao_na_vida_real}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Cards Inventory */}
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Suas Cartas TCC</h4>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">5/5 Cartas</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {INITIAL_CARDS.map(card => (
                <button
                  key={card.id}
                  onClick={() => useCard(card)}
                  disabled={loading || !!feedback}
                  className="group relative bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm hover:border-emerald-500 hover:shadow-xl transition-all text-left disabled:opacity-50 hover:-translate-y-1"
                >
                  <div className={`w-10 h-10 rounded-2xl mb-4 flex items-center justify-center shadow-sm ${
                    card.category === 'Cognitiva' ? 'bg-blue-100 text-blue-600' :
                    card.category === 'Emocional' ? 'bg-rose-100 text-rose-600' :
                    card.category === 'Comportamental' ? 'bg-amber-100 text-amber-600' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    <Zap size={20} />
                  </div>
                  <h5 className="text-sm font-black mb-2 group-hover:text-emerald-700 leading-tight">{card.name}</h5>
                  <p className="text-[10px] text-gray-500 font-medium leading-relaxed line-clamp-2">{card.description}</p>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={16} className="text-emerald-500" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar / History */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h4 className="text-xs font-black mb-6 flex items-center gap-3 uppercase tracking-widest text-gray-400">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                <MessageCircle size={18} />
              </div>
              Diário de Jornada
            </h4>
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {history.map((entry, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 group-last:bg-emerald-200" />
                    <div className="w-0.5 h-full bg-emerald-50 group-last:hidden" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed pb-6">{entry}</p>
                </div>
              ))}
              {history.length === 0 && (
                <div className="text-center py-12">
                  <Cat size={48} className="mx-auto text-gray-100 mb-4" />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Sua jornada começa aqui...</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-emerald-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-16 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                  <Sparkles size={20} className="text-emerald-300" />
                </div>
                <h4 className="font-black uppercase tracking-widest text-xs">Dica do Terapeuta</h4>
              </div>
              <p className="text-base text-emerald-50 leading-relaxed font-bold italic">
                "Lembre-se: pensamentos não são fatos. Eles são apenas hipóteses que nossa mente cria. Vamos testá-los?"
              </p>
            </div>
            <div className="absolute -bottom-8 -right-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <Cat size={140} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBar({ label, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm group hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${bg} ${color} transition-transform group-hover:scale-110`}>
          <Icon size={20} />
        </div>
        <span className={`text-lg font-black ${color}`}>{value}%</span>
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{label}</p>
      <div className="h-2.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${color.replace('text', 'bg')} shadow-sm`}
        />
      </div>
    </div>
  );
}

function Brain(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54Z" />
    </svg>
  );
}
