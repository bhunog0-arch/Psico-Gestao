import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  BookOpen, 
  Send, 
  Loader2, 
  Download, 
  ChevronRight,
  FileText,
  Cat,
  Calendar,
  Save,
  History,
  Plus,
  User,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  generateConceptualization, 
  generateGoldProtocol, 
  generateCopingCatPlan,
  generateSessionDetail
} from '../services/gemini';
import { 
  getPatients, 
  createPatient, 
  updatePatient,
  saveConceptualization, 
  getConceptualizationHistory,
  isSupabaseConfigured,
  getRpds,
  saveRpd
} from '../services/supabase';
import { Patient, ConceptualizationRecord } from '../types';

interface PortalDashboardProps {
  type: 'conceptualization' | 'protocols';
  externalPatientId?: string;
  onPatientChange?: (id: string) => void;
}

export default function PortalDashboard({ type, externalPatientId, onPatientChange }: PortalDashboardProps) {
  // Patient State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(externalPatientId || '');
  const [history, setHistory] = useState<ConceptualizationRecord[]>([]);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', age: 0, complaint: '' });
  const [patientError, setPatientError] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'standard' | 'copingcat' | 'rpd'>(type === 'protocols' ? 'standard' : 'standard');
  const [rpds, setRpds] = useState<any[]>([]);
  const [newRpd, setNewRpd] = useState({ situacao: '', pensamento: '', emocao: '', comportamento: '' });
  const [expandedRpd, setExpandedRpd] = useState<string | null>(null);

  useEffect(() => {
    if (selectedPatientId) {
      loadRpds(selectedPatientId);
    }
  }, [selectedPatientId]);

  const loadRpds = async (id: string) => {
    try {
      const data = await getRpds(id);
      setRpds(data || []);
    } catch (error) {
      console.error('Error loading RPDs:', error);
    }
  };

  const handleSaveRpd = async () => {
    if (!selectedPatientId || !newRpd.situacao) return;
    setLoading(true);
    try {
      await saveRpd(selectedPatientId, newRpd);
      setNewRpd({ situacao: '', pensamento: '', emocao: '', comportamento: '' });
      loadRpds(selectedPatientId);
      alert('RPD salvo com sucesso!');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filter State
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    if (externalPatientId) {
      setSelectedPatientId(externalPatientId);
    }
  }, [externalPatientId]);

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      loadHistory(selectedPatientId);
      if (type === 'conceptualization') {
        const p = patients.find(p => p.id === selectedPatientId);
        if (p && !input) {
          setInput(`Paciente: ${p.name}, ${p.age} anos.\nQueixa: ${p.complaint}`);
        }
      }
    }
  }, [selectedPatientId, type, patients]);

  const handlePatientSelect = (id: string) => {
    setSelectedPatientId(id);
    if (onPatientChange) onPatientChange(id);
  };

  const loadPatients = async () => {
    try {
      const data = await getPatients();
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadHistory = async (id: string) => {
    try {
      const data = await getConceptualizationHistory(id);
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleCreatePatient = async () => {
    setPatientError(null);
    if (!newPatient.name || newPatient.name.length < 3) {
      setPatientError('O nome deve ter pelo menos 3 caracteres.');
      return;
    }
    if (newPatient.age <= 0 || newPatient.age > 120) {
      setPatientError('Por favor, insira uma idade válida.');
      return;
    }
    if (!newPatient.complaint || newPatient.complaint.length < 5) {
      setPatientError('Por favor, descreva brevemente a queixa principal.');
      return;
    }

    try {
      const created = await createPatient(newPatient);
      setPatients([...patients, created]);
      setSelectedPatientId(created.id);
      setShowNewPatientForm(false);
      setNewPatient({ name: '', age: 0, complaint: '' });
    } catch (error) {
      console.error('Error creating patient:', error);
      setPatientError('Erro ao cadastrar paciente. Tente novamente.');
    }
  };

  const handleUpdatePatientInfo = async () => {
    if (!selectedPatientId || !input) return;
    setLoading(true);
    try {
      await updatePatient(selectedPatientId, { complaint: input });
      loadPatients();
      alert('Dados do paciente atualizados!');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      let res = '';
      if (type === 'conceptualization') {
        res = await generateConceptualization(input) || '';
        // Auto-save if patient selected
        if (selectedPatientId) {
          await saveConceptualization(selectedPatientId, input, res);
          loadHistory(selectedPatientId);
        }
      } else {
        if (activeTab === 'copingcat') {
          res = await generateCopingCatPlan(input) || '';
        } else {
          res = await generateGoldProtocol(input) || '';
        }
      }
      setResult(res);
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.message || 'Erro desconhecido';
      setResult(`Erro ao gerar conteúdo: ${errorMessage}. Verifique se a chave da API do Gemini está configurada corretamente no Netlify.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveManual = async () => {
    if (!selectedPatientId || !result || !input) return;
    setLoading(true);
    try {
      await saveConceptualization(selectedPatientId, input, result);
      loadHistory(selectedPatientId);
      alert('Conceituação salva com sucesso!');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionDetail = async (num: number) => {
    setLoading(true);
    try {
      const res = await generateSessionDetail(num, input);
      setResult(res || '');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (record: ConceptualizationRecord) => {
    setInput(record.input_data);
    setResult(record.result_text);
  };

  const filteredHistory = history.filter(record => {
    if (dateFilter === 'all') return true;
    const date = new Date(record.created_at);
    const now = new Date();
    if (dateFilter === 'today') return date.toDateString() === now.toDateString();
    if (dateFilter === 'week') return (now.getTime() - date.getTime()) < 7 * 24 * 60 * 60 * 1000;
    if (dateFilter === 'month') return (now.getTime() - date.getTime()) < 30 * 24 * 60 * 60 * 1000;
    return true;
  });

  const fillExample = () => {
    setInput(`Paciente: João, 28 anos.
Queixa: Ansiedade social intensa ao falar em reuniões de trabalho.
História: Sempre foi tímido, mas piorou após ser criticado por um chefe há 2 anos.
Pensamentos: "Vão perceber que estou nervoso", "Vou travar e ser demitido".
Comportamentos: Evita reuniões, fala o mínimo possível, ensaia falas por horas.`);
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-gray-900">
            {type === 'conceptualization' ? 'Conceituação de Caso' : 'Protocolos Terapêuticos'}
          </h2>
          <p className="text-gray-500 mt-1 text-sm lg:text-base">
            {type === 'conceptualization' 
              ? 'Mapeamento cognitivo estruturado baseado no modelo de Beck.' 
              : 'Guias práticos e protocolos baseados em evidências científicas.'}
          </p>
        </div>
        {type === 'conceptualization' && (
          <button 
            onClick={fillExample}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            Carregar Exemplo
          </button>
        )}
      </header>

      {type === 'conceptualization' && !isSupabaseConfigured() && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4 text-amber-800 text-sm shadow-sm"
        >
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Info size={20} className="text-amber-600" />
          </div>
          <p className="font-medium leading-relaxed">
            Banco de dados não configurado. As funções de salvar pacientes e histórico estão desativadas. 
            Configure <strong>VITE_SUPABASE_URL</strong> e <strong>VITE_SUPABASE_ANON_KEY</strong> nos Secrets.
          </p>
        </motion.div>
      )}

      {type === 'protocols' && (
        <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('standard')}
            className={`whitespace-nowrap px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${activeTab === 'standard' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Protocolos Gerais
          </button>
          <button 
            onClick={() => setActiveTab('copingcat')}
            className={`whitespace-nowrap px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${activeTab === 'copingcat' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Coping Cat
          </button>
          <button 
            onClick={() => setActiveTab('rpd')}
            className={`whitespace-nowrap px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${activeTab === 'rpd' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Registros (RPD)
          </button>
        </div>
      )}

      {type === 'conceptualization' && (
        <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('standard')}
            className={`whitespace-nowrap px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${activeTab === 'standard' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Conceituação
          </button>
          <button 
            onClick={() => setActiveTab('rpd')}
            className={`whitespace-nowrap px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${activeTab === 'rpd' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Registros (RPD)
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar for Patients & History */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Paciente Selecionado</label>
              <button 
                onClick={() => setShowNewPatientForm(!showNewPatientForm)}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
            
            {showNewPatientForm ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100"
              >
                <input 
                  type="text" 
                  placeholder="Nome Completo" 
                  value={newPatient.name}
                  onChange={e => setNewPatient({...newPatient, name: e.target.value})}
                  className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <input 
                  type="number" 
                  placeholder="Idade" 
                  value={newPatient.age || ''}
                  onChange={e => setNewPatient({...newPatient, age: parseInt(e.target.value)})}
                  className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <textarea 
                  placeholder="Queixa Principal" 
                  value={newPatient.complaint}
                  onChange={e => setNewPatient({...newPatient, complaint: e.target.value})}
                  className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none h-20"
                />
                {patientError && (
                  <p className="text-[10px] text-red-500 font-bold ml-1">{patientError}</p>
                )}
                <button 
                  onClick={handleCreatePatient}
                  className="w-full py-3 bg-emerald-600 text-white text-sm rounded-xl font-bold shadow-lg shadow-emerald-100"
                >
                  Finalizar Cadastro
                </button>
              </motion.div>
            ) : (
              <select 
                value={selectedPatientId}
                onChange={e => handlePatientSelect(e.target.value)}
                className="w-full text-sm p-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-bold text-gray-700"
              >
                <option value="">Selecionar Paciente...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          {selectedPatientId && history.length > 0 && (
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                  <History size={14} />
                  {type === 'conceptualization' ? 'Histórico Clínico' : 'Conceituações Salvas'}
                </h4>
                <select 
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value as any)}
                  className="text-[10px] font-bold border-none bg-gray-50 rounded-lg px-2 py-1 focus:ring-0 text-emerald-700"
                >
                  <option value="all">Tudo</option>
                  <option value="today">Hoje</option>
                  <option value="week">7 dias</option>
                  <option value="month">30 dias</option>
                </select>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {filteredHistory.map(record => (
                  <button
                    key={record.id}
                    onClick={() => {
                      if (type === 'protocols') {
                        setInput(record.result_text);
                        setResult(null);
                        alert('Conceituação carregada como contexto para o protocolo.');
                      } else {
                        loadFromHistory(record);
                      }
                    }}
                    className="w-full text-left p-4 rounded-2xl hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 transition-all group bg-gray-50/30"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                          {new Date(record.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                      <p className="text-[9px] font-bold text-gray-400">
                        {new Date(record.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-gray-800 line-clamp-1 mb-1">
                      {record.input_data.split('\n')[0]}
                    </p>
                    <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed italic">
                      {record.input_data.split('\n').slice(1).join(' ')}
                    </p>
                    {type === 'protocols' && (
                      <div className="mt-3 pt-2 border-t border-emerald-100/50 flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-tighter">
                        <Plus size={10} /> Usar como Contexto
                      </div>
                    )}
                  </button>
                ))}
                {filteredHistory.length === 0 && (
                  <div className="text-center py-8">
                    <History size={32} className="mx-auto text-gray-100 mb-2" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nenhum registro</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">
              {type === 'conceptualization' ? 'Dados para Análise' : 'Demanda Clínica'}
            </label>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={type === 'conceptualization' 
                ? "Descreva a história, queixas, pensamentos automáticos e comportamentos do paciente..." 
                : "Ex: TOC, Ansiedade Social, ou dados do paciente para Coping Cat..."}
              className="w-full h-64 p-5 rounded-2xl border border-gray-100 bg-gray-50/30 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm leading-relaxed font-medium"
            />
            
            <div className="space-y-3 mt-6">
              <button 
                onClick={handleGenerate}
                disabled={loading || !input.trim()}
                className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-100"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                Gerar {type === 'conceptualization' ? 'Conceituação' : 'Protocolo'}
              </button>

              {selectedPatientId && type === 'conceptualization' && (
                <button 
                  onClick={handleUpdatePatientInfo}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 text-emerald-600 border border-emerald-100 rounded-2xl text-xs font-bold hover:bg-emerald-50 transition-all"
                >
                  <Save size={16} />
                  Atualizar Prontuário
                </button>
              )}

              {selectedPatientId && type === 'protocols' && history.length > 0 && (
                <button 
                  onClick={() => {
                    setInput(history[0].result_text);
                    setResult(null);
                    alert('Última conceituação carregada como contexto!');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 text-emerald-600 border border-emerald-100 rounded-2xl text-xs font-bold hover:bg-emerald-50 transition-all"
                >
                  <Brain size={16} />
                  Puxar Última Conceituação
                </button>
              )}
            </div>
          </div>

          {activeTab === 'copingcat' && result && (
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold mb-6 flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <Calendar size={18} />
                </div>
                Detalhamento de Sessão
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(num => (
                  <button
                    key={num}
                    onClick={() => handleSessionDetail(num)}
                    className="py-3 text-xs font-bold border border-gray-100 rounded-xl hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm"
                  >
                    S{num}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Result Area */}
        <div className="lg:col-span-8">
          {activeTab === 'rpd' ? (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                    <Plus size={20} />
                  </div>
                  Novo Registro Psicológico Diário (RPD)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Situação</label>
                    <textarea 
                      value={newRpd.situacao}
                      onChange={e => setNewRpd({...newRpd, situacao: e.target.value})}
                      placeholder="O que aconteceu?"
                      className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 text-sm h-24 resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Pensamento Automático</label>
                    <textarea 
                      value={newRpd.pensamento}
                      onChange={e => setNewRpd({...newRpd, pensamento: e.target.value})}
                      placeholder="O que passou pela sua cabeça?"
                      className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 text-sm h-24 resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Emoção</label>
                    <textarea 
                      value={newRpd.emocao}
                      onChange={e => setNewRpd({...newRpd, emocao: e.target.value})}
                      placeholder="O que você sentiu?"
                      className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 text-sm h-24 resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Comportamento</label>
                    <textarea 
                      value={newRpd.comportamento}
                      onChange={e => setNewRpd({...newRpd, comportamento: e.target.value})}
                      placeholder="O que você fez?"
                      className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 text-sm h-24 resize-none"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleSaveRpd}
                  disabled={loading || !newRpd.situacao || !selectedPatientId}
                  className="w-full mt-6 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 disabled:opacity-50"
                >
                  Salvar RPD
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 px-2">Histórico de RPDs</h4>
                {rpds.map(rpd => (
                  <div 
                    key={rpd.id} 
                    className={`bg-white rounded-[2rem] shadow-sm border transition-all duration-300 overflow-hidden ${expandedRpd === rpd.id ? 'border-emerald-200 ring-4 ring-emerald-50' : 'border-gray-100 hover:border-emerald-100'}`}
                  >
                    <button 
                      onClick={() => setExpandedRpd(expandedRpd === rpd.id ? null : rpd.id)}
                      className="w-full text-left p-6 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                          <History size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                            {new Date(rpd.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-sm font-bold text-gray-800 line-clamp-1">
                            {rpd.situacao}
                          </p>
                        </div>
                      </div>
                      <div className={`p-2 rounded-lg bg-gray-50 text-gray-400 transition-transform duration-300 ${expandedRpd === rpd.id ? 'rotate-180 bg-emerald-50 text-emerald-600' : ''}`}>
                        <ChevronRight size={16} className="rotate-90" />
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedRpd === rpd.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <div className="px-6 pb-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-50">
                            <div className="space-y-2 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Situação</p>
                              <p className="text-sm font-medium text-gray-700 leading-relaxed">{rpd.situacao}</p>
                            </div>
                            <div className="space-y-2 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Pensamento Automático</p>
                              <p className="text-sm font-medium text-gray-700 leading-relaxed italic">"{rpd.pensamento}"</p>
                            </div>
                            <div className="space-y-2 p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Emoção</p>
                              <p className="text-sm font-medium text-gray-700 leading-relaxed">{rpd.emocao}</p>
                            </div>
                            <div className="space-y-2 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Comportamento</p>
                              <p className="text-sm font-medium text-gray-700 leading-relaxed">{rpd.comportamento}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
                {rpds.length === 0 && (
                  <div className="bg-white p-12 rounded-[2rem] border border-gray-100 text-center text-gray-400">
                    Nenhum RPD registrado para este paciente.
                  </div>
                )}
              </div>
            </div>
          ) : result ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 min-h-[800px] relative"
            >
              <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                    <FileText size={24} />
                  </div>
                  <div>
                    <span className="font-black uppercase tracking-[0.2em] text-[10px] text-gray-400 block mb-1">Análise Clínica</span>
                    <h3 className="font-bold text-gray-900">Relatório Estruturado</h3>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {selectedPatientId && type === 'conceptualization' && (
                    <button 
                      onClick={handleSaveManual}
                      className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                      title="Salvar no Histórico"
                    >
                      <Save size={22} />
                    </button>
                  )}
                  <button className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                    <Download size={22} />
                  </button>
                </div>
              </div>
              <div className="prose prose-emerald max-w-none prose-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-[2.5rem] h-[800px] flex flex-col items-center justify-center text-gray-400 p-12 text-center shadow-sm">
              <div className="p-8 bg-gray-50 rounded-[2rem] mb-6">
                <Brain size={64} className="text-gray-200" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Aguardando Processamento</h3>
              <p className="text-sm max-w-xs leading-relaxed font-medium">
                Preencha os dados clínicos ao lado para que a IA possa gerar uma análise detalhada e estruturada.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

