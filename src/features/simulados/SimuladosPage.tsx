import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { usePerfilStore } from '@shared/stores/usePerfilStore';
import { useMateriasStore } from '@shared/stores/useMateriasStore';
import { useSessoesStore } from '@shared/stores/useSessoesStore';
import { executarSimulacao } from '@core/engines/simulacaoEngine';
import type { Area, Simulado } from '@shared/types';
import { NOMES_AREAS } from '@shared/types';
import { formatarData, formatarMinutos } from '@shared/lib/utils';
import { Plus, TrendingUp, AlertTriangle, CheckCircle, ClipboardCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AREAS: Area[] = ['linguagens', 'humanas', 'natureza', 'matematica', 'redacao'];

export default function SimuladosPage() {
  const { perfilAtivo } = usePerfilStore();
  const { materias } = useMateriasStore();
  const { sessoes, simulados, adicionarSimulado } = useSessoesStore();
  const [showForm, setShowForm] = useState(false);
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [acertos, setAcertos] = useState<Record<Area, number>>({ linguagens: 0, humanas: 0, natureza: 0, matematica: 0, redacao: 0 });
  const [totalPorArea, setTotalPorArea] = useState<Record<Area, number>>({ linguagens: 45, humanas: 45, natureza: 45, matematica: 45, redacao: 1 });
  void NOMES_AREAS;
  const [tempoMinutos, setTempoMinutos] = useState(330);
  const [notaTri, setNotaTri] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfilAtivo) return;
    await adicionarSimulado({
      perfilId: perfilAtivo.id,
      data,
      acertosPorArea: acertos,
      totalQuestoesPorArea: totalPorArea,
      tempoMinutos,
      notaTriEstimada: notaTri ? Number(notaTri) : undefined,
    });
    setShowForm(false);
  };

  // Simulação
  const metasHoras: Record<string, number> = {};
  materias.forEach(m => { metasHoras[m.id] = 60; });
  const simulacao = useMemo(() => {
    if (!perfilAtivo) return null;
    return executarSimulacao(materias, sessoes, perfilAtivo.dataEvento, metasHoras, perfilAtivo.nomeEvento);
  }, [perfilAtivo, materias, sessoes]);

  // Dados para gráfico de evolução
  const dadosEvolucao = simulados.map(s => ({
    data: formatarData(s.data),
    ...Object.fromEntries(AREAS.map(a => {
      const totais = s.totalQuestoesPorArea[a] ?? 0;
      const acertos = s.acertosPorArea[a] ?? 0;
      return [a, totais > 0 ? Math.round((acertos / totais) * 100) : 0];
    })),
  }));

  return (
    <div className="page-container max-w-3xl">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Simulados</h1>
          <p className="page-subtitle">{simulados.length} simulados registrados</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Novo simulado
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.form
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          onSubmit={handleSubmit}
          className="card mb-6 space-y-3"
        >
          <input type="date" value={data} onChange={e => setData(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-sm" />
          <div className="grid grid-cols-2 gap-2">
            {AREAS.filter(a => a !== 'redacao').map(area => (
              <div key={area}>
                <label className="text-xs text-text-muted">{NOMES_AREAS[area].split(',')[0]}</label>
                <div className="flex gap-1">
                  <input
                    type="number" min={0}
                    value={acertos[area]}
                    onChange={e => setAcertos(prev => ({ ...prev, [area]: Number(e.target.value) }))}
                    className="w-16 px-2 py-1.5 rounded-lg border border-border bg-bg text-sm"
                    placeholder="Acertos"
                  />
                  <span className="text-text-muted text-sm py-1.5">/</span>
                  <input
                    type="number" min={0}
                    value={totalPorArea[area]}
                    onChange={e => setTotalPorArea(prev => ({ ...prev, [area]: Number(e.target.value) }))}
                    className="w-16 px-2 py-1.5 rounded-lg border border-border bg-bg text-sm"
                    placeholder="Total"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-text-muted">Tempo (min)</label>
              <input type="number" value={tempoMinutos} onChange={e => setTempoMinutos(Number(e.target.value))} className="w-full px-2 py-1.5 rounded-lg border border-border bg-bg text-sm" />
            </div>
            <div>
              <label className="text-xs text-text-muted">Nota TRI (opcional)</label>
              <input type="number" value={notaTri} onChange={e => setNotaTri(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-border bg-bg text-sm" placeholder="Ex: 720" />
            </div>
          </div>
          <button type="submit" className="w-full py-2 rounded-xl bg-accent text-white text-sm font-medium">Registrar simulado</button>
        </motion.form>
      )}

      {/* Gráfico de evolução */}
      {simulados.length > 1 && (
        <div className="card mb-6">
          <h3 className="font-serif text-lg font-semibold mb-4">Evolução por área (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosEvolucao}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
              <XAxis dataKey="data" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              {AREAS.filter(a => a !== 'redacao').map((area, i) => (
                <Bar key={area} dataKey={area} name={NOMES_AREAS[area]?.split(',')[0] ?? area} fill={['var(--color-accent)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-danger)'][i] ?? 'var(--color-accent)'} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Simulador "E se" */}
      {simulacao && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-accent" />
            <h3 className="font-serif text-lg font-semibold">E se eu continuar assim?</h3>
          </div>
          <p className="text-sm text-text-secondary mb-4">{simulacao.resumo}</p>
          <div className="space-y-2">
            {simulacao.projecoes.map(p => (
              <div key={p.materiaId} className="flex items-center justify-between p-3 rounded-xl bg-bg-hover/50">
                <div className="flex items-center gap-2">
                  {p.noRitmo ? <CheckCircle size={14} className="text-success" /> : <AlertTriangle size={14} className="text-warning" />}
                  <span className="text-sm font-medium text-text-primary">{p.nome}</span>
                </div>
                <div className="text-right text-xs">
                  <p className="text-text-secondary">{p.horasProjetadasAteProva}h projetadas · meta {p.metaHoras}h</p>
                  {p.deficitHoras > 0 && <p className="text-warning">-{p.deficitHoras}h de déficit</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico */}
      <div className="card">
        <h3 className="font-serif text-lg font-semibold mb-4">Histórico de simulados</h3>
        {simulados.length === 0 ? (
          <p className="text-text-muted text-sm">Nenhum simulado registrado.</p>
        ) : (
          <div className="space-y-2">
            {simulados.slice().reverse().map(s => {
              const totalAcertos = Object.values(s.acertosPorArea).reduce((a, b) => a + b, 0);
              const totalQuestoes = Object.values(s.totalQuestoesPorArea).reduce((a, b) => a + b, 0);
              return (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-bg-hover/50">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{formatarData(s.data)}</p>
                    <p className="text-xs text-text-muted">
                      {totalAcertos}/{totalQuestoes} acertos · {formatarMinutos(s.tempoMinutos)}
                      {s.notaTriEstimada && ` · TRI: ${s.notaTriEstimada}`}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-accent">
                    {totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : 0}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}