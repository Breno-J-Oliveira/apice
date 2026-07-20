import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerfilStore } from '@shared/stores/usePerfilStore';
import { useMateriasStore } from '@shared/stores/useMateriasStore';
import { useSessoesStore } from '@shared/stores/useSessoesStore';
import { useSessoesPorMateriaSemana } from '@shared/hooks/useSessoesPorMateriaSemana';
import { getAnoSemanaIso } from '@core/engines/metaEngine';
import { formatarMinutos, cn, tocarBeep } from '@shared/lib/utils';
import { PageHeader } from '@shared/components/PageHeader';
import { EmptyState } from '@shared/components/EmptyState';
import { Play, Pause, Square, CheckCircle2, ChevronRight, Volume2, VolumeX, Plus, Filter, BookOpen, ListChecks, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';

const DURACOES = [15, 25, 30, 45, 60, 90];
type FiltroMateria = 'ativas' | 'todas' | 'pendentes' | 'concluidas';

export default function EstudarPage() {
  const { materiaId } = useParams();
  const { perfilAtivo } = usePerfilStore();
  const { materias, subtopicos } = useMateriasStore();
  const { sessoes, registrarSessao } = useSessoesStore();

  const [duracaoFoco, setDuracaoFoco] = useState(25);
  const [materiaAtiva, setMateriaAtiva] = useState<string | null>(materiaId || null);
  const [estado, setEstado] = useState<'idle' | 'foco' | 'pausa' | 'concluido'>('idle');
  const [tempoRestante, setTempoRestante] = useState(0);
  const [modoFoco, setModoFoco] = useState(false);
  const [somAtivo, setSomAtivo] = useState(() => {
    return localStorage.getItem('apice:somAtivo') !== 'false';
  });
  const [filtro, setFiltro] = useState<FiltroMateria>('ativas');
  const [mostrarSubtopicos, setMostrarSubtopicos] = useState(true);

  // ═══ TIMER BASEADO EM TIMESTAMPS REAIS (não zera) ═══
  // Em vez de decrementar a cada segundo, calculamos o tempo decorrido
  // a partir de timestamps reais. Assim, se o utilizador mudar de aba,
  // minimizar o browser, ou o componente desmontar, o timer continua correto.
  const inicioRef = useRef<number>(0);       // quando o timer iniciou (em ms)
  const duracaoTotalRef = useRef<number>(0); // duração total em segundos
  const tempoAcumuladoRef = useRef<number>(0); // tempo decorrido antes da última pausa
  const pausadoEmRef = useRef<number>(0);     // quando foi pausado (em ms)
  const intervaloRef = useRef<ReturnType<typeof setInterval>>();

  const semanaAtual = perfilAtivo ? getAnoSemanaIso(new Date(), perfilAtivo.diaInicioSemana) : '';
  const todasMaterias = useMemo(() => {
    return [...materias].sort((a, b) => {
      if (a.arquivada !== b.arquivada) return a.arquivada ? 1 : -1;
      return a.nome.localeCompare(b.nome);
    });
  }, [materias]);

  const materiasFiltradas = useMemo(() => {
    switch (filtro) {
      case 'ativas': return materias.filter(m => !m.arquivada);
      case 'todas': return materias;
      case 'pendentes': return materias.filter(m => !m.arquivada);
      case 'concluidas': return materias.filter(m => !m.arquivada);
    }
  }, [materias, filtro]);

  const materiasComProgresso = useSessoesPorMateriaSemana(materiasFiltradas, sessoes, semanaAtual);

  const materiasVisiveis = useMemo(() => {
    if (filtro === 'concluidas') {
      return materiasComProgresso.filter(m => m.concluida);
    }
    if (filtro === 'pendentes') {
      return materiasComProgresso.filter(m => !m.concluida);
    }
    return materiasComProgresso;
  }, [materiasComProgresso, filtro]);

  const materia = materiaAtiva ? materias.find(m => m.id === materiaAtiva) : null;
  const subtopicosMateria = useMemo(
    () => materia ? subtopicos.filter(s => s.materiaId === materia.id) : [],
    [subtopicos, materia]
  );

  const beep = useCallback((f: number, d: number) => {
    if (somAtivo) tocarBeep(f, d, 0.3);
  }, [somAtivo]);

  useEffect(() => {
    localStorage.setItem('apice:somAtivo', String(somAtivo));
  }, [somAtivo]);

  // ═══ FUNÇÕES DO TIMER ═══

  // Calcula o tempo restante baseado em timestamps reais
  const calcularTempoRestante = useCallback((): number => {
    if (estado !== 'foco') {
      return Math.max(0, duracaoTotalRef.current - tempoAcumuladoRef.current);
    }
    const agora = Date.now();
    const decorridoAgora = (agora - inicioRef.current) / 1000;
    const totalDecorrido = tempoAcumuladoRef.current + decorridoAgora;
    return Math.max(0, Math.ceil(duracaoTotalRef.current - totalDecorrido));
  }, [estado]);

  // Atualiza o tempo restante a cada 250ms (mais fluido) e atualiza o document.title
  useEffect(() => {
    if (estado !== 'foco') {
      setTempoRestante(calcularTempoRestante());
      return;
    }
    const tick = () => {
      const restante = calcularTempoRestante();
      setTempoRestante(restante);
      // ═══ TÍTULO DO SITE COM O TEMPO AO VIVO ═══
      const mins = Math.floor(restante / 60);
      const secs = restante % 60;
      const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      const materiaNome = materia ? materia.nome.split(' ')[0] : 'Estudo';
      document.title = `⏱ ${timeStr} · ${materiaNome} — Ápice`;

      if (restante <= 0) {
        beep(880, 200);
        setTimeout(() => beep(1100, 150), 220);
        setEstado('concluido');
      }
    };
    tick();
    intervaloRef.current = setInterval(tick, 250);
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [estado, calcularTempoRestante, beep, materia]);

  // Restaura o título do site quando o componente desmonta
  useEffect(() => {
    return () => {
      document.title = 'Ápice — Sistema operacional de estudos';
    };
  }, []);

  // Quando o timer entra em concluído, regista a sessão
  useEffect(() => {
    if (estado === 'concluido' && materia && perfilAtivo) {
      const handleConcluir = async () => {
        const duracaoRealSegundos = Math.round(tempoAcumuladoRef.current + (Date.now() - inicioRef.current) / 1000);
        const duracaoRealMinutos = Math.max(1, Math.round(duracaoRealSegundos / 60));
        try {
          const sessao = await registrarSessao({
            perfilId: perfilAtivo.id,
            materiaId: materia.id,
            duracaoMinutos: duracaoFoco,
            duracaoRealMinutos: duracaoRealMinutos,
            origem: 'pomodoro',
            metaSemanalMinutos: materia.metaSemanalMinutos,
            diaInicioSemana: perfilAtivo.diaInicioSemana,
          });
          document.title = 'Ápice — Sistema operacional de estudos';
          const tipoLabel = sessao.tipo === 'planejada' ? 'planejada' : 'extra';
          toast.success(`+${duracaoRealMinutos}min de ${materia.nome}`, {
            description: `Sessão ${tipoLabel} registada · +${sessao.tipo === 'extra' ? Math.round(duracaoRealMinutos * 1.5) : duracaoRealMinutos} XP`,
            duration: 5000,
          });

          setTimeout(() => {
            const proxima = materiasComProgresso.find(m => !m.concluida && m.id !== materia.id);
            if (proxima) {
              setMateriaAtiva(proxima.id);
              setEstado('idle');
              setTempoRestante(0);
            } else {
              setEstado('idle');
              setTempoRestante(0);
            }
          }, 2500);
        } catch {
          toast.error('Erro ao registar sessão');
          setEstado('idle');
        }
      };
      handleConcluir();
    }
  }, [estado]); // eslint-disable-line react-hooks/exhaustive-deps

  const iniciarTimer = useCallback(() => {
    if (!materiaAtiva) {
      toast.error('Selecione uma matéria primeiro');
      return;
    }
    if (duracaoFoco <= 0) {
      toast.error('Duração inválida');
      return;
    }
    const duracaoSeg = duracaoFoco * 60;
    duracaoTotalRef.current = duracaoSeg;
    tempoAcumuladoRef.current = 0;
    inicioRef.current = Date.now();
    setEstado('foco');
    setTempoRestante(duracaoSeg);
    beep(660, 150);
  }, [materiaAtiva, duracaoFoco, beep]);

  const pausarTimer = useCallback(() => {
    if (estado === 'foco') {
      const agora = Date.now();
      const decorrido = (agora - inicioRef.current) / 1000;
      tempoAcumuladoRef.current += decorrido;
      pausadoEmRef.current = agora;
      setEstado('pausa');
      beep(440, 100);
    }
  }, [estado, beep]);

  const retomarTimer = useCallback(() => {
    if (estado === 'pausa') {
      inicioRef.current = Date.now();
      setEstado('foco');
      beep(660, 100);
    }
  }, [estado, beep]);

  const pararTimer = useCallback(() => {
    setEstado('idle');
    setTempoRestante(0);
    duracaoTotalRef.current = 0;
    tempoAcumuladoRef.current = 0;
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    document.title = 'Ápice — Sistema operacional de estudos';
    beep(330, 200);
  }, [beep]);

  // ═══ ADICIONAR MAIS TEMPO (sem resetar) ═══
  const adicionarTempo = useCallback((minutos: number) => {
    if (estado === 'foco' || estado === 'pausa') {
      // Adiciona ao tempo total sem resetar
      const novosSegundos = minutos * 60;
      duracaoTotalRef.current += novosSegundos;
      setTempoRestante(prev => prev + novosSegundos);
      toast.success(`+${minutos}min adicionados`, { duration: 1500 });
      beep(550, 80);
    } else {
      // Se idle, ajustar a duração configurada
      setDuracaoFoco(d => d + minutos);
      toast.success(`+${minutos}min para a próxima sessão`, { duration: 1500 });
    }
  }, [estado, beep]);

  // Atalhos de teclado
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
      } else if ((e.key === '+' || e.key === '=') && (e.ctrlKey || e.metaKey || e.shiftKey)) {
        e.preventDefault();
        adicionarTempo(5);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [estado, materiaAtiva, iniciarTimer, pausarTimer, retomarTimer, pararTimer, adicionarTempo]);

  const progresso = duracaoTotalRef.current > 0
    ? ((duracaoTotalRef.current - tempoRestante) / duracaoTotalRef.current) * 100
    : 0;

  const mins = Math.floor(tempoRestante / 60);
  const secs = Math.max(0, tempoRestante % 60);
  const tempoStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const materiasNaoConcluidas = materiasComProgresso.filter(m => !m.concluida);

  if (todasMaterias.length === 0) {
    return (
      <div className="page-container max-w-2xl">
        <PageHeader titulo="Estudar" />
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
          subtitulo={`${materiasNaoConcluidas.length} pendentes · ${materiasComProgresso.filter(m => m.concluida).length} concluídas hoje`}
          acao={
            <div className="flex items-center gap-1">
              <button
                onClick={() => setModoFoco(true)}
                className="p-2 rounded-xl text-text-muted hover:bg-bg-hover transition-colors"
                aria-label="Modo foco"
                title="Modo foco"
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={() => setSomAtivo(s => !s)}
                className="p-2 rounded-xl text-text-muted hover:bg-bg-hover transition-colors"
                aria-label={somAtivo ? 'Desligar som' : 'Ligar som'}
                title={somAtivo ? 'Som ligado' : 'Som desligado'}
              >
                {somAtivo ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            </div>
          }
        />
      )}

      {/* Filtro de matérias */}
      {!modoFoco && (
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
          <Filter size={14} className="text-text-muted flex-shrink-0" />
          {([
            { valor: 'ativas' as const, label: 'Ativas' },
            { valor: 'pendentes' as const, label: 'Pendentes' },
            { valor: 'concluidas' as const, label: 'Concluídas' },
            { valor: 'todas' as const, label: 'Todas' },
          ]).map(f => (
            <button
              key={f.valor}
              onClick={() => setFiltro(f.valor)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                filtro === f.valor
                  ? 'bg-accent text-white'
                  : 'bg-bg-card border border-border text-text-secondary hover:bg-bg-hover'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Lista de matérias */}
      {!modoFoco && (
        <motion.div layout className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
              <BookOpen size={16} className="text-accent" />
              Matérias
            </h3>
            <span className="text-xs text-text-muted">
              {materiasVisiveis.length} {materiasVisiveis.length === 1 ? 'matéria' : 'matérias'}
            </span>
          </div>
          {materiasVisiveis.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">
              {filtro === 'concluidas' ? 'Nenhuma matéria concluída ainda.' : 'Nenhuma matéria neste filtro.'}
            </p>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {materiasVisiveis.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setMateriaAtiva(m.id); setEstado('idle'); setTempoRestante(0); }}
                  className={cn(
                    'w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left',
                    materiaAtiva === m.id ? 'bg-accent-soft border border-accent/30' : 'hover:bg-bg-hover border border-transparent',
                    m.arquivada && 'opacity-60'
                  )}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: m.cor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {m.nome}
                      {m.arquivada && <span className="ml-1.5 text-[10px] text-text-muted">(arquivada)</span>}
                    </p>
                    <p className="text-xs text-text-muted">
                      {m.arquivada ? 'Arquivada' :
                        m.concluida ? `✓ Meta: ${formatarMinutos(m.acumulado)}` :
                        `Falta ${formatarMinutos(m.falta)} · ${m.progresso}% concluído`
                      }
                    </p>
                  </div>
                  {materiaAtiva === m.id && <ChevronRight size={14} className="text-accent flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Subtopicos da matéria selecionada */}
      {!modoFoco && materia && mostrarSubtopicos && subtopicosMateria.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card mb-6">
          <button
            onClick={() => setMostrarSubtopicos(s => !s)}
            className="w-full flex items-center justify-between mb-2"
          >
            <h3 className="font-serif text-sm font-semibold flex items-center gap-2">
              <ListChecks size={14} className="text-accent" />
              Subtópicos de {materia.nome}
            </h3>
            <span className="text-xs text-text-muted">
              {subtopicosMateria.filter(s => s.status === 'dominado').length}/{subtopicosMateria.length} ✓
            </span>
          </button>
          {mostrarSubtopicos && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
              {subtopicosMateria.map(st => {
                const cores = {
                  nao_iniciado: 'bg-bg-hover/50 text-text-muted',
                  em_andamento: 'bg-warning/10 text-warning',
                  dominado: 'bg-success/10 text-success',
                };
                return (
                  <div
                    key={st.id}
                    className={cn('flex items-center gap-2 p-1.5 rounded-md text-xs', cores[st.status])}
                  >
                    <CheckCircle2 size={12} className="flex-shrink-0" />
                    <span className="truncate flex-1">{st.nome}</span>
                  </div>
                );
              })}
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
                  style={{ transition: 'stroke-dashoffset 0.5s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-mono font-light tracking-tight text-text-primary tabular-nums">
                  {estado === 'idle' ? `${duracaoFoco.toString().padStart(2, '0')}:00` : tempoStr}
                </span>
                {estado === 'concluido' && (
                  <span className="text-xs text-success mt-1 animate-pulse">Ciclo concluído!</span>
                )}
                {estado === 'foco' && (
                  <span className="text-[10px] text-text-muted mt-1">⏱ Espaço para pausar</span>
                )}
                {estado === 'pausa' && (
                  <span className="text-[10px] text-warning mt-1">Pausado · Esc para parar</span>
                )}
                {estado === 'idle' && materia && (
                  <span className="text-[10px] text-text-muted mt-1">Espaço para iniciar</span>
                )}
              </div>
            </div>

            {/* ═══ BOTÕES DE CONTROLO + ADICIONAR TEMPO ═══ */}
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {estado === 'idle' && (
                  <button onClick={iniciarTimer} className="btn-primary px-6 py-3 text-base">
                    <Play size={18} /> Iniciar {duracaoFoco}min
                  </button>
                )}
                {estado === 'foco' && (
                  <>
                    <button onClick={pausarTimer} className="btn-outline" aria-label="Pausar">
                      <Pause size={18} /> Pausar
                    </button>
                    <button onClick={pararTimer} className="btn-outline border-danger/30 text-danger" aria-label="Parar">
                      <Square size={18} /> Parar
                    </button>
                  </>
                )}
                {estado === 'pausa' && (
                  <>
                    <button onClick={retomarTimer} className="btn-primary">
                      <Play size={18} /> Retomar
                    </button>
                    <button onClick={pararTimer} className="btn-outline border-danger/30 text-danger" aria-label="Parar">
                      <Square size={18} /> Parar
                    </button>
                  </>
                )}
                {estado === 'concluido' && (
                  <button className="btn-primary animate-pulse">
                    <CheckCircle2 size={18} /> A registar...
                  </button>
                )}
              </div>

              {/* Botão +15min — destaque especial */}
              {(estado === 'foco' || estado === 'pausa' || estado === 'idle') && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adicionarTempo(5)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-card border border-border text-text-secondary hover:bg-bg-hover transition-colors"
                    title="Adicionar 5 minutos ao timer atual"
                  >
                    <Plus size={12} className="inline" /> 5min
                  </button>
                  <button
                    onClick={() => adicionarTempo(15)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-soft',
                      (estado === 'foco' || estado === 'pausa')
                        ? 'bg-accent text-white hover:bg-accent-hover'
                        : 'bg-bg-card border border-accent/30 text-accent hover:bg-accent-soft'
                    )}
                    title="Adicionar 15 minutos ao timer atual (ou à próxima sessão)"
                  >
                    <Plus size={14} className="inline mr-1" /> 15min
                  </button>
                  <button
                    onClick={() => adicionarTempo(30)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-card border border-border text-text-secondary hover:bg-bg-hover transition-colors"
                    title="Adicionar 30 minutos ao timer atual"
                  >
                    <Plus size={12} className="inline" /> 30min
                  </button>
                </div>
              )}
            </div>

            <p className="text-[10px] text-text-muted text-center mb-2">
              Atalhos: <kbd className="px-1 py-0.5 rounded bg-bg-hover">Espaço</kbd> iniciar/pausar · <kbd className="px-1 py-0.5 rounded bg-bg-hover">Esc</kbd> parar · <kbd className="px-1 py-0.5 rounded bg-bg-hover">Ctrl + +</kbd> +5min
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modo foco */}
      {modoFoco && (
        <button
          onClick={() => setModoFoco(false)}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors mx-auto block mt-4"
        >
          ← Sair do modo foco
        </button>
      )}
    </div>
  );
}
