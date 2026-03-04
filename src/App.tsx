import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Brain, 
  BookOpen, 
  Gamepad2, 
  LayoutDashboard, 
  PlusCircle, 
  Search,
  ChevronRight,
  FileText,
  Stethoscope,
  Cat,
  MessageSquare,
  Loader2,
  RefreshCw,
  Bell,
  Settings,
  LogOut,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PortalDashboard from './components/PortalDashboard';
import TexRPG from './components/TexRPG';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel';
import { getPatients, isSupabaseConfigured, getCurrentUser, signOut, getDashboardStats } from './services/supabase';
import { Patient } from './types';
import { User } from '@supabase/supabase-js';

type View = 'dashboard' | 'patients' | 'conceptualization' | 'protocols' | 'rpg' | 'admin';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  const ADMIN_EMAIL = 'brego@admin.com';
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        loadPatients();
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setPatients([]);
    setSelectedPatientId('');
    setCurrentView('dashboard');
  };

  const loadPatients = async () => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    try {
      const data = await getPatients();
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProntuario = (id: string) => {
    setSelectedPatientId(id);
    setCurrentView('conceptualization');
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-[#FDFDFD] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Auth onSuccess={checkUser} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Pacientes', icon: Users },
    { id: 'conceptualization', label: 'Conceituação', icon: Brain },
    { id: 'protocols', label: 'Protocolos', icon: BookOpen },
    { id: 'rpg', label: 'RPG Terapêutico', icon: Gamepad2 },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Settings }] : []),
  ];

  return (
    <div className="flex h-screen bg-[#FDFDFD] text-[#121212] font-sans selection:bg-emerald-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Stethoscope size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-none">PsicoGestão</h1>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                {isAdmin ? 'Painel Admin' : 'Clinical AI'}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                currentView === item.id
                  ? 'text-emerald-700 font-bold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {currentView === item.id && (
                <motion.div 
                  layoutId="activeNavBg"
                  className="absolute inset-0 bg-emerald-50 rounded-xl -z-10 shadow-sm shadow-emerald-100/50"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon size={19} className={`transition-transform duration-300 ${currentView === item.id ? 'scale-110 text-emerald-600' : 'group-hover:scale-110'}`} />
              <span className="text-sm">{item.label}</span>
              {currentView === item.id && (
                <motion.div 
                  layoutId="activeNavDot"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-600 shadow-[0_0_8px_rgba(5,150,105,0.5)]"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-gray-50">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50 border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {isAdmin ? 'AD' : user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {isAdmin ? 'Brego Admin' : user.email?.split('@')[0]}
              </p>
              <p className="text-[10px] text-gray-500 font-medium">
                {isAdmin ? 'Administrador' : 'Profissional'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-[#FAFAFA]">
        {/* Top Header */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="capitalize">{currentView}</span>
            {selectedPatientId && currentView !== 'admin' && (
              <>
                <ChevronRight size={14} />
                <span className="text-emerald-600 font-medium">
                  {patients.find(p => p.id === selectedPatientId)?.name || 'Paciente'}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-6 w-px bg-gray-200"></div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="p-8 max-w-7xl mx-auto"
          >
            {currentView === 'dashboard' && <DashboardOverview setView={setCurrentView} />}
            {currentView === 'patients' && (
              <PatientsList 
                patients={patients} 
                loading={loading} 
                selectedId={selectedPatientId}
                onSelect={setSelectedPatientId}
                onViewProntuario={handleViewProntuario}
                refresh={loadPatients}
              />
            )}
            {currentView === 'conceptualization' && (
              <PortalDashboard 
                type="conceptualization" 
                externalPatientId={selectedPatientId} 
                onPatientChange={setSelectedPatientId}
              />
            )}
            {currentView === 'protocols' && <PortalDashboard type="protocols" />}
            {currentView === 'rpg' && <TexRPG />}
            {currentView === 'admin' && isAdmin && <AdminPanel />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function DashboardOverview({ setView }: { setView: (v: View) => void }) {
  const [stats, setStats] = useState({ activePatients: 0, todaySessions: 0, savedProtocols: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const data = await getDashboardStats();
      setStats(data);
      setLoading(false);
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">Painel Clínico</h2>
          <p className="text-gray-500 mt-2 text-lg">Visão geral das suas atividades e pacientes.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
            Exportar Relatório
          </button>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 flex items-center gap-2">
            <PlusCircle size={18} />
            Nova Sessão
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard 
          title="Pacientes Ativos" 
          value={loading ? "..." : stats.activePatients.toString()} 
          icon={Users} 
          color="emerald" 
          trend="Total cadastrado" 
        />
        <StatCard 
          title="Sessões Hoje" 
          value={loading ? "..." : stats.todaySessions.toString()} 
          icon={MessageSquare} 
          color="blue" 
          trend="Agendadas para hoje" 
        />
        <StatCard 
          title="Protocolos Salvos" 
          value={loading ? "..." : stats.savedProtocols.toString()} 
          icon={BookOpen} 
          color="amber" 
          trend="Conceituações geradas" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Brain size={22} />
              </div>
              Acesso Rápido
            </h3>
            <button className="text-sm font-semibold text-emerald-600 hover:underline">Ver todas</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <QuickAction 
              title="Nova Conceituação" 
              desc="Gerar mapa cognitivo Beck completo" 
              icon={Brain}
              onClick={() => setView('conceptualization')}
            />
            <QuickAction 
              title="Protocolo Padrão-Ouro" 
              desc="Guia de tratamento baseado em evidências" 
              icon={BookOpen}
              onClick={() => setView('protocols')}
            />
            <QuickAction 
              title="Coping Cat" 
              desc="Protocolo de ansiedade para todas as idades" 
              icon={Cat}
              onClick={() => setView('protocols')}
            />
            <QuickAction 
              title="Histórico Clínico" 
              desc="Consultar registros e evoluções" 
              icon={FileText}
              onClick={() => setView('patients')}
            />
          </div>
        </section>

        <section className="bg-emerald-900 p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 bg-emerald-800/20 rounded-full blur-3xl -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                <Gamepad2 size={32} />
              </div>
              <div>
                <h4 className="text-xl font-bold">RPG Terapêutico</h4>
                <p className="text-emerald-300 text-sm">A Busca do Girassol</p>
              </div>
            </div>
            <p className="text-emerald-100/80 text-sm leading-relaxed mb-8">
              Engaje seus pacientes com uma jornada gamificada de TCC. Ideal para trabalhar pensamentos automáticos e enfrentamento.
            </p>
            <button 
              onClick={() => setView('rpg')}
              className="mt-auto w-full py-4 bg-white text-emerald-900 rounded-2xl font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 group/btn shadow-lg"
            >
              Iniciar Sessão de Jogo
              <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
  const colors: any = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 group hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-4 rounded-2xl ${colors[color]} border transition-transform group-hover:scale-110 duration-300`}>
          <Icon size={28} />
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{trend}</span>
      </div>
      <div>
        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-1">{title}</p>
        <p className="text-4xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function QuickAction({ title, desc, icon: Icon, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-4 p-5 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group text-left"
    >
      <div className="p-3 bg-gray-50 rounded-xl text-gray-400 group-hover:bg-white group-hover:text-emerald-600 group-hover:shadow-sm transition-all">
        <Icon size={22} />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-900 group-hover:text-emerald-800 transition-colors">{title}</h4>
        <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
      </div>
      <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-600 transition-all group-hover:translate-x-1" />
    </button>
  );
}

function PatientsList({ patients, loading, selectedId, onSelect, onViewProntuario, refresh }: any) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'waiting' | 'followup'>('all');

  const filtered = patients.filter((p: Patient) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                         p.complaint.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'waiting': return 'Espera';
      case 'followup': return 'Acompanhamento';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'waiting': return 'bg-amber-100 text-amber-700';
      case 'followup': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Meus Pacientes</h2>
          <p className="text-gray-500 mt-1">Gerencie seu cadastro e histórico clínico.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={refresh}
            className="p-3 text-gray-400 hover:bg-gray-100 rounded-2xl transition-all active:rotate-180 duration-500"
          >
            <RefreshCw size={20} />
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
            <PlusCircle size={20} />
            Novo Paciente
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-3 flex-1 w-full">
            <Search size={20} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou queixa..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-base w-full placeholder:text-gray-400 font-medium"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Filtrar:</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="waiting">Em Espera</option>
              <option value="followup">Acompanhamento</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="p-24 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="animate-spin mb-4 text-emerald-500" size={32} />
            <p className="text-sm font-medium tracking-wide">Sincronizando dados...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50">
                  <th className="px-8 py-5 font-bold">Nome do Paciente</th>
                  <th className="px-8 py-5 font-bold">Idade</th>
                  <th className="px-8 py-5 font-bold">Queixa Principal</th>
                  <th className="px-8 py-5 font-bold">Status</th>
                  <th className="px-8 py-5 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p: Patient) => (
                  <tr 
                    key={p.id} 
                    onClick={() => onSelect(p.id)}
                    className={`transition-all cursor-pointer group ${
                      selectedId === p.id ? 'bg-emerald-50/50' : 'hover:bg-gray-50/50'
                    }`}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
                          selectedId === p.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-emerald-100 group-hover:text-emerald-600'
                        }`}>
                          {p.name.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-gray-500 font-medium">{p.age} anos</td>
                    <td className="px-8 py-6">
                      <p className="text-sm text-gray-600 line-clamp-1 max-w-xs">{p.complaint}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${getStatusColor(p.status)}`}>
                        {getStatusLabel(p.status)}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        {selectedId === p.id ? (
                          <motion.button 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewProntuario(p.id);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                          >
                            <FileText size={14} />
                            Ver Prontuário
                          </motion.button>
                        ) : (
                          <button className="text-gray-400 hover:text-emerald-600 text-xs font-bold transition-colors uppercase tracking-widest">
                            Selecionar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-300">
                        <Users size={48} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium">Nenhum paciente encontrado</p>
                        <p className="text-sm mt-1">Tente ajustar sua busca ou adicione um novo paciente.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
