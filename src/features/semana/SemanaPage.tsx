import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePerfilStore } from '@shared/stores/usePerfilStore';
import { useMateriasStore } from '@shared/stores/useMateriasStore';
import { useSessoesStore } from '@shared/stores/useSessoesStore';
import { getAnoSemanaIso } from '@core/engines/metaEngine';
import type { BlocoPlanejamento, Materia } from '@shared/types';
import { gerarId, formatarMinutos, cn } from '@shared/lib/utils';
import { PageHeader } from '@shared/components/PageHeader';
import { EmptyState } from '@shared/components/EmptyState';
import { ConfirmDialog, useConfirm } from '@shared/components/ConfirmDialog';
import { Plus, Trash2, CheckCircle2, Play, X, ChevronDown, ChevronUp } from 'lucide-react';
import { startOfWeek, addDays, format, isToday } from 'date-fns';
import { toast } from 'sonner';

function totalMinutosSemana(materias: Materia[]): number {
  return materias.reduce((s, m) => s + m.metaSemanalMinutos, 0);
}

export default function SemanaPage() {
  const { perfilAtivo } = usePerfilStore();
  const { materias } = useMateriasStore();
  const { sessoes, planejamento, salvarPlanejamento } = useSessoesStore();
  const navigate = useNavigate();
  const [novoBloco, setNovoBloco] = useState<{ diaSemana: number; materiaId: string; duracao: number } | null>(null);
  const [expandido, setExpandido] = useState<number | null>(new Date().getDay());
  const { pedirConfirmacao, dialog } = useConfirm();

  const semanaAtual = perfilAtivo ? getAnoSemanaIso(new Date(), perfilAtivo.diaInicioSemana) : '';
  const inicioSemana = startOfWeek(new Date(), { weekStartsOn: perfilAtivo?.diaInicioSemana ?? 1 });

  const dias = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const data = addDays(inicioSemana, i);
      return {
        label: format(data, 'EEEE'),
        labelCurto: format(data, 'dd/MM'),
        data,
        isoStr: data.toISOString().split('T')[0],
        hoje: isToday(data),
      };
    }),
    [inicioSemana]
  );

  const materiasAtivas = useMemo(() => materias.filter(m => !m.arquivada), [materias]);

  const blocosPorDia = useMemo(() => {
    const map: Record<number, BlocoPlanejamento[]> = {};
    for (let i = 0; i < 7; i++) {
      map[i] = planejamento.filter(b => b.diaSemana === i && b.semanaIso === semanaAtual);
    }
    return map;
  }, [planejamento, semanaAtual]);

  const sessoesPorDia = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of sessoes) {
      const dia = s.timestampInicio.split('T')[0];
      map[dia] = (map[dia] || 0) + s.duracaoMinutos;
    }
    return map;
  }, [sessoes]);

  const adicionarBloco = async (diaSemana: number) => {
    if (!novoBloco || !perfilAtivo) return;
    if (!novoBloco.materiaId) {
      toast.error('Selecione uma matéria');
      return;
    }
    const bloco: BlocoPlanejamento = {
      id: gerarId(),
      perfilId: perfilAtivo.id,
      diaSemana,
      materiaId: novoBloco.materiaId,
      duracaoEstimadaMinutos: novoBloco.duracao,
      concluido: false,
      semanaIso: semanaAtual,
    };
    await salvarPlanejamento([...planejamento, bloco]);
    setNovoBloco(null);
    toast.success('Bloco adicionado');
  };

  const removerBloco = (id: string) => {
    pedirConfirmacao({
      titulo: 'Remover bloco?',
      descricao: 'Esta ação não pode ser revertida.',
      onConfirmar: async () => {
        await salvarPlanejamento(planejamento.filter(b => b.id !== id));
        toast.success('Bloco removido');
      },
    });
  };

  const alternarConcluido = async (bloco: BlocoPlanejamento) => {
    await salvarPlanejamento(
      planejamento.map(b => b.id === bloco.id ? { ...b, concluido: !b.concluido } : b)
    );
  };

  const totalPlanejado = useMemo(() =>
    Object.values(blocosPorDia).flat().reduce((s, b) => s + b.duracaoEstimadaMinutos, 0),
    [blocosPorDia]
  );
  const totalRealizado = useMemo(() =>
    Object.values(sessoesPorDia).reduce((s, v) => s + v, 0),
    [sessoesPorDia]
  );

  if (materiasAtivas.length === 0) {
    return (
      <div className="page-container max-w-4xl">
        <PageHeader titulo="Planeamento Semanal" />
        <EmptyState
          titulo="Sem matérias ativas"
          descricao="Adicione matérias para começar a planear a sua semana."
          acao={<button onClick={() => navigate('/materias')} className="btn-primary">Ir para Matérias</button>}
        />
      </div>
    );
  }

  return (
    <div className="page-container max-w-4xl">
      <PageHeader
        titulo="Planeamento Semanal"
        subtitulo={`Semana ${semanaAtual} · ${formatarMinutos(totalRealizado)} realizados de ${formatarMinutos(totalPlanejado || totalMinutosSemana(materiasAtivas))} planeados`}
      />

      {/* Resumo */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-lg font-semibold">Resumo da semana</h3>
          <span className="text-sm text-text-muted">
            {totalRealizado > 0 && totalPlanejado > 0
              ? `${Math.round((totalRealizado / totalPlanejado) * 100)}% cumprido`
              : totalPlanejado === 0 ? 'Sem plano ainda' : 'Aguardando...'}
          </span>
        </div>
        <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${totalPlanejado > 0 ? Math.min(100, (totalRealizado / totalPlanejado) * 100) : 0}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-accent to-success"
          />
        </div>
      </motion.div>

      {/* Dias */}
      <div className="space-y-3">
        {dias.map((dia, i) => {
          const blocos = blocosPorDia[i] || [];
          const planejadoTotal = blocos.reduce((s, b) => s + b.duracaoEstimadaMinutos, 0);
          const realizado = sessoesPorDia[dia.isoStr] || 0;
          const cumpriu = planejadoTotal > 0 && realizado >= planejadoTotal;
          const aberto = expandido === i;

          return (
            <motion.div
              key={dia.isoStr}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={cn('card overflow-hidden', dia.hoje && 'border-accent/50 ring-1 ring-accent/20')}
            >
              <button
                onClick={() => setExpandido(aberto ? null : i)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-semibold text-text-primary text-sm capitalize">
                    {dia.label}
                    <span className="text-text-muted font-normal ml-1.5">· {dia.labelCurto}</span>
                  </h3>
                  {dia.hoje && (
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent-soft text-accent font-semibold">
                      Hoje
                    </span>
                  )}
                  {cumpriu && (
                    <CheckCircle2 size={14} className="text-success flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-muted whitespace-nowrap">
                    {realizado > 0 && `${formatarMinutos(realizado)} / `}{formatarMinutos(planejadoTotal)}
                  </span>
                  {aberto ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
                </div>
              </button>

              <AnimatePresence>
                {aberto && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 space-y-2">
                      {blocos.map(bloco => {
                        const materia = materias.find(m => m.id === bloco.materiaId);
                        return (
                          <div
                            key={bloco.id}
                            className={cn(
                              'flex items-center gap-2 p-2.5 rounded-lg text-sm transition-colors',
                              bloco.concluido ? 'bg-success/10' : 'bg-bg-hover/50'
                            )}
                          >
                            <button
                              onClick={() => alternarConcluido(bloco)}
                              className="flex-shrink-0"
                              aria-label="Marcar concluído"
                            >
                              <CheckCircle2
                                size={16}
                                className={bloco.concluido ? 'text-success' : 'text-text-muted hover:text-text-secondary'}
                              />
                            </button>
                            {materia && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: materia.cor }} />}
                            <span className="text-text-secondary flex-1 truncate">{materia?.nome ?? 'Matéria'}</span>
                            <span className="text-text-muted text-xs whitespace-nowrap">{formatarMinutos(bloco.duracaoEstimadaMinutos)}</span>
                            <button
                              onClick={() => materia && irParaEstudo(materia.id)}
                              className="p-1 rounded hover:bg-bg-hover text-accent"
                              aria-label="Estudar"
                            >
                              <Play size={12} />
                            </button>
                            <button
                              onClick={() => removerBloco(bloco.id)}
                              className="p-1 rounded hover:bg-danger/10 text-text-muted hover:text-danger"
                              aria-label="Remover"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        );
                      })}
                      {blocos.length === 0 && (
                        <p className="text-xs text-text-muted italic px-1">Nenhum bloco planejado</p>
                      )}

                      {novoBloco?.diaSemana === i ? (
                        <div className="flex flex-wrap gap-2 items-center p-2 rounded-lg bg-accent-soft/30 border border-accent/20">
                          <select
                            value={novoBloco.materiaId}
                            onChange={e => setNovoBloco(prev => prev ? { ...prev, materiaId: e.target.value } : null)}
                            className="flex-1 min-w-[120px] px-2 py-1.5 text-xs rounded-lg border border-border bg-bg"
                          >
                            <option value="">Matéria</option>
                            {materiasAtivas.map(m => (
                              <option key={m.id} value={m.id}>{m.nome}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            value={novoBloco.duracao}
                            onChange={e => setNovoBloco(prev => prev ? { ...prev, duracao: Number(e.target.value) } : null)}
                            className="w-20 px-2 py-1.5 text-xs rounded-lg border border-border bg-bg"
                            placeholder="min"
                            min={15}
                            step={15}
                          />
                          <button
                            onClick={() => adicionarBloco(i)}
                            className="px-3 py-1.5 text-xs rounded-lg bg-accent text-white font-medium"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setNovoBloco(null)}
                            className="p-1.5 rounded-lg border border-border text-text-muted"
                            aria-label="Cancelar"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setNovoBloco({ diaSemana: i, materiaId: materiasAtivas[0]?.id ?? '', duracao: 30 })}
                          className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
                        >
                          <Plus size={12} /> Adicionar bloco
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {dialog}
    </div>
  );

  function irParaEstudo(materiaId: string) {
    navigate(`/estudar/${materiaId}`);
  }
}
