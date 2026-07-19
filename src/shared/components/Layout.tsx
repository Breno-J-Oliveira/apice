import { useState, useMemo } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerfilStore } from '@shared/stores/usePerfilStore';
import { useSessoesStore } from '@shared/stores/useSessoesStore';
import {
  LayoutDashboard, BookOpen, Timer, FileText, ClipboardCheck,
  Calendar, BarChart3, Settings, LogOut, Menu, X, PenTool, Trophy, Mountain,
  Sparkles,
} from 'lucide-react';
import { cn, formatarMinutos, truncar } from '@shared/lib/utils';
import { Toaster } from 'sonner';
import { useAtalhos } from '@shared/hooks/useAtalhos';
import { SessaoRapidaModal, SessaoRapidaBotao, useSessaoRapida } from '@shared/hooks/useSessaoRapida.tsx';
import { toast } from 'sonner';
import { differenceInDays } from 'date-fns';
import { useHeatmap } from '@shared/hooks/useHeatmap';
import { getAnoSemanaIso } from '@core/engines/metaEngine';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Painel', atalho: '1' },
  { to: '/estudar', icon: Timer, label: 'Estudar', atalho: '2' },
  { to: '/materias', icon: BookOpen, label: 'Matérias', atalho: '3' },
  { to: '/anotacoes', icon: PenTool, label: 'Anotações', atalho: '4' },
  { to: '/redacao', icon: FileText, label: 'Redação', atalho: '5' },
  { to: '/simulados', icon: ClipboardCheck, label: 'Simulados', atalho: '6' },
  { to: '/semana', icon: Calendar, label: 'Semana', atalho: '7' },
  { to: '/conquistas', icon: Trophy, label: 'Conquistas', atalho: '8' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  { to: '/configuracoes', icon: Settings, label: 'Config' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { perfilAtivo, setPerfilAtivo } = usePerfilStore();
  const { sessoes } = useSessoesStore();
  const navigate = useNavigate();
  const sessaoRapida = useSessaoRapida();

  const diasAteEvento = useMemo(() => {
    if (!perfilAtivo) return 0;
    return Math.max(0, differenceInDays(new Date(perfilAtivo.dataEvento), new Date()));
  }, [perfilAtivo]);

  const statsRapidas = useMemo(() => {
    if (!perfilAtivo) return { hoje: 0, semana: 0 };
    const hoje = new Date();
    const inicioHoje = new Date(hoje); inicioHoje.setHours(0, 0, 0, 0);
    const semana = getAnoSemanaIso(hoje, perfilAtivo.diaInicioSemana);
    const minutosHoje = sessoes
      .filter(s => new Date(s.timestampInicio) >= inicioHoje)
      .reduce((acc, s) => acc + s.duracaoMinutos, 0);
    const minutosSemana = sessoes
      .filter(s => s.semanaIso === semana)
      .reduce((acc, s) => acc + s.duracaoMinutos, 0);
    return { hoje: minutosHoje, semana: minutosSemana };
  }, [sessoes, perfilAtivo]);

  const heatmap = useHeatmap(sessoes, 28);

  // Atalhos de teclado
  useAtalhos({
    's': () => { sessaoRapida.abrir(); toast.dismiss(); },
    'g+d': () => navigate('/dashboard'),
    'g+e': () => navigate('/estudar'),
    'g+m': () => navigate('/materias'),
    'g+n': () => navigate('/anotacoes'),
    'g+r': () => navigate('/relatorios'),
    'g+s': () => navigate('/semana'),
    'g+c': () => navigate('/configuracoes'),
  });

  const sair = () => {
    setPerfilAtivo(null as any);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-bg">
      <Toaster
        position="bottom-right"
        theme="light"
        toastOptions={{
          style: {
            background: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-light)',
          },
        }}
        richColors
        closeButton
      />

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-bg-card border-r border-border-light">
        {/* Header com logo */}
        <div className="p-5 border-b border-border-light">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shadow-soft">
              <Mountain size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-lg font-semibold text-text-primary leading-tight">Ápice</h1>
              {perfilAtivo && (
                <p className="text-xs text-text-muted truncate">{truncar(perfilAtivo.nome, 24)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats rápidas */}
        {perfilAtivo && (
          <div className="p-4 border-b border-border-light space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Hoje</span>
              <span className="font-semibold text-text-primary">{formatarMinutos(statsRapidas.hoje)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">{perfilAtivo.nomeEvento}</span>
              <span className="font-semibold text-text-primary">{diasAteEvento}d</span>
            </div>
            {/* Mini heatmap */}
            <div className="flex gap-0.5 pt-1 flex-wrap">
              {heatmap.slice(-28).map((d, i) => {
                const cores = ['var(--color-bg-hover)', 'rgba(196,122,90,0.25)', 'rgba(196,122,90,0.45)', 'rgba(196,122,90,0.7)', 'var(--color-accent)'];
                return (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-sm"
                    style={{ backgroundColor: cores[d.intensidade] }}
                    title={`${d.totalMinutos}min`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Navegação */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-accent-soft text-accent'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              )}
            >
              <item.icon size={18} className="flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.atalho && (
                <kbd className="hidden xl:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-bg-hover text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.atalho}
                </kbd>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border-light space-y-1">
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all"
          >
            <Sparkles size={14} /> Reconfigurar perfil
          </button>
          <button
            onClick={sair}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-muted hover:text-danger hover:bg-bg-hover transition-all"
          >
            <LogOut size={18} /> Trocar perfil
          </button>
        </div>
      </aside>

      {/* Top bar mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-bg-card/80 backdrop-blur-md border-b border-border-light px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} aria-label="Abrir menu" className="p-1.5 -ml-1.5 rounded-lg hover:bg-bg-hover">
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center">
            <Mountain size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <h2 className="font-serif text-base font-semibold">Ápice</h2>
        </div>
        <div className="w-9" />
      </div>

      {/* Drawer mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-bg-card border-r border-border-light flex flex-col"
            >
              <div className="p-5 border-b border-border-light flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center">
                    <Mountain size={18} className="text-white" strokeWidth={2.5} />
                  </div>
                  <h1 className="font-serif text-lg font-semibold">Ápice</h1>
                </div>
                <button onClick={() => setSidebarOpen(false)} aria-label="Fechar menu" className="p-1.5 -mr-1.5 rounded-lg hover:bg-bg-hover">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                {navItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                      isActive ? 'bg-accent-soft text-accent' : 'text-text-secondary hover:bg-bg-hover'
                    )}
                  >
                    <item.icon size={18} /> {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="p-3 border-t border-border-light space-y-1">
                <button
                  onClick={() => { setSidebarOpen(false); navigate('/onboarding'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-text-muted hover:bg-bg-hover"
                >
                  <Sparkles size={14} /> Reconfigurar perfil
                </button>
                <button onClick={sair} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-muted hover:text-danger hover:bg-bg-hover">
                  <LogOut size={18} /> Trocar perfil
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Conteúdo */}
      <main className="flex-1 lg:pt-0 pt-14 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Sessão rápida */}
      <SessaoRapidaBotao onClick={sessaoRapida.abrir} />
      <SessaoRapidaModal aberto={sessaoRapida.aberto} onFechar={sessaoRapida.fechar} />
    </div>
  );
}
