import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { usePerfilStore } from '@shared/stores/usePerfilStore';
import { useMateriasStore } from '@shared/stores/useMateriasStore';
import { useSessoesStore } from '@shared/stores/useSessoesStore';
import { calcularXPTotal, calcularNivel } from '@core/engines/gamificationEngine';
import { formatarMinutos, formatarData, cn } from '@shared/lib/utils';
import { PageHeader } from '@shared/components/PageHeader';
import { EmptyState } from '@shared/components/EmptyState';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, FileText, Filter, Sparkles, Timer, Zap, Download } from 'lucide-react';
import { startOfWeek, startOfMonth, subWeeks } from 'date-fns';
import { toast } from 'sonner';

type Periodo = 'semana' | 'mes' | '30dias' | 'tudo';

const ROTULOS: Record<Periodo, string> = {
  semana: 'Esta semana',
  mes: 'Este mês',
  '30dias': '30 dias',
  tudo: 'Todo o período',
};

export default function RelatoriosPage() {
  const { perfilAtivo } = usePerfilStore();
  const { materias } = useMateriasStore();
  const { sessoes, redacoes, simulados, anotacoes } = useSessoesStore();
  const [periodo, setPeriodo] = useState<Periodo>('mes');

  const hoje = new Date();

  const dataInicio = useMemo(() => {
    switch (periodo) {
      case 'semana': return startOfWeek(hoje, { weekStartsOn: 1 });
      case 'mes': return startOfMonth(hoje);
      case '30dias': return subWeeks(hoje, 4);
      case 'tudo': return new Date(0);
    }
  }, [periodo]);

  const sessoesFiltradas = useMemo(() =>
    sessoes.filter(s => new Date(s.timestampInicio) >= dataInicio),
    [sessoes, dataInicio]
  );

  const horasPorMateria = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of sessoesFiltradas) {
      map[s.materiaId] = (map[s.materiaId] || 0) + s.duracaoMinutos;
    }
    return Object.entries(map)
      .map(([materiaId, minutos]) => {
        const materia = materias.find(m => m.id === materiaId);
        return { name: materia?.nome ?? '?', value: Math.round(minutos / 6) / 10, cor: materia?.cor ?? '#ccc' };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [sessoesFiltradas, materias]);

  const horasPorDia = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of sessoesFiltradas) {
      const dia = s.timestampInicio.split('T')[0];
      map[dia] = (map[dia] || 0) + s.duracaoMinutos;
    }
    return Object.entries(map)
      .map(([dia, minutos]) => ({ dia: formatarData(dia), horas: Math.round(minutos / 6) / 10 }))
      .slice(-14);
  }, [sessoesFiltradas]);

  const xp = useMemo(() => calcularXPTotal(sessoesFiltradas, redacoes, anotacoes.length, simulados), [sessoesFiltradas, redacoes, anotacoes, simulados]);
  const { nivel } = useMemo(() => calcularNivel(xp), [xp]);
  const totalMinutos = sessoesFiltradas.reduce((s, sess) => s + sess.duracaoMinutos, 0);
  const totalSessoes = sessoesFiltradas.length;
  const mediaDiaria = totalSessoes > 0 ? Math.round(totalMinutos / Math.max(1, horasPorDia.length)) : 0;

  const exportarCSV = () => {
    try {
      const linhas = ['Data;Matéria;Minutos;Tipo;Origem;Nota'];
      for (const s of sessoesFiltradas) {
        const materia = materias.find(m => m.id === s.materiaId)?.nome ?? '?';
        linhas.push(`${s.timestampInicio};${materia};${s.duracaoMinutos};${s.tipo};${s.origem};${s.nota ?? ''}`);
      }
      const blob = new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apice-relatorio-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Relatório CSV exportado');
    } catch {
      toast.error('Erro ao exportar');
    }
  };

  return (
    <div className="page-container max-w-4xl">
      <PageHeader
        titulo="Relatórios"
        subtitulo="Análise detalhada do seu estudo"
        acao={
          <button onClick={exportarCSV} disabled={totalSessoes === 0} className="btn-outline disabled:opacity-50">
            <Download size={16} /> CSV
          </button>
        }
      />

      {/* Filtros de período */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
        <Filter size={14} className="text-text-muted flex-shrink-0" />
        {(Object.keys(ROTULOS) as Periodo[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
              periodo === p
                ? 'bg-accent text-white'
                : 'bg-bg-card border border-border text-text-secondary hover:bg-bg-hover'
            )}
          >
            {ROTULOS[p]}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icone={Timer} label="Horas" valor={formatarMinutos(totalMinutos)} suffix={`${totalSessoes} sessões`} cor="text-accent" />
        <StatCard icone={Zap} label="XP ganho" valor={xp} suffix={`Nível ${nivel}`} cor="text-warning" />
        <StatCard icone={BarChart3} label="Média diária" valor={formatarMinutos(mediaDiaria)} suffix="no período" cor="text-success" />
        <StatCard icone={Sparkles} label="Matérias" valor={horasPorMateria.length} suffix="tocadas" cor="text-accent" />
      </div>

      {totalSessoes === 0 ? (
        <EmptyState
          titulo="Sem dados neste período"
          descricao="Ajuste o filtro acima ou comece a estudar para gerar relatórios."
        />
      ) : (
        <>
          {/* Gráficos */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {horasPorMateria.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
                <h3 className="font-serif text-lg font-semibold mb-4">Horas por matéria</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={horasPorMateria} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                      {horasPorMateria.map((d, i) => (
                        <Cell key={i} fill={d.cor} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                      formatter={(v: number) => `${v}h`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 text-xs space-y-1 max-h-24 overflow-y-auto">
                  {horasPorMateria.slice(0, 5).map(d => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.cor }} />
                      <span className="text-text-secondary truncate flex-1 min-w-0">{d.name}</span>
                      <span className="text-text-muted font-medium">{d.value}h</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {horasPorDia.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
                <h3 className="font-serif text-lg font-semibold mb-4">Horas por dia</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={horasPorDia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                    <XAxis dataKey="dia" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                    <Tooltip contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }} formatter={(v: number) => `${v}h`} />
                    <Bar dataKey="horas" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </div>

          {/* Sessões recentes */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card">
            <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText size={18} className="text-accent" />
              Sessões recentes
            </h3>
            <div className="space-y-1">
              {sessoesFiltradas.slice(-15).reverse().map(sessao => {
                const materia = materias.find(m => m.id === sessao.materiaId);
                return (
                  <div key={sessao.id} className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-bg-hover transition-colors">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {materia && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: materia.cor }} />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary truncate">{materia?.nome ?? 'Matéria'}</p>
                        <p className="text-xs text-text-muted">{formatarData(sessao.timestampInicio)}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-text-primary">{formatarMinutos(sessao.duracaoMinutos)}</p>
                      <p className="text-xs text-text-muted capitalize">
                        {sessao.tipo}{sessao.nota ? ` · ${truncate(sessao.nota, 30)}` : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
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

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + '…';
}
