/**
 * Motor do Pomodoro — Ápice
 *
 * Máquina de estados finita do timer Pomodoro, com suporte a
 * pausas reais, ciclo de pausas longas e contagem de ciclos.
 */

import type { ConfigPomodoro, EstadoPomodoro } from '@shared/types';

export interface PomodoroState {
  estado: EstadoPomodoro;
  tempoRestanteSegundos: number;
  duracaoTotalSegundos: number;
  cicloAtual: number;
  totalCiclosCompletos: number;
  materiaId: string | null;
  subtopicoId: string | null;
  estadoAnterior: EstadoPomodoro | null;
}

export const POMODORO_PADRAO: ConfigPomodoro = {
  focoMinutos: 25,
  pausaCurtaMinutos: 5,
  pausaLongaMinutos: 15,
  ciclosAtePausaLonga: 4,
  somAtivo: true,
  notificacoesAtivas: false,
};

export function criarEstadoInicial(
  config: ConfigPomodoro = POMODORO_PADRAO,
  materiaId: string | null = null,
  subtopicoId: string | null = null
): PomodoroState {
  return {
    estado: 'idle',
    tempoRestanteSegundos: config.focoMinutos * 60,
    duracaoTotalSegundos: config.focoMinutos * 60,
    cicloAtual: 1,
    totalCiclosCompletos: 0,
    materiaId,
    subtopicoId,
    estadoAnterior: null,
  };
}

export function iniciarFoco(state: PomodoroState, config: ConfigPomodoro): PomodoroState {
  return {
    ...state,
    estado: 'foco',
    tempoRestanteSegundos: config.focoMinutos * 60,
    duracaoTotalSegundos: config.focoMinutos * 60,
    estadoAnterior: null,
  };
}

export function completarFoco(state: PomodoroState, config: ConfigPomodoro): PomodoroState {
  const novoTotalCiclos = state.totalCiclosCompletos + 1;
  const pausaLonga = novoTotalCiclos % config.ciclosAtePausaLonga === 0;

  if (pausaLonga) {
    return {
      ...state,
      estado: 'pausaLonga',
      tempoRestanteSegundos: config.pausaLongaMinutos * 60,
      duracaoTotalSegundos: config.pausaLongaMinutos * 60,
      totalCiclosCompletos: novoTotalCiclos,
    };
  }

  return {
    ...state,
    estado: 'pausaCurta',
    tempoRestanteSegundos: config.pausaCurtaMinutos * 60,
    duracaoTotalSegundos: config.pausaCurtaMinutos * 60,
    totalCiclosCompletos: novoTotalCiclos,
  };
}

export function completarPausa(state: PomodoroState, config: ConfigPomodoro): PomodoroState {
  return {
    ...state,
    estado: 'foco',
    tempoRestanteSegundos: config.focoMinutos * 60,
    duracaoTotalSegundos: config.focoMinutos * 60,
    cicloAtual: state.cicloAtual + 1,
    estadoAnterior: null,
  };
}

export function pausar(state: PomodoroState): PomodoroState {
  if (state.estado === 'idle' || state.estado === 'pausado') return state;
  return {
    ...state,
    estado: 'pausado',
    estadoAnterior: state.estado,
  };
}

export function retomar(state: PomodoroState): PomodoroState {
  if (state.estado !== 'pausado') return state;
  return {
    ...state,
    estado: state.estadoAnterior ?? 'foco',
    estadoAnterior: null,
  };
}

export function parar(state: PomodoroState): PomodoroState {
  return {
    ...state,
    estado: 'idle',
    tempoRestanteSegundos: 0,
    duracaoTotalSegundos: 0,
    estadoAnterior: null,
  };
}

export function tick(state: PomodoroState): { state: PomodoroState; concluido: boolean } {
  if (state.estado === 'idle' || state.estado === 'pausado') {
    return { state, concluido: false };
  }
  const novoTempo = state.tempoRestanteSegundos - 1;
  if (novoTempo <= 0) {
    return {
      state: { ...state, tempoRestanteSegundos: 0 },
      concluido: true,
    };
  }
  return {
    state: { ...state, tempoRestanteSegundos: novoTempo },
    concluido: false,
  };
}

export function progressoTimer(state: PomodoroState): number {
  if (state.duracaoTotalSegundos <= 0) return 0;
  const decorrido = state.duracaoTotalSegundos - state.tempoRestanteSegundos;
  return Math.min(100, Math.round((decorrido / state.duracaoTotalSegundos) * 100));
}

export function formatarTempo(segundos: number): string {
  const mins = Math.floor(segundos / 60);
  const secs = Math.max(0, segundos % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const LABELS_ESTADO: Record<EstadoPomodoro, string> = {
  idle: 'Pronto para começar',
  foco: 'Foco',
  pausaCurta: 'Pausa curta',
  pausaLonga: 'Pausa longa',
  pausado: 'Pausado',
};

export const CORES_ESTADO: Record<EstadoPomodoro, string> = {
  idle: 'var(--color-text-muted)',
  foco: 'var(--color-accent)',
  pausaCurta: 'var(--color-success)',
  pausaLonga: 'var(--color-warning)',
  pausado: 'var(--color-text-muted)',
};
