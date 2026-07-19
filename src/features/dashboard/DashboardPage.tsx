import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePerfilStore } from '@shared/stores/usePerfilStore';
import { useMateriasStore } from '@shared/stores/useMateriasStore';
import { useSessoesStore } from '@shared/stores/useSessoesStore';
import { useAnimatedNumber } from '@shared/hooks/useAnimatedNumber';
import { useSessoesPorMateriaSemana } from '@shared/hooks/useSessoesPorMateriaSemana';
import { Heatmap } from '@shared/components/Heatmap';
import { PageHeader } from '@shared/components/PageHeader';
import { BarraProgressoMateria } from '@shared/components/BarraProgressoMateria';
import { EmptyState } from '@shared/components/EmptyState';
import { calcularPrioridades, PESOS_PADRAO } from '@core/engines/priorizacaoEngine';
import { calcularXPTotal, calcularNivel, calcularStreak } from '@core/engines/gamificationEngine';
import { getAnoSemanaIso } from '@core/engines/metaEngine';
import { executarSimulacao } from '@core/engines/simulacaoEngine';
import { formatarMinutos, cn } from '@shared/lib/utils';
import { differenceInDays } from 'date-fns';
import {
  Clock, Zap, Flame, PenTool, ArrowRight, TrendingUp, Timer, Sparkles, Trophy, Target,
} from 'lucide-react';

export default function DashboardPage() {
  const { perfilAtivo } = usePerfilStore();
  const { materias, subtopicos } = useMateriasStore();
  const { sessoes, anotacoes, redacoes, simulados } = useSessoesStore();

  const hoje = new Date();
  const semanaAtual = perfilAtivo ? getAnoSemanaIso(hoje, perfilAtivo.diaInicioSemana) : '';
  const diasAteEvento = perfilAtivo ? Math.max(0, differenceInDays(new Date(perfilAtivo.dataEvento), hoje)) : 0;
  const nomeEvento = perfilAtivo?.nomeEvento || 'o evento';

  const materiasAtivas = useMemo(() => materias.filter(m => !m.arquivada), [materias]);
  const materiasComProgresso = useSessoesPorMateriaSemana(materiasAtivas, sessoes, semanaAtual);

  const prioridades = useMemo(() => {
    if (!perfilAtivo) return [];
    return calcularPrioridades(perfilAtivo, materias, subtopicos, sessoes, semanaAtual, PESOS_PADRAO, hoje);
  }, [perfilAtivo, materias, subtopicos, sessoes, semanaAtual]);

  const xpTotal = useMemo(() => calcularXPTotal(sessoes, redacoes, 0, simulados), [sessoes, redacoes, simulados]);
  const { nivel, xpAtual, xpProximoNivel, progressoPct: progressoNivel } = useMemo(() => calcularNivel(xpTotal), [xpTotal]);

  const { streak, diasGracaRestantes } = useMemo(() => {
    if (!perfilAtivo) return { streak: 0, diasGracaRestantes: 0 };
    return calcularStreak(sessoes, perfilAtivo.diasGracaStreakDisponiveis, hoje);
  }, [sessoes, perfilAtivo]);

  const materiasEmDia = materiasComProgresso.filter(m => m.concluida).length;
  const totalMinutosSemana = materiasComProgresso.reduce((s, m) => s + m.metaSemanalMinutos, 0);
  const totalAcumuladoSemana = materiasComProgresso.reduce((s, m) => s + m.acumulado, 0);
  const progressoGeral = totalMinutosSemana > 0
    ? Math.round((totalAcumuladoSemana / totalMinutosSemana) * 100)
    : 0;

  const simulacao = useMemo(() => {
    if (!perfilAtivo) return null;
    const metasHoras: Record<string, number> = {};
    materiasAtivas.forEach(m => { metasHoras[m.id] = 60; });
    return executarSimulacao(materiasAtivas, sessoes, perfilAtivo.dataEvento, metasHoras, nomeEvento, hoje);
  }, [perfilAtivo, materiasAtivas, sessoes]);

  const xpAnimado = useAnimatedNumber(xpTotal, 800);
  const streakAnimado = useAnimatedNumber(streak, 600);

  if (!perfilAtivo) return null;

  if (materiasAtivas.length === 0) {
    return (
      <div className="page-container max-w-4xl">
        <PageHeader titulo={`Olá, ${perfilAtivo.nome}`} subtitulo="Vamos configurar as suas matérias" />
        <EmptyState
          titulo="Ainda não tem matérias"
          descricao="Configure as suas matérias para começar a acompanhar o seu progresso."
          acao={<Link to="/materias" className="btn-primary inline-flex">Configurar matérias</Link>}
        />
      </div>
    );
  }

  return (
    <div className="page-container max-w-4xl">
      <PageHeader
        titulo={`Olá, ${perfilAtivo.nome.split(' ')[0]}`}
        subtitulo={`${diasAteEvento} dias para ${nomeEvento} · ${materiasEmDia === materiasAtivas.length ? 'Todas as metas em dia 🎉' : `${materiasAtivas.length - materiasEmDia} abaixo da meta`}`}
        acao={
          <Link to="/estudar" className="btn-primary">
            <Clock size={16} /> Estudar agora
          </Link>
        }
      />

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icone={Zap} label="XP" valor={xpAnimado} suffix={`Nível ${nivel} · ${progressoNivel}%`} cor="text-warning" />
        <StatCard icone={Flame} label="Streak" valor={streakAnimado} suffix={`${diasGracaRestantes} ${diasGracaRestantes === 1 ? 'dia de graça' : 'dias de graça'}`} cor={streak > 0 ? 'text-warning' : 'text-text-muted'} />
        <StatCard icone={Timer} label="Esta semana" valor={formatarMinutos(totalAcumuladoSemana)} suffix={`${progressoGeral}% da meta`} cor="text-accent" />
        <StatCard icone={Target} label="Sessões" valor={sessoes.length} suffix="no total" cor="text-success" />
      </div>

      {/* Barra de progresso do nível (XP) */}
      {xpProximoNivel > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              <h3 className="font-serif text-base font-semibold">Progresso de nível</h3>
            </div>
            <span className="text-xs text-text-muted">
              {formatarMinutos(xpAtual)} / {formatarMinutos(xpProximoNivel)} XP
            </span>
          </div>
          <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressoNivel}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-accent to-warning"
            />
          </div>
        </motion.div>
      )}

      {/* Heatmap de consistência */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <Flame size={18} className="text-accent" />
          <h3 className="font-serif text-lg font-semibold">Consistência</h3>
          <span className="text-xs text-text-muted ml-auto">últimos 90 dias</span>
        </div>
        <Heatmap sessoes={sessoes} dias={90} />
      </motion.div>

      {/* Prioridades */}
      {prioridades.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-accent" />
            <h3 className="font-serif text-lg font-semibold">O que estudar agora</h3>
          </div>
          <div className="space-y-2">
            {prioridades.slice(0, 5).map((p, i) => {
              const materia = materias.find(m => m.id === p.materiaId);
              if (!materia) return null;
              return (
                <Link
                  key={p.materiaId}
                  to={`/estudar/${p.materiaId}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-bg-hover transition-colors group"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: materia.cor + '30', color: materia.cor }}
                  >
                    {i + 1}º
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary text-sm">{materia.nome}</p>
                    <p className="text-xs text-text-muted truncate">{p.motivo}</p>
                  </div>
                  <ArrowRight size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Metas da semana */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-semibold">Metas desta semana</h3>
          <Link to="/materias" className="text-xs text-accent hover:text-accent-hover">Ajustar</Link>
        </div>
        <div className="space-y-3">
          {materiasComProgresso.length === 0 ? (
            <p className="text-sm text-text-muted">Sem matérias configuradas.</p>
          ) : (
            materiasComProgresso.map(m => (
              <BarraProgressoMateria
                key={m.id}
                cor={m.cor}
                nome={m.nome}
                acumulado={m.acumulado}
                meta={m.metaSemanalMinutos}
                mostrarFalta
                tamanho="md"
              />
            ))
          )}
        </div>
      </motion.div>

      {/* Projeção até o evento */}
      {simulacao && simulacao.projecoes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className={cn(
            'card mb-6 border-l-4',
            simulacao.status === 'otimo' && 'border-l-success',
            simulacao.status === 'bom' && 'border-l-accent',
            simulacao.status === 'atencao' && 'border-l-warning',
            simulacao.status === 'critico' && 'border-l-danger'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-serif text-lg font-semibold">Projeção até {nomeEvento}</h3>
            <Link to="/simulados" className="text-xs text-accent hover:text-accent-hover inline-flex items-center gap-1">
              Detalhes <ArrowRight size={12} />
            </Link>
          </div>
          <p className="text-sm text-text-secondary">{simulacao.resumo}</p>
        </motion.div>
      )}
    </div>
  );
}

function StatCard({ icone: Icone, label, valor, suffix, cor }: {
  icone: React.ElementType;
  label: string;
  valor: string | number;
  suffix: string;
  cor?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card flex flex-col gap-1"
    >
      <div className="flex items-center gap-1.5 text-text-muted text-xs">
        <Icone size={14} className={cor} />
        {label}
      </div>
      <span className="text-xl sm:text-2xl font-bold text-text-primary">{valor}</span>
      <span className="text-xs text-text-muted truncate">{suffix}</span>
    </motion.div>
  );
}
