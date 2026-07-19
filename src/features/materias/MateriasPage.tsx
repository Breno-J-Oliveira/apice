import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMateriasStore } from '@shared/stores/useMateriasStore';
import { usePerfilStore } from '@shared/stores/usePerfilStore';
import { useSessoesStore } from '@shared/stores/useSessoesStore';
import { getAnoSemanaIso, calcularProgressoSemanal, metaConcluida } from '@core/engines/metaEngine';
import { NOMES_AREAS } from '@shared/types';
import type { Materia, Area } from '@shared/types';
import { cn, formatarMinutos, gerarId } from '@shared/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Plus, Archive, Edit3, ChevronDown, ChevronUp, Play, BookOpen, CheckCircle2,
  Clock, Target, SlidersHorizontal, Calculator,
} from 'lucide-react';

const AREAS: Area[] = ['linguagens', 'humanas', 'natureza', 'matematica', 'redacao'];
const DIAS_ESTUDO_SEMANA = 6; // padrão: 6 dias de estudo por semana

export default function MateriasPage() {
  const { perfilAtivo } = usePerfilStore();
  const { materias, subtopicos, atualizarMateria, arquivarMateria, adicionarSubtopico, atualizarSubtopico, removerSubtopico } = useMateriasStore();
  const { sessoes } = useSessoesStore();
  const navigate = useNavigate();
  const [expandedArea, setExpandedArea] = useState<Area | null>(null);
  const [editandoMateria, setEditandoMateria] = useState<string | null>(null);
  const [novoSubtopico, setNovoSubtopico] = useState<{ materiaId: string; nome: string } | null>(null);
  const [modoDistribuicao, setModoDistribuicao] = useState(false);

  const semanaAtual = perfilAtivo ? getAnoSemanaIso(new Date(), perfilAtivo.diaInicioSemana) : '';
  const materiasAtivas = materias.filter(m => !m.arquivada);

  // Total de horas semanais (soma das metas atuais)
  const totalMinutosSemana = materiasAtivas.reduce((s, m) => s + m.metaSemanalMinutos, 0);
  const totalHorasSemana = Math.round(totalMinutosSemana / 6) / 10; // arredonda a 1 decimal
  const minutosPorDia = Math.round(totalMinutosSemana / DIAS_ESTUDO_SEMANA);

  // Cálculo de total estudado na semana
  const totalEstudadoSemana = useMemo(() => {
    return sessoes
      .filter(s => s.semanaIso === semanaAtual && s.tipo === 'planejada')
      .reduce((s, sess) => s + sess.duracaoMinutos, 0);
  }, [sessoes, semanaAtual]);
  const progressoGeral = totalMinutosSemana > 0 ? Math.round((totalEstudadoSemana / totalMinutosSemana) * 100) : 0;

  // Dados para gráfico de pizza (distribuição)
  const dadosPizza = useMemo(() =>
    materiasAtivas.map(m => ({
      name: m.nome,
      value: m.metaSemanalMinutos,
      cor: m.cor,
      pct: totalMinutosSemana > 0 ? Math.round((m.metaSemanalMinutos / totalMinutosSemana) * 100) : 0,
    })).sort((a, b) => b.value - a.value),
    [materiasAtivas, totalMinutosSemana]
  );

  // Ajustar meta de uma matéria
  const ajustarMeta = async (id: string, deltaMinutos: number) => {
    const materia = materiasAtivas.find(m => m.id === id);
    if (!materia) return;
    const nova = Math.max(15, materia.metaSemanalMinutos + deltaMinutos);
    await atualizarMateria(id, { metaSemanalMinutos: nova });
  };

  // Definir meta em horas diretamente
  const definirMetaHoras = async (id: string, horas: number) => {
    const minutos = Math.round(horas * 60);
    await atualizarMateria(id, { metaSemanalMinutos: Math.max(15, minutos) });
  };

  // Ajuste proporcional do total
  const ajustarTotal = async (novoTotalMinutos: number) => {
    if (totalMinutosSemana === 0 || materiasAtivas.length === 0) return;
    const fator = novoTotalMinutos / totalMinutosSemana;
    for (const m of materiasAtivas) {
      const nova = Math.round(m.metaSemanalMinutos * fator);
      await atualizarMateria(m.id, { metaSemanalMinutos: Math.max(15, nova) });
    }
  };

  return (
    <div className="page-container max-w-4xl">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Metas e Matérias</h1>
          <p className="page-subtitle">
            {totalHorasSemana}h/semana · {formatarMinutos(minutosPorDia)}/dia · {progressoGeral}% concluído esta semana
          </p>
        </div>
        <button
          onClick={() => setModoDistribuicao(!modoDistribuicao)}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2',
            modoDistribuicao ? 'bg-accent text-white' : 'bg-bg-card border border-border text-text-secondary hover:bg-bg-hover'
          )}
        >
          <SlidersHorizontal size={16} />
          {modoDistribuicao ? 'Concluir ajustes' : 'Ajustar distribuição'}
        </button>
      </div>

      {/* Card resumo - Total da semana */}
      <motion.div layout className="card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Slider do total */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-accent" />
                <h3 className="font-serif text-lg font-semibold">Total da semana</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => ajustarTotal(Math.max(60, totalMinutosSemana - 60))}
                  className="w-8 h-8 rounded-lg border border-border text-text-muted hover:bg-bg-hover flex items-center justify-center text-lg"
                >−</button>
                <span className="text-xl font-bold text-text-primary min-w-[80px] text-center">
                  {totalHorasSemana}h
                </span>
                <button
                  onClick={() => ajustarTotal(totalMinutosSemana + 60)}
                  className="w-8 h-8 rounded-lg border border-border text-text-muted hover:bg-bg-hover flex items-center justify-center text-lg"
                >+</button>
              </div>
            </div>
            <input
              type="range"
              min="2"
              max="60"
              step="0.5"
              value={totalHorasSemana}
              onChange={e => ajustarTotal(Math.round(Number(e.target.value) * 60))}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>2h</span>
              <span>{formatarMinutos(minutosPorDia)} por dia ({DIAS_ESTUDO_SEMANA} dias)</span>
              <span>60h</span>
            </div>
          </div>

          {/* Gráfico de pizza - distribuição */}
          <div className="flex-shrink-0 flex items-center gap-4">
            <div className="w-[120px] h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dadosPizza} dataKey="value" cx="50%" cy="50%" outerRadius={55} innerRadius={35}>
                    {dadosPizza.map((d, i) => (
                      <Cell key={i} fill={d.cor} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: number) => formatarMinutos(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs space-y-1 max-h-[120px] overflow-auto">
              {dadosPizza.slice(0, 6).map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.cor }} />
                  <span className="text-text-secondary truncate max-w-[80px]">{d.name}</span>
                  <span className="text-text-muted">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Barra de progresso geral */}
        <div className="mt-4 pt-4 border-t border-border-light">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">Progresso da semana</span>
            <span className="text-sm font-medium text-text-primary">
              {formatarMinutos(totalEstudadoSemana)} de {formatarMinutos(totalMinutosSemana)}
            </span>
          </div>
          <div className="h-3 bg-bg-hover rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, progressoGeral)}%` }}
              className="h-full rounded-full bg-accent"
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </motion.div>

      {/* Distribuição por matéria */}
      <AnimatePresence>
        {modoDistribuicao && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="card mb-6 overflow-hidden"
          >
            <h3 className="font-serif text-lg font-semibold mb-4">Distribuição por matéria</h3>
            <div className="space-y-4">
              {materiasAtivas.map(materia => {
                const horas = materia.metaSemanalMinutos / 60;
                const pct = totalMinutosSemana > 0 ? Math.round((materia.metaSemanalMinutos / totalMinutosSemana) * 100) : 0;
                const minutosPorDiaMateria = Math.round(materia.metaSemanalMinutos / DIAS_ESTUDO_SEMANA);
                return (
                  <div key={materia.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: materia.cor }} />
                        <span className="text-sm font-medium text-text-primary">{materia.nome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => ajustarMeta(materia.id, -15)}
                          className="w-6 h-6 rounded border border-border text-text-muted hover:bg-bg-hover flex items-center justify-center text-sm"
                        >−</button>
                        <input
                          type="number"
                          value={horas}
                          onChange={e => definirMetaHoras(materia.id, Number(e.target.value))}
                          className="w-14 text-center text-sm font-bold text-text-primary bg-transparent border-b border-border outline-none"
                          min={0.25}
                          step={0.25}
                        />
                        <span className="text-xs text-text-muted">h</span>
                        <button
                          onClick={() => ajustarMeta(materia.id, 15)}
                          className="w-6 h-6 rounded border border-border text-text-muted hover:bg-bg-hover flex items-center justify-center text-sm"
                        >+</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={totalMinutosSemana}
                        value={materia.metaSemanalMinutos}
                        onChange={e => definirMetaHoras(materia.id, Number(e.target.value) / 60)}
                        className="flex-1 accent-accent"
                        style={{ accentColor: materia.cor }}
                      />
                      <span className="text-xs text-text-muted w-12 text-right">{pct}%</span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      ≈ {formatarMinutos(minutosPorDiaMateria)}/dia
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Matérias por área */}
      <div className="space-y-4">
        {AREAS.map(area => {
          const mats = materias.filter(m => m.area === area).sort((a, b) => (a.arquivada === b.arquivada ? 0 : a.arquivada ? 1 : -1));
          return (
            <motion.div key={area} layout className="card overflow-hidden">
              <button
                onClick={() => setExpandedArea(expandedArea === area ? null : area)}
                className="w-full flex items-center justify-between"
              >
                <h3 className="font-serif text-lg font-semibold text-text-primary text-left">{NOMES_AREAS[area]}</h3>
                {expandedArea === area ? <ChevronUp size={18} className="flex-shrink-0" /> : <ChevronDown size={18} className="flex-shrink-0" />}
              </button>

              <AnimatePresence>
                {expandedArea === area && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 pt-4">
                      {mats.map(materia => {
                        const acumulado = sessoes
                          .filter(s => s.materiaId === materia.id && s.semanaIso === semanaAtual && s.tipo === 'planejada')
                          .reduce((sum, s) => sum + s.duracaoMinutos, 0);
                        const progresso = calcularProgressoSemanal(acumulado, materia.metaSemanalMinutos);
                        const concluida = metaConcluida(acumulado, materia.metaSemanalMinutos);
                        const sub = subtopicos.filter(s => s.materiaId === materia.id);
                        const falta = Math.max(0, materia.metaSemanalMinutos - acumulado);

                        return (
                          <div key={materia.id} className={cn('p-3 rounded-xl border border-border-light', materia.arquivada && 'opacity-50')}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: materia.cor }} />
                                <span className="font-medium text-text-primary text-sm truncate">{materia.nome}</span>
                                {concluida && <CheckCircle2 size={14} className="text-success flex-shrink-0" />}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <span className="text-xs text-text-muted">
                                  {formatarMinutos(acumulado)}/{formatarMinutos(materia.metaSemanalMinutos)}
                                </span>
                                <button
                                  onClick={() => navigate(`/estudar/${materia.id}`)}
                                  className="p-1.5 rounded-lg hover:bg-bg-hover text-accent"
                                  aria-label="Estudar"
                                >
                                  <Play size={14} />
                                </button>
                                <button
                                  onClick={() => setEditandoMateria(editandoMateria === materia.id ? null : materia.id)}
                                  className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted"
                                  aria-label="Editar"
                                >
                                  <Edit3 size={14} />
                                </button>
                              </div>
                            </div>

                            {!concluida && (
                              <div className="h-1.5 bg-bg-hover rounded-full mb-2">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progresso}%` }}
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: materia.cor }}
                                />
                              </div>
                            )}
                            {concluida && (
                              <div className="h-1.5 bg-success/30 rounded-full mb-2">
                                <div className="h-full rounded-full bg-success w-full" />
                              </div>
                            )}

                            {!concluida && (
                              <p className="text-xs text-text-muted">Falta {formatarMinutos(falta)} esta semana</p>
                            )}

                            {/* Subtópicos */}
                            {sub.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {sub.map(st => (
                                  <div key={st.id} className="flex items-center gap-2 text-xs">
                                    <select
                                      value={st.status}
                                      onChange={e => atualizarSubtopico(st.id, { status: e.target.value as any })}
                                      className="px-1.5 py-0.5 rounded border border-border bg-bg text-xs"
                                    >
                                      <option value="nao_iniciado">Não iniciado</option>
                                      <option value="em_andamento">Em andamento</option>
                                      <option value="dominado">Dominado</option>
                                    </select>
                                    <span className="text-text-secondary flex-1 truncate">{st.nome}</span>
                                    <button onClick={() => removerSubtopico(st.id)} className="text-text-muted hover:text-danger text-xs">×</button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {novoSubtopico?.materiaId === materia.id ? (
                              <form
                                onSubmit={e => {
                                  e.preventDefault();
                                  if (novoSubtopico.nome.trim()) {
                                    adicionarSubtopico({ materiaId: materia.id, nome: novoSubtopico.nome.trim(), status: 'nao_iniciado' });
                                    setNovoSubtopico(null);
                                  }
                                }}
                                className="flex gap-1 mt-2"
                              >
                                <input autoFocus value={novoSubtopico.nome} onChange={e => setNovoSubtopico({ materiaId: materia.id, nome: e.target.value })} className="flex-1 px-2 py-1 text-xs rounded-lg border border-border bg-bg" placeholder="Subtópico" />
                                <button type="submit" className="text-xs text-accent font-medium">Add</button>
                              </form>
                            ) : (
                              <button onClick={() => setNovoSubtopico({ materiaId: materia.id, nome: '' })} className="text-xs text-accent hover:text-accent-hover mt-1 flex items-center gap-1">
                                <Plus size={12} /> Subtópico
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}