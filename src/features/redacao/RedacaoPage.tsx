import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerfilStore } from '@shared/stores/usePerfilStore';
import { useSessoesStore } from '@shared/stores/useSessoesStore';
import type { NotasRedacao, Redacao } from '@shared/types';
import { formatarData, totalRedacao as calcularTotalRedacao, cn } from '@shared/lib/utils';
import { PageHeader } from '@shared/components/PageHeader';
import { EmptyState } from '@shared/components/EmptyState';
import { ConfirmDialog, useConfirm } from '@shared/components/ConfirmDialog';
import { Plus, FileText, TrendingUp, Trash2, X, Award, BookOpen } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { toast } from 'sonner';

const COMPETENCIAS = [
  { key: 'competencia1' as const, label: 'Norma culta', desc: 'Domínio da escrita formal' },
  { key: 'competencia2' as const, label: 'Compreensão', desc: 'Leitura e entendimento do tema' },
  { key: 'competencia3' as const, label: 'Argumentação', desc: 'Defesa de ponto de vista' },
  { key: 'competencia4' as const, label: 'Coesão', desc: 'Articulação entre partes' },
  { key: 'competencia5' as const, label: 'Proposta', desc: 'Intervenção detalhada' },
];

export default function RedacaoPage() {
  const { perfilAtivo } = usePerfilStore();
  const { redacoes, adicionarRedacao, removerRedacao } = useSessoesStore();
  const [showForm, setShowForm] = useState(false);
  const [visualizando, setVisualizando] = useState<string | null>(null);
  const [tema, setTema] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [textoRedacao, setTextoRedacao] = useState('');
  const [notas, setNotas] = useState<NotasRedacao>({ competencia1: 0, competencia2: 0, competencia3: 0, competencia4: 0, competencia5: 0 });
  const [feedback, setFeedback] = useState('');
  const { pedirConfirmacao, dialog } = useConfirm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema.trim() || !perfilAtivo) {
      toast.error('Preencha o tema da redação');
      return;
    }
    try {
      await adicionarRedacao({
        perfilId: perfilAtivo.id,
        tema: tema.trim(),
        data,
        texto: textoRedacao.trim(),
        notas,
        feedback: feedback.trim() || undefined,
        total: calcularTotalRedacao(notas),
      });
      setTema(''); setTextoRedacao(''); setFeedback('');
      setNotas({ competencia1: 0, competencia2: 0, competencia3: 0, competencia4: 0, competencia5: 0 });
      setShowForm(false);
      toast.success('Redação registada');
    } catch {
      toast.error('Erro ao registar redação');
    }
  };

  const totalNota = (n: NotasRedacao) => calcularTotalRedacao(n);

  const ultimas5 = redacoes.slice(-5);
  const mediaRadar = useMemo(() =>
    COMPETENCIAS.map(c => ({
      competencia: c.label,
      media: ultimas5.length > 0
        ? Math.round(ultimas5.reduce((s, r) => s + r.notas[c.key], 0) / ultimas5.length)
        : 0,
      maximo: 200,
    })),
    [ultimas5]
  );

  const timeline = useMemo(() =>
    redacoes.slice(-10).map(r => ({
      data: formatarData(r.data),
      nota: totalNota(r.notas),
      tema: r.tema,
    })),
    [redacoes]
  );

  const redacaoVisualizada = visualizando ? redacoes.find(r => r.id === visualizando) : null;
  const melhorNota = redacoes.length > 0 ? Math.max(...redacoes.map(r => totalNota(r.notas))) : 0;
  const mediaGeral = redacoes.length > 0
    ? Math.round(redacoes.reduce((s, r) => s + totalNota(r.notas), 0) / redacoes.length)
    : 0;

  const handleRemover = (id: string, tema: string) => {
    pedirConfirmacao({
      titulo: 'Apagar redação?',
      descricao: `"${tema}" será removida permanentemente.`,
      onConfirmar: async () => {
        await removerRedacao(id);
        toast.success('Redação removida');
        if (visualizando === id) setVisualizando(null);
      },
    });
  };

  return (
    <div className="page-container max-w-3xl">
      <PageHeader
        titulo="Redação"
        subtitulo={
          redacoes.length > 0
            ? `${redacoes.length} redações · média ${mediaGeral}/1000 · melhor ${melhorNota}/1000`
            : 'Comece a registar para acompanhar a sua evolução'
        }
        acao={
          <button
            onClick={() => { setShowForm(!showForm); setVisualizando(null); }}
            className="btn-primary"
          >
            <Plus size={16} /> Nova
          </button>
        }
      />

      {/* Formulário */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleSubmit}
            className="card mb-6 space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-serif text-lg font-semibold">Nova redação</h3>
              <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted">
                <X size={16} />
              </button>
            </div>

            <input
              value={tema}
              onChange={e => setTema(e.target.value)}
              placeholder="Tema da redação (ex: Desafios da educação)"
              className="input"
              required
              autoFocus
            />
            <input
              type="date"
              value={data}
              onChange={e => setData(e.target.value)}
              className="input"
            />

            <div>
              <label className="text-xs font-medium text-text-muted mb-1.5 block">
                Texto da redação
              </label>
              <textarea
                value={textoRedacao}
                onChange={e => setTextoRedacao(e.target.value)}
                placeholder="Escreve aqui o teu texto… (opcional — podes registar só a nota)"
                rows={10}
                className="input resize-none leading-relaxed font-serif"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-text-muted">Notas por competência</label>
                <span className={cn(
                  'text-sm font-bold',
                  totalNota(notas) >= 900 ? 'text-success' :
                  totalNota(notas) >= 600 ? 'text-accent' :
                  'text-text-muted'
                )}>
                  Total: {totalNota(notas)} / 1000
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COMPETENCIAS.map(c => (
                  <div key={c.key} className="flex items-center gap-2 p-2 rounded-lg bg-bg-hover/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">{c.label}</p>
                      <p className="text-[10px] text-text-muted truncate">{c.desc}</p>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={200}
                      step={20}
                      value={notas[c.key]}
                      onChange={e => setNotas(prev => ({ ...prev, [c.key]: Math.max(0, Math.min(200, Number(e.target.value))) }))}
                      className="w-16 px-2 py-1 text-sm rounded-lg border border-border bg-bg text-center"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-muted mb-1.5 block">
                Feedback (opcional)
              </label>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Comentários do professor ou do corretor..."
                rows={2}
                className="input resize-none"
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              <Save size={16} /> Registar redação
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Visualização de redação completa */}
      <AnimatePresence>
        {redacaoVisualizada && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="card mb-6"
          >
            <div className="flex items-center justify-between mb-4 gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-lg font-semibold">{redacaoVisualizada.tema}</h3>
                <p className="text-xs text-text-muted">
                  {formatarData(redacaoVisualizada.data)} · Nota: {totalNota(redacaoVisualizada.notas)}/1000
                  {totalNota(redacaoVisualizada.notas) >= 900 && <span className="ml-2 text-success font-medium">⭐ Excelente!</span>}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleRemover(redacaoVisualizada.id, redacaoVisualizada.tema)}
                  className="p-2 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger"
                  aria-label="Apagar"
                >
                  <Trash2 size={16} />
                </button>
                <button onClick={() => setVisualizando(null)} className="p-2 rounded-lg hover:bg-bg-hover text-text-muted" aria-label="Fechar">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notas por competência */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              {COMPETENCIAS.map(c => (
                <div key={c.key} className="text-center p-2 rounded-lg bg-bg-hover/50">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">{c.label}</p>
                  <p className={cn(
                    'text-lg font-bold',
                    redacaoVisualizada.notas[c.key] >= 160 ? 'text-success' :
                    redacaoVisualizada.notas[c.key] >= 120 ? 'text-accent' :
                    'text-text-muted'
                  )}>
                    {redacaoVisualizada.notas[c.key]}
                  </p>
                </div>
              ))}
            </div>

            {/* Texto */}
            {redacaoVisualizada.texto && (
              <div className="bg-bg-elevated rounded-xl p-5 border border-border-light mb-3">
                <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed font-serif">
                  {redacaoVisualizada.texto}
                </p>
              </div>
            )}
            {!redacaoVisualizada.texto && (
              <p className="text-xs text-text-muted italic mb-3">(Texto não registrado)</p>
            )}

            {/* Feedback */}
            {redacaoVisualizada.feedback && (
              <div className="p-3 rounded-xl bg-accent-soft/30 border border-accent/20">
                <p className="text-xs font-medium text-accent mb-1 flex items-center gap-1">
                  <BookOpen size={12} /> Feedback:
                </p>
                <p className="text-sm text-text-secondary">{redacaoVisualizada.feedback}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conteúdo quando há redações */}
      {redacoes.length > 0 && !visualizando && (
        <div className="space-y-6">
          {/* Perfil de competências */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
            <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
              <Award size={18} className="text-accent" />
              Perfil de competências
            </h3>
            {ultimas5.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={mediaRadar}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="competencia" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                  <Radar name="Média" dataKey="media" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-text-muted text-center py-6">Precisa de pelo menos uma redação para mostrar o perfil.</p>
            )}
            {melhorNota >= 900 && (
              <div className="mt-3 p-2 rounded-lg bg-success/10 border border-success/20 flex items-center gap-2 text-sm text-success">
                <Award size={14} /> Parabéns! Já atingiu uma redação nota 900+!
              </div>
            )}
          </motion.div>

          {/* Timeline */}
          {timeline.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
              <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-accent" />
                Evolução da nota
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                  <XAxis dataKey="data" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                  <YAxis domain={[0, 1000]} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                  <Tooltip contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="nota" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Histórico */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card">
            <h3 className="font-serif text-lg font-semibold mb-4">Histórico</h3>
            <div className="space-y-1.5">
              {redacoes.slice().reverse().map(r => {
                const nota = totalNota(r.notas);
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-bg-hover/50 hover:bg-bg-hover transition-colors group"
                  >
                    <button
                      onClick={() => setVisualizando(r.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-sm font-medium text-text-primary truncate">{r.tema}</p>
                      <p className="text-xs text-text-muted">{formatarData(r.data)}</p>
                    </button>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn(
                        'text-sm font-bold min-w-[3rem] text-right',
                        nota >= 900 ? 'text-success' : nota >= 600 ? 'text-accent' : 'text-text-muted'
                      )}>
                        {nota}
                      </span>
                      <button
                        onClick={() => handleRemover(r.id, r.tema)}
                        className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted opacity-0 group-hover:opacity-100 hover:text-danger transition-all"
                        aria-label="Apagar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* Empty state */}
      {redacoes.length === 0 && !showForm && (
        <EmptyState
          icone={<FileText size={26} strokeWidth={1.5} />}
          titulo="Nenhuma redação registada"
          descricao="Regista a tua primeira redação para acompanhar a tua evolução e identificar pontos a melhorar."
          acao={<button onClick={() => setShowForm(true)} className="btn-primary">Registar primeira redação</button>}
        />
      )}

      {dialog}
    </div>
  );
}

// Re-exportar Save (estava a ser usado no botão)
import { Save } from 'lucide-react';
