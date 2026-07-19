import { motion } from 'framer-motion';
import { useSessoesStore } from '@shared/stores/useSessoesStore';
import { usePerfilStore } from '@shared/stores/usePerfilStore';
import { PageHeader } from '@shared/components/PageHeader';
import { EmptyState } from '@shared/components/EmptyState';
import { Trophy, Lock, Sparkles } from 'lucide-react';
import { formatarDataCurta, cn } from '@shared/lib/utils';
import type { TipoConquista } from '@shared/types';

interface ConquistaInfo {
  tipo: TipoConquista;
  titulo: string;
  descricao: string;
  icone: string;
  cor: string;
}

const TODAS_CONQUISTAS: ConquistaInfo[] = [
  { tipo: 'primeira_sessao', titulo: 'Primeira Sessão', descricao: 'Começou a sua jornada de estudos', icone: '🎯', cor: 'from-accent to-warning' },
  { tipo: 'primeira_anotacao', titulo: 'Primeira Anotação', descricao: 'Criou a sua primeira anotação', icone: '📝', cor: 'from-accent to-success' },
  { tipo: 'streak_7_dias', titulo: 'Uma Semana de Foco', descricao: '7 dias consecutivos a estudar', icone: '🔥', cor: 'from-warning to-danger' },
  { tipo: 'streak_30_dias', titulo: '30 Dias de Foco', descricao: '30 dias consecutivos a estudar', icone: '🔥', cor: 'from-warning to-danger' },
  { tipo: 'streak_100_dias', titulo: '100 Dias de Foco', descricao: '100 dias consecutivos — lenda', icone: '🏆', cor: 'from-warning to-accent' },
  { tipo: '10_horas_estudo', titulo: '10 Horas de Estudo', descricao: 'Acumulou 10 horas de estudo', icone: '⏱️', cor: 'from-accent to-success' },
  { tipo: '50_horas_estudo', titulo: '50 Horas de Estudo', descricao: 'Acumulou 50 horas de estudo', icone: '⏱️', cor: 'from-accent to-warning' },
  { tipo: '100_horas_estudo', titulo: '100 Horas de Estudo', descricao: 'Acumulou 100 horas de estudo', icone: '⏱️', cor: 'from-warning to-accent' },
  { tipo: 'primeiro_simulado', titulo: 'Primeiro Simulado', descricao: 'Completou o primeiro simulado', icone: '📋', cor: 'from-accent to-warning' },
  { tipo: 'primeira_redacao_900', titulo: 'Redação Nota 900+', descricao: 'Atingiu 900 pontos ou mais numa redação', icone: '✍️', cor: 'from-success to-accent' },
  { tipo: 'nivel_5', titulo: 'Nível 5', descricao: 'Atingiu o nível 5', icone: '⭐', cor: 'from-warning to-accent' },
  { tipo: 'nivel_10', titulo: 'Nível 10', descricao: 'Atingiu o nível 10', icone: '🌟', cor: 'from-accent to-warning' },
  { tipo: 'madrugador', titulo: 'Madrugador', descricao: 'Estudou entre 4h e 7h da manhã', icone: '🌅', cor: 'from-warning to-accent' },
  { tipo: 'noturno', titulo: 'Noturno', descricao: 'Estudou entre 22h e 2h da manhã', icone: '🌙', cor: 'from-accent to-success' },
];

export default function ConquistasPage() {
  const { conquistas } = useSessoesStore();
  const { perfilAtivo } = usePerfilStore();

  const tiposObtidos = new Set(conquistas.map(c => c.tipo));
  const desbloqueadas = conquistas.length;
  const total = TODAS_CONQUISTAS.length;
  const progresso = total > 0 ? Math.round((desbloqueadas / total) * 100) : 0;

  return (
    <div className="page-container max-w-4xl">
      <PageHeader
        titulo="Conquistas"
        subtitulo={`${desbloqueadas} de ${total} desbloqueadas · ${progresso}% completo`}
      />

      {/* Barra de progresso */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-warning" />
            <h3 className="font-serif text-base font-semibold">Progresso geral</h3>
          </div>
          <span className="text-sm font-bold text-text-primary">{progresso}%</span>
        </div>
        <div className="h-3 bg-bg-hover rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progresso}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-warning to-accent"
          />
        </div>
        {desbloqueadas > 0 && (
          <p className="text-xs text-text-muted mt-2">
            Última conquista: <span className="text-text-primary font-medium">
              {conquistas[conquistas.length - 1]?.titulo}
            </span>
          </p>
        )}
      </motion.div>

      {/* Grid de conquistas */}
      {TODAS_CONQUISTAS.length === 0 ? (
        <EmptyState titulo="Sem conquistas" descricao="Continue a estudar para desbloquear." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {TODAS_CONQUISTAS.map((c, i) => {
            const desbloqueada = tiposObtidos.has(c.tipo);
            const data = conquistas.find(co => co.tipo === c.tipo);
            return (
              <motion.div
                key={c.tipo}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  'card text-center p-4 transition-all',
                  desbloqueada
                    ? 'border-accent/30'
                    : 'opacity-50 grayscale'
                )}
              >
                <div className={cn(
                  'w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-3',
                  desbloqueada
                    ? `bg-gradient-to-br ${c.cor}`
                    : 'bg-bg-hover'
                )}>
                  {desbloqueada ? c.icone : <Lock size={20} className="text-text-muted" />}
                </div>
                <h4 className="font-serif text-sm font-semibold text-text-primary mb-1">
                  {c.titulo}
                </h4>
                <p className="text-xs text-text-secondary leading-tight mb-2">
                  {c.descricao}
                </p>
                {desbloqueada && data && (
                  <p className="text-[10px] text-text-muted mt-1 flex items-center justify-center gap-1">
                    <Sparkles size={10} />
                    {formatarDataCurta(data.desbloqueadaEm)}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
