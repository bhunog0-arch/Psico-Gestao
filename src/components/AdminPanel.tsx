import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserPlus, Mail, Lock, Loader2, ShieldCheck, Info } from 'lucide-react';
import { signUp } from '../services/supabase';

export default function AdminPanel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ type: 'error', text: 'Por favor, insira um e-mail válido para o profissional.' });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password);
      setMessage({ 
        type: 'success', 
        text: `Profissional ${email} cadastrado com sucesso! Um e-mail de confirmação pode ter sido enviado.` 
      });
      setEmail('');
      setPassword('');
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Erro ao cadastrar profissional.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Painel do Administrador</h2>
        <p className="text-gray-500 mt-1">Gerenciamento de acesso e novos profissionais.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <UserPlus size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Cadastrar Novo Profissional</h3>
              <p className="text-xs text-gray-500">Crie uma conta para um novo membro da equipe.</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">E-mail do Profissional</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@psicogestao.com"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-medium text-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Senha Temporária</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-medium text-gray-700"
                />
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                <Info size={18} />
                {message.text}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
              Finalizar Cadastro
            </button>
          </form>
        </motion.section>

        <section className="space-y-6">
          <div className="bg-emerald-900 p-8 rounded-[2.5rem] shadow-xl text-white">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white/10 rounded-2xl">
                <ShieldCheck size={24} />
              </div>
              <h4 className="text-xl font-bold">Controle de Acesso</h4>
            </div>
            <ul className="space-y-4 text-emerald-100/80 text-sm">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5"></div>
                Apenas você (Admin) pode criar novas contas.
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5"></div>
                Cada profissional terá seu próprio banco de dados isolado.
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5"></div>
                Recomende que os profissionais alterem suas senhas no primeiro acesso.
              </li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-900 mb-4">Status do Sistema</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-xs font-bold text-gray-500">Banco de Dados</span>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg">ONLINE</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-xs font-bold text-gray-500">Autenticação</span>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg">ATIVO</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
