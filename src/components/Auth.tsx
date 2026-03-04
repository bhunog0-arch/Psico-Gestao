import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Loader2, Stethoscope, ArrowRight, UserPlus, LogIn, Info } from 'lucide-react';
import { signIn, signUp } from '../services/supabase';

interface AuthProps {
  onSuccess: () => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) && email.toLowerCase() !== 'brego') {
      setError('Por favor, insira um e-mail válido.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    // Admin mapping
    let loginEmail = email.trim();
    const isBrego = loginEmail.toLowerCase() === 'brego';
    if (isBrego) {
      loginEmail = 'brego@admin.com';
    }

    try {
      await signIn(loginEmail, password);
      onSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.message || '';
      
      // Automatic Admin Creation Fallback (First time setup)
      if (isBrego) {
        if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('Email not confirmed')) {
          try {
            await signUp(loginEmail, password);
            setError('Conta Admin inicializada! IMPORTANTE: Verifique seu e-mail para confirmar o cadastro ou desative "Confirm Email" no painel do Supabase.');
            return;
          } catch (signUpErr: any) {
            const signUpMsg = signUpErr.message || '';
            if (signUpMsg.includes('already registered')) {
              if (errorMessage.includes('Email not confirmed')) {
                setError('E-mail do Admin ainda não confirmado. Verifique sua caixa de entrada ou desative a confirmação no Supabase.');
              } else {
                setError('Senha incorreta para o usuário Admin.');
              }
            } else {
              setError('Erro no cadastro Admin: ' + signUpMsg);
            }
            return;
          }
        }
      }
      
      setError(errorMessage.includes('Invalid login credentials') ? 'Usuário ou senha inválidos.' : errorMessage || 'Erro ao acessar o portal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 lg:mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 bg-emerald-600 rounded-2xl text-white shadow-xl shadow-emerald-200 mb-4 lg:mb-6">
            <Stethoscope size={28} className="lg:w-8 lg:h-8" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">PsicoGestão AI</h1>
          <p className="text-gray-500 mt-2 font-medium text-sm lg:text-base">A inteligência clínica ao seu alcance.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-100"
        >
          <div className="flex items-center justify-center gap-2 mb-6 lg:mb-8">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <LogIn size={18} className="lg:w-5 lg:h-5" />
            </div>
            <h2 className="text-lg lg:text-xl font-bold text-gray-900">Acesso Restrito</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Usuário ou E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu login profissional"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-medium text-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Senha</label>
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

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <div className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100">
                    {error}
                  </div>
                  {email.toLowerCase().trim() === 'brego' && (
                    <div className="text-[10px] text-amber-600 font-bold bg-amber-50 p-3 rounded-xl border border-amber-100 space-y-2">
                      <div className="flex items-center gap-2">
                        <Info size={12} />
                        <span>Instruções para o Administrador:</span>
                      </div>
                      <ul className="list-disc ml-4 space-y-1">
                        <li>O login é <strong>brego</strong> e a senha é <strong>142020</strong>.</li>
                        <li>Se for o primeiro acesso, o sistema criará a conta automaticamente.</li>
                        <li><strong>IMPORTANTE:</strong> Se aparecer "Email not confirmed", você deve ir ao painel do Supabase e confirmar o usuário <code>brego@admin.com</code> ou desativar "Confirm Email" em Authentication &rarr; Settings.</li>
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 lg:py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 group text-sm lg:text-base"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Acessar Portal
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        <p className="text-center mt-8 text-gray-400 text-xs font-medium">
          Ambiente seguro e criptografado para profissionais de saúde mental.
        </p>
      </div>
    </div>
  );
}
