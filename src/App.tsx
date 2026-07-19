import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { usePerfilStore } from '@shared/stores/usePerfilStore';
import { useMateriasStore } from '@shared/stores/useMateriasStore';
import { useSessoesStore } from '@shared/stores/useSessoesStore';
import Layout from '@shared/components/Layout';
import PerfisPage from '@features/perfis/PerfisPage';
import OnboardingPage from '@features/perfis/OnboardingPage';
import DashboardPage from '@features/dashboard/DashboardPage';
import MateriasPage from '@features/materias/MateriasPage';
import EstudarPage from '@features/pomodoro/EstudarPage';
import AnotacoesPage from '@features/anotacoes/AnotacoesPage';
import RedacaoPage from '@features/redacao/RedacaoPage';
import SimuladosPage from '@features/simulados/SimuladosPage';
import SemanaPage from '@features/semana/SemanaPage';
import RelatoriosPage from '@features/relatorios/RelatoriosPage';
import ConfiguracoesPage from '@features/configuracoes/ConfiguracoesPage';
import ConquistasPage from '@features/conquistas/ConquistasPage';
import { executarRollover } from '@core/engines/weekRolloverEngine';
import { db } from '@core/db/database';
import { verificarConquistas } from '@core/engines/gamificationEngine';
import { calcularXPTotal, calcularNivel, calcularStreak } from '@core/engines/gamificationEngine';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Mountain } from 'lucide-react';

export default function App() {
  const { carregarPerfis, perfilAtivo, carregando, atualizarPerfil } = usePerfilStore();
  const { carregar: carregarMaterias, materias } = useMateriasStore();
  const { carregarTudo, sessoes, redacoes, simulados, flashcards, conquistas, adicionarConquistas } = useSessoesStore();

  useEffect(() => { carregarPerfis(); }, [carregarPerfis]);

  useEffect(() => {
    if (perfilAtivo) {
      carregarMaterias(perfilAtivo.id);
      carregarTudo(perfilAtivo.id);
      document.documentElement.setAttribute('data-theme', perfilAtivo.temaAtivo);
    }
  }, [perfilAtivo?.id]);

  // Processa virada de semana automaticamente
  useEffect(() => {
    if (!perfilAtivo || materias.length === 0) return;
    const resultado = executarRollover(perfilAtivo, materias, sessoes, [], new Date());
    if (resultado.semanasProcessadas.length > 0) {
      atualizarPerfil({ ultimaSemanaProcessada: resultado.semanaAtual });
      if (resultado.materiasComDeficit.length > 0) {
        toast.info(
          `${resultado.materiasComDeficit.length} matéria(s) com déficit na semana passada`,
          { description: 'Veja o Dashboard para redistribuir ou ignorar.' }
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfilAtivo?.id, materias.length > 0]);

  // Verifica conquistas sempre que dados relevantes mudam
  useEffect(() => {
    if (!perfilAtivo || sessoes.length === 0) return;
    const xpTotal = calcularXPTotal(sessoes, redacoes, flashcards.length, simulados);
    const { nivel } = calcularNivel(xpTotal);
    const { streak } = calcularStreak(sessoes, perfilAtivo.diasGracaStreakDisponiveis);

    const novas = verificarConquistas(perfilAtivo.id, conquistas, {
      streak, nivel, xpTotal, redacoes, simulados,
      flashcardsCount: flashcards.length,
      sessoes, sessoesCount: sessoes.length,
    });

    if (novas.length > 0) {
      adicionarConquistas(novas).then(() => {
        novas.forEach(c => {
          toast.success(`🏆 ${c.titulo}`, {
            description: c.descricao,
            duration: 5000,
          });
        });
      });
    }
  }, [perfilAtivo?.id, sessoes.length, redacoes.length, simulados.length, conquistas.length]);

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shadow-soft-lg mb-4">
            <Mountain size={28} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="font-serif text-2xl text-text-primary mb-1">Ápice</h1>
          <p className="text-text-muted text-sm">A carregar os seus dados...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={perfilAtivo ? <Navigate to="/dashboard" replace /> : <PerfisPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/materias" element={<MateriasPage />} />
        <Route path="/estudar" element={<EstudarPage />} />
        <Route path="/estudar/:materiaId" element={<EstudarPage />} />
        <Route path="/anotacoes" element={<AnotacoesPage />} />
        <Route path="/redacao" element={<RedacaoPage />} />
        <Route path="/simulados" element={<SimuladosPage />} />
        <Route path="/semana" element={<SemanaPage />} />
        <Route path="/conquistas" element={<ConquistasPage />} />
        <Route path="/relatorios" element={<RelatoriosPage />} />
        <Route path="/configuracoes" element={<ConfiguracoesPage />} />
      </Route>
    </Routes>
  );
}
