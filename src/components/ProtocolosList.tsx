import React, { useState, useRef } from 'react';
import { BookOpen, Loader2, ChevronRight, X, Download, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateGoldProtocol, generateCopingCatPlan } from '../services/gemini';
import { saveConceptualization } from '../services/supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PROTOCOLS = [
  { id: 'toc', title: 'TOC (Transtorno Obsessivo-Compulsivo)', description: 'Protocolo baseado em Exposição e Prevenção de Resposta (EPR).', type: 'gold' },
  { id: 'ansiedade-social', title: 'Ansiedade Social', description: 'Protocolo focado em reestruturação cognitiva e exposição social.', type: 'gold' },
  { id: 'depressao', title: 'Depressão Maior', description: 'Protocolo de Ativação Comportamental e Reestruturação Cognitiva.', type: 'gold' },
  { id: 'coping-cat', title: 'Coping Cat (Ansiedade Infantil/Juvenil)', description: 'Protocolo estruturado de 16 sessões para crianças e adolescentes.', type: 'coping' },
  { id: 'panico', title: 'Transtorno de Pânico', description: 'Foco em psicoeducação do pânico e exposição interoceptiva.', type: 'gold' },
  { id: 'tag', title: 'Ansiedade Generalizada (TAG)', description: 'Protocolo focado em tolerância à incerteza e preocupação.', type: 'gold' },
];

interface ProtocolosListProps {
  patientId?: string;
  onSave?: () => void;
}

export default function ProtocolosList({ patientId, onSave }: ProtocolosListProps) {
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const handleViewDetails = async (protocol: any) => {
    setLoading(true);
    setSelectedProtocol(protocol);
    try {
      let result = '';
      if (protocol.type === 'gold') {
        result = await generateGoldProtocol(protocol.title);
      } else {
        result = await generateCopingCatPlan('Paciente padrão para visualização de protocolo.');
      }
      setContent(result);
    } catch (error) {
      console.error(error);
      alert('Erro ao carregar detalhes do protocolo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProtocol = async () => {
    if (!patientId || !content || !selectedProtocol) return;
    setSaving(true);
    try {
      await saveConceptualization(patientId, `Protocolo: ${selectedProtocol.title}`, content);
      if (onSave) onSave();
      alert('Protocolo salvo no histórico do paciente!');
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar protocolo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!modalContentRef.current || !content) return;
    
    setLoading(true);
    try {
      const canvas = await html2canvas(modalContentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const fileName = `Protocolo_${selectedProtocol.id}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROTOCOLS.map((p) => (
          <motion.div 
            key={p.id}
            whileHover={{ y: -4 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <BookOpen size={24} />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{p.title}</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed line-clamp-2">{p.description}</p>
            <button 
              onClick={() => handleViewDetails(p)}
              className="w-full py-3 bg-gray-50 text-gray-900 rounded-xl font-bold text-sm hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2 group/btn"
            >
              Ver Detalhes
              <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedProtocol && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <BookOpen size={20} />
                  </div>
                  <h2 className="text-xl font-black text-gray-900">{selectedProtocol.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  {patientId && content && !loading && (
                    <button 
                      onClick={handleSaveProtocol}
                      disabled={saving}
                      className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                      title="Salvar no Histórico"
                    >
                      {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    </button>
                  )}
                  {content && !loading && (
                    <button 
                      onClick={handleDownloadPDF}
                      className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                      title="Baixar PDF"
                    >
                      <Download size={20} />
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setSelectedProtocol(null);
                      setContent(null);
                    }}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-emerald-600" size={48} />
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Consultando IA Clínica...</p>
                  </div>
                ) : (
                  <div ref={modalContentRef} className="prose prose-emerald max-w-none markdown-body p-4 bg-white">
                    <div className="mb-8 border-b-2 border-emerald-100 pb-4">
                      <h1 className="text-2xl font-bold text-emerald-800 mb-2">{selectedProtocol.title}</h1>
                      <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        <span>Referência: Protocolo Padrão-Ouro</span>
                        <span>Data: {new Date().toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {content || ''}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
