import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerfilStore } from '@shared/stores/usePerfilStore';
import { useMateriasStore } from '@shared/stores/useMateriasStore';
import { useSessoesStore } from '@shared/stores/useSessoesStore';
import { useSessoesPorMateriaSemana } from '@shared/hooks/useSessoesPorMateriaSemana';
import { getAnoSemanaIso } from '@core/engines/metaEngine';
import { formatarMinutos, cn, tocarBeep } from '@shared/lib/utils';
import { PageHeader } from '@shared/components/PageHeader';
import { EmptyState } from '@shared/components/EmptyState';
import { Play, Pause, Square, SkipForward, Clock, CheckCircle2, ChevronRight, Settings2, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const DURACOES = [15, 25, 30, 45, 60, 90];

export default function EstudarPage() {
  const { materiaId } = useParams();
  const { perfilAtivo } = usePerfilStore();
  const { materias } = useMateriasStore();
  const { sessoes, registrarSessao } = useSessoesStore();

  const [duracaoFoco, setDuracaoFoco] = useState(25);
  const [materiaAtiva, setMateriaAtiva] = useState<string | null>(materiaId || null);
  const [estado, setEstado] = useState<'idle' | 'foco' | 'pausa' | 'concluido'>('idle');
  const [tempoRestante, setTempoRestante] = useState(0);
  const [modoFoco, setModoFoco] = useState(false);
  const [somAtivo, setSomAtivo] = useState(() => {
    return localStorage.getItem('apice:somAtivo') !== 'false';
  });

  // Rastreia o momento real em que o timer iniciou (para calcular tempo decorrido)
  const inicioRef = useRef<number>(0);
  const intervaloRef = useRef<ReturnType<typeof setInterval>>();

  const semanaAtual = perfilAtivo ? getAnoSemanaIso(new Date(), perfilAtivo.diaInicioSemana) : '';
  const materiasAtivas = useMemo(() => materias.filter(m => !m.arquivada), [materias]);
  const materiasComProgresso = useSessoesPorMateriaSemana(materiasAtivas, sessoes, semanaAtual);
  const materia = materiaAtiva ? materias.find(m => m.id === materiaAtiva) : null;

  const beep = useCallback((f: number, d: number) => {
    if (somAtivo) tocarBeep(f, d, 0.3);
  }, [somAtivo]);

  useEffect(() => {
    localStorage.setItem('apice:somAtivo', String(somAtivo));
  }, [somAtivo]);

  // Cleanup do intervalo
  useEffect(() => () => {
    if (intervaloRef.current) clearInterval(intervaloRef.current);
  }, []);

  const iniciarTimer = useCallback(() => {
    if (!materiaAtiva) return;
    setEstado('foco');
    setTempoRestante(duracaoFoco * 60);
    inicioRef.current = Date.now();
    beep(660, 150);
  }, [materiaAtiva, duracaoFoco, beep]);

  const pausarTimer = () => {
    if (estado === 'foco') {
      setEstado('pausa');
      beep(440, 100);
    }
  };

  const retomarTimer = () => {
    if (estado === 'pausa') {
      setEstado('foco');
      beep(660, 100);
    }
  };

  const pararTimer = useCallback(() => {
    setEstado('idle');
    setTempoRestante(0);
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    beep(330, 200);
  }, [beep]);

  const concluirCiclo = useCallback(async () => {
    if (!perfilAtivo || !materiaAtiva || !materia) return;
    if (intervaloRef.current) clearInterval(intervaloRef.current);

    // Calcula o tempo REAL decorrido (não usa duracaoFoco — respeita pausas e paragens)
    const duracaoRealSegundos = Math.max(60, Math.round((Date.now() - inicioRef.current) / 1000));
    const duracaoRealMinutos = Math.max(1, Math.round(duracaoRealSegundos / 60));

    try {
      const sessao = await registrarSessao({
        perfilId: perfilAtivo.id,
        materiaId: materiaAtiva,
        duracaoMinutos: duracaoFoco,
        duracaoRealMinutos: duracaoRealMinutos,
        origem: 'pomodoro',
        metaSemanalMinutos: materia.metaSemanalMinutos,
        diaInicioSemana: perfilAtivo.diaInicioSemana,
      });

      setEstado('concluido');
      beep(880, 200);
      setTimeout(() => beep(1100, 150), 220);

      const tipoLabel = sessao.tipo === 'planejada' ? 'planejada' : 'extra';
      toast.success(`+${duracaoRealMinutos}min de ${materia.nome}`, {
        description: `Sessão ${tipoLabel} registada · +${sessao.tipo === 'extra' ? Math.round(duracaoRealMinutos * 1.5) : duracaoRealMinutos} XP`,
      });

      // Sugere próxima matéria não concluída
      setTimeout(() => {
        const proxima = materiasComProgresso.find(m => !m.concluida && m.id !== materiaAtiva);
        if (proxima) {
          setMateriaAtiva(proxima.id);
          setEstado('idle');
          setTempoRestante(0);
        } else {
          // Todas as metas da semana batidas
          setEstado('idle');
          setTempoRestante(0);
        }
      }, 2500);
    } catch (e) {
      toast.error('Erro ao registar sessão');
    }
  }, [perfilAtivo, materiaAtiva, materia, duracaoFoco, beep, materiasComProgresso, registrarSessao]);

  // Tick do timer — usa Date.now() para precisão
  useEffect(() => {
    if (estado === 'foco' && tempoRestante > 0) {
      intervaloRef.current = setInterval(() => {
        setTempoRestante(prev => {
          if (prev <= 1) {
            if (intervaloRef.current) clearInterval(intervaloRef.current);
            // Dispara conclusão no próximo tick
            setTimeout(() => concluirCiclo(), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervaloRef.current) clearInterval(intervaloRef.current); };
  }, [estado, concluirCiclo]);

  const progresso = duracaoFoco > 0 ? ((duracaoFoco * 60 - tempoRestante) / (duracaoFoco * 60)) * 100 : 0;
  const mins = Math.floor(tempoRestante / 60);
  const secs = Math.max(0, tempoRestante % 60);
  const tempoStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const materiasNaoConcluidas = materiasComProgresso.filter(m => !m.concluida);
  const materiasConcluidas = materiasComProgresso.filter(m => m.concluida);

  // Atalhos de teclado durante o timer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ' && materiaAtiva) {
        e.preventDefault();
        if (estado === 'idle') iniciarTimer();
        else if (estado === 'foco') pausarTimer();
        else if (estado === 'pausa') retomarTimer();
      } else if (e.key === 'Escape' && estado !== 'idle') {
        pararTimer();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [estado, materiaAtiva, iniciarTimer, pararTimer]);

  if (materiasAtivas.length === 0) {
    return (
      <div className="page-container max-w-2xl">
        <EmptyState
          titulo="Sem matérias ativas"
          descricao="Adicione matérias antes de começar a estudar."
          acao={<Link to="/materias" className="btn-primary">Ir para Matérias</Link>}
        />
      </div>
    );
  }

  return (
    <div className={cn('page-container max-w-2xl mx-auto', modoFoco && 'min-h-screen flex flex-col items-center justify-center bg-bg')}>
      {!modoFoco && (
        <PageHeader
          titulo="Estudar"
          subtitulo={`${materiasNaoConcluidas.length} pendentes · ${materiasConcluidas.length} concluídas hoje`}
          acao={
            <button
              onClick={() => setSomAtivo(s => !s)}
              className="p-2 rounded-xl text-text-muted hover:bg-bg-hover transition-colors"
              aria-label={somAtivo ? 'Desligar som' : 'Ligar som'}
              title={somAtivo ? 'Som ligado' : 'Som desligado'}
            >
              {somAtivo ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          }
        />
      )}

      {/* Fila de estudos do dia */}
      {!modoFoco && (
        <motion.div layout className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-lg font-semibold">Fila de hoje</h3>
            <div className="flex items-center gap-1">
              <Settings2 size={14} className="text-text-muted" />
              <span className="text-xs text-text-muted">{materiasNaoConcluidas.length} pendentes</span>
            </div>
          </div>
          <div className="space-y-2">
            {materiasNaoConcluidas.slice(0, 6).map(m => (
              <button
                key={m.id}
                onClick={() => { setMateriaAtiva(m.id); setEstado('idle'); setTempoRestante(0); }}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left',
                  materiaAtiva === m.id ? 'bg-accent-soft border border-accent/30' : 'hover:bg-bg-hover border border-transparent'
                )}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: m.cor }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{m.nome}</p>
                  <p className="text-xs text-text-muted">
                    Falta {formatarMinutos(m.falta)} · {m.progresso}% concluído
                  </p>
                </div>
                <div className="flex-1 max-w-[80px] h-2 bg-bg-hover rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${m.progresso}%`, backgroundColor: m.cor }} />
                </div>
                <ChevronRight size={14} className="text-text-muted flex-shrink-0" />
              </button>
            ))}
            {materiasNaoConcluidas.length === 0 && (
              <div className="text-center py-4">
                <CheckCircle2 size={24} className="mx-auto text-success mb-2" />
                <p className="text-sm text-text-secondary">Todas as metas do dia estão concluídas!</p>
                <p className="text-xs text-text-muted mt-1">Pode continuar a estudar como extra.</p>
              </div>
            )}
          </div>
          {materiasConcluidas.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border-light">
              <p className="text-xs text-text-muted mb-2">Concluídas ({materiasConcluidas.length})</p>
              <div className="flex gap-2 flex-wrap">
                {materiasConcluidas.slice(0, 4).map(m => (
                  <span key={m.id} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-success/10 text-success text-xs">
                    <CheckCircle2 size={10} /> {m.nome}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Timer */}
      <AnimatePresence mode="wait">
        {materiaAtiva && materia && (
          <motion.div
            key={materiaAtiva + estado}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: materia.cor }} />
              <p className="text-sm font-medium text-text-primary">{materia.nome}</p>
              {estado === 'concluido' && <CheckCircle2 size={16} className="text-success" />}
            </div>

            {/* Ajuste de duração (apenas idle) */}
            {estado === 'idle' && (
              <div className="flex items-center justify-center gap-1 mb-6 flex-wrap">
                {DURACOES.map(d => (
                  <button
                    key={d}
                    onClick={() => setDuracaoFoco(d)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                      duracaoFoco === d ? 'bg-accent text-white' : 'bg-bg-card border border-border text-text-secondary hover:bg-bg-hover'
                    )}
                  >
                    {d}min
                  </button>
                ))}
              </div>
            )}

            {/* Círculo do timer */}
            <div className="relative w-56 h-56 mx-auto mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="var(--color-border-light)" strokeWidth="3" />
                <circle
                  cx="50" cy="50" r="44" fill="none"
                  stroke={estado === 'pausa' ? 'var(--color-warning)' : estado === 'concluido' ? 'var(--color-success)' : 'var(--color-accent)'}
                  strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - progresso / 100)}`}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-mono font-light tracking-tight text-text-primary tabular-nums">
                  {estado === 'idle' ? `${duracaoFoco}:00` : tempoStr}
                </span>
                {estado === 'concluido' && (
                  <span className="text-xs text-success mt-1 animate-pulse">Ciclo concluído!</span>
                )}
                {estado === 'foco' && (
                  <span className="text-xs text-text-muted mt-1">Foco · barra de espaço para pausar</span>
                )}
                {estado === 'pausa' && (
                  <span className="text-xs text-warning mt-1">Pausado · ESC para parar</span>
                )}
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center justify-center gap-3 mb-6">
              {estado === 'idle' && (
                <button onClick={iniciarTimer} className="btn-primary px-6 py-3 text-base">
                  <Play size={18} /> Iniciar {duracaoFoco}min
                </button>
              )}
              {estado === 'foco' && (
                <>
                  <button onClick={pararTimer} className="p-3 rounded-xl bg-bg-card border border-danger/30 text-danger hover:bg-danger/10 transition-colors" aria-label="Parar">
                    <Square size={20} />
                  </button>
                  <button onClick={pausarTimer} className="p-3 rounded-xl bg-bg-card border border-border hover:bg-bg-hover transition-colors" aria-label="Pausar">
                    <Pause size={20} />
                  </button>
                </>
              )}
              {estado === 'pausa' && (
                <>
                  <button onClick={pararTimer} className="p-3 rounded-xl bg-bg-card border border-danger/30 text-danger hover:bg-danger/10 transition-colors" aria-label="Parar">
                    <Square size={20} />
                  </button>
                  <button onClick={retomarTimer} className="btn-primary px-6 py-3 text-base">
                    <Play size={18} /> Retomar
                  </button>
                </>
              )}
              {estado === 'concluido' && (
                <button onClick={() => { setEstado('idle'); setTempoRestante(0); }} className="btn-primary px-6 py-3 text-base">
                  <SkipForward size={18} /> Próxima matéria
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!materiaAtiva && !modoFoco && (
        <EmptyState
          titulo="Escolha uma matéria"
          descricao="Selecione uma matéria da fila acima para iniciar o timer."
        />
      )}

      {/* Modo foco */}
      <button
        onClick={() => setModoFoco(!modoFoco)}
        className="text-xs text-text-muted hover:text-text-secondary transition-colors mx-auto block"
      >
        {modoFoco ? '← Sair do modo foco' : 'Entrar em modo foco'}
      </button>
    </div>
  );
}
