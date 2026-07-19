/**
 * Motor de Metas Semanais (Meta Engine) — Ápice
 *
 * Responsável por:
 *  - Determinar se uma sessão conta como "planejada" ou "extra"
 *  - Calcular progresso semanal
 *  - Calcular déficits e opções de tratamento
 *
 * A rotina de estudos é imperfeita. O motor não pune; adapta.
 */

import type { SessaoEstudo, Materia, HistoricoSemanal, TipoSessao } from '@shared/types';
import { getISOWeek, getISOWeekYear, startOfWeek, addDays } from 'date-fns';

/**
 * Calcula a semana ISO para uma data.
 * - Se diaInicioSemana for 1 (segunda), usa o padrão ISO.
 * - Se for 0 (domingo), ajusta com +1 dia para o cálculo.
 */
export function getSemanaIso(data: Date, diaInicioSemana: 0 | 1 = 1): string {
  if (diaInicioSemana === 1) {
    return getISOWeek(data).toString().padStart(2, '0');
  }
  // Para domingo como início, usa a semana ISO da data ajustada
  const adjusted = new Date(data);
  adjusted.setDate(adjusted.getDate() + 1);
  return getISOWeek(adjusted).toString().padStart(2, '0');
}

/**
 * Gera identificador "YYYY-Www" respeitando o ano ISO.
 * Usa getISOWeekYear do date-fns para evitar o bug de virar o ano
 * (ex: 30/dez/2024 pode pertencer à semana 1 de 2025).
 */
export function getAnoSemanaIso(data: Date, diaInicioSemana: 0 | 1 = 1): string {
  let dataRef = data;
  if (diaInicioSemana === 0) {
    dataRef = new Date(data);
    dataRef.setDate(dataRef.getDate() + 1);
  }
  const anoIso = getISOWeekYear(dataRef);
  const semana = getSemanaIso(data, diaInicioSemana);
  return `${anoIso}-W${semana}`;
}

/**
 * Determina o tipo de uma sessão com base no progresso acumulado.
 *
 * Regra: enquanto `acumulado < meta` → planejada.
 *        quando `acumulado >= meta` → extra.
 *        se a sessão atravessa a fronteira, parte conta como planejada e o excedente como extra.
 */
export function determinarTipoSessao(
  acumuladoMinutos: number,
  metaSemanalMinutos: number,
  duracaoNovaSessao: number
): { tipo: TipoSessao; novoAcumulado: number; excedente: number } {
  // Validação defensiva
  if (duracaoNovaSessao < 0) duracaoNovaSessao = 0;
  if (metaSemanalMinutos < 0) metaSemanalMinutos = 0;

  const novoAcumulado = acumuladoMinutos + duracaoNovaSessao;

  // Meta já batida → sessão toda é extra
  if (acumuladoMinutos >= metaSemanalMinutos) {
    return {
      tipo: 'extra',
      novoAcumulado: acumuladoMinutos,
      excedente: duracaoNovaSessao,
    };
  }

  // Sessão inteira cabe dentro da meta
  if (novoAcumulado <= metaSemanalMinutos) {
    return {
      tipo: 'planejada',
      novoAcumulado,
      excedente: 0,
    };
  }

  // Sessão atravessa a fronteira
  const partePlanejada = metaSemanalMinutos - acumuladoMinutos;
  const parteExtra = duracaoNovaSessao - partePlanejada;
  return {
    tipo: 'planejada',
    novoAcumulado: metaSemanalMinutos,
    excedente: parteExtra,
  };
}

/**
 * Calcula o progresso percentual (0-100) da meta semanal.
 */
export function calcularProgressoSemanal(
  acumuladoMinutos: number,
  metaSemanalMinutos: number
): number {
  if (metaSemanalMinutos <= 0) return 0;
  if (acumuladoMinutos <= 0) return 0;
  return Math.min(100, Math.round((acumuladoMinutos / metaSemanalMinutos) * 100));
}

/** Verifica se a meta semanal foi concluída. */
export function metaConcluida(
  acumuladoMinutos: number,
  metaSemanalMinutos: number
): boolean {
  return metaSemanalMinutos > 0 && acumuladoMinutos >= metaSemanalMinutos;
}

/** Calcula o déficit semanal (em minutos). */
export function calcularDeficit(
  acumuladoMinutos: number,
  metaSemanalMinutos: number
): number {
  return Math.max(0, metaSemanalMinutos - acumuladoMinutos);
}

/**
 * Opções de tratamento de déficit.
 * - "redistribuir 50%": soma metade do déficit à meta da próxima semana
 * - "ignorar": recomeça do zero
 * - "reduzir meta": sugerido se 3+ semanas seguidas com déficit
 */
export type OpcaoDeficit =
  | { tipo: 'redistribuir'; valorExtra: number }
  | { tipo: 'ignorar' }
  | { tipo: 'reduzir_meta'; novaMeta: number };

export function calcularOpcoesDeficit(
  materia: Materia,
  deficit: number,
  semanasConsecutivasComDeficit: number
): OpcaoDeficit[] {
  const opcoes: OpcaoDeficit[] = [];

  const valorRedistribuido = Math.round(deficit * 0.5);
  if (valorRedistribuido > 0) {
    opcoes.push({ tipo: 'redistribuir', valorExtra: valorRedistribuido });
  }

  opcoes.push({ tipo: 'ignorar' });

  if (semanasConsecutivasComDeficit >= 3 && deficit > 0) {
    const mediaRealizada = materia.metaSemanalMinutos - deficit;
    const novaMeta = Math.max(30, Math.round(mediaRealizada * 1.1));
    if (novaMeta < materia.metaSemanalMinutos) {
      opcoes.push({ tipo: 'reduzir_meta', novaMeta });
    }
  }

  return opcoes;
}

/** Conta semanas consecutivas com déficit a partir do histórico. */
export function contarSemanasConsecutivasComDeficit(
  historico: HistoricoSemanal[],
  materiaId: string
): number {
  if (historico.length === 0) return 0;
  const ordenado = [...historico].sort((a, b) => b.semanaIso.localeCompare(a.semanaIso));

  let consecutivas = 0;
  for (const entrada of ordenado) {
    const dados = entrada.porMateria[materiaId];
    if (!dados) break;
    if (dados.realizado < dados.meta) {
      consecutivas++;
    } else {
      break;
    }
  }
  return consecutivas;
}

/** Soma minutos por matéria na semana, separando planejada/extra. */
export function somarMinutosPorMateriaNaSemana(
  sessoes: SessaoEstudo[],
  materiaId: string,
  semanaIso: string
): { planejada: number; extra: number } {
  let planejada = 0;
  let extra = 0;
  for (const sessao of sessoes) {
    if (sessao.materiaId === materiaId && sessao.semanaIso === semanaIso) {
      if (sessao.tipo === 'planejada') {
        planejada += sessao.duracaoMinutos;
      } else {
        extra += sessao.duracaoMinutos;
      }
    }
  }
  return { planejada, extra };
}

/**
 * Acumulado total (planejada + extra) de uma matéria na semana.
 */
export function acumuladoTotalMateriaNaSemana(
  sessoes: SessaoEstudo[],
  materiaId: string,
  semanaIso: string
): number {
  return sessoes
    .filter(s => s.materiaId === materiaId && s.semanaIso === semanaIso)
    .reduce((s, sess) => s + sess.duracaoMinutos, 0);
}

/** Retorna os N últimos dias como array de datas (YYYY-MM-DD). */
export function ultimosDias(quantidade: number, ate: Date = new Date()): Date[] {
  const dias: Date[] = [];
  for (let i = quantidade - 1; i >= 0; i--) {
    const d = new Date(ate);
    d.setDate(d.getDate() - i);
    dias.push(d);
  }
  return dias;
}

/** Verifica se a data está dentro de um dia (00:00 - 23:59). */
export function mesmoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
