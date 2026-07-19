/**
 * Motor de Virada de Semana (Week Rollover Engine) — Ápice
 *
 * Deteta mudança de semana ISO desde a última abertura, gera snapshots,
 * reseta acumulados e processa semanas puladas.
 *
 * A rotina de estudos é imperfeita: o usuário pode ficar dias ou semanas
 * sem abrir o app. Este motor garante que o histórico se mantém coerente.
 */

import type { Perfil, Materia, SessaoEstudo, HistoricoSemanal } from '@shared/types';
import { getAnoSemanaIso, getSemanaIso, somarMinutosPorMateriaNaSemana } from './metaEngine';
import { getISOWeekYear } from 'date-fns';
import { gerarId } from '@shared/lib/utils';

export interface ResultadoRollover {
  semanaAtual: string;
  semanasProcessadas: string[];
  snapshotCriado: boolean;
  materiasComDeficit: { materiaId: string; deficit: number; materiasConsecutivasComDeficit: number }[];
}

/**
 * Executa o rollover de semana.
 * Deve ser chamado no boot do app, antes de qualquer outra operação.
 */
export function executarRollover(
  perfil: Perfil,
  materias: Materia[],
  sessoes: SessaoEstudo[],
  historicoExistente: HistoricoSemanal[],
  hoje: Date = new Date()
): ResultadoRollover {
  const semanaAtual = getAnoSemanaIso(hoje, perfil.diaInicioSemana);
  const ultimaProcessada = perfil.ultimaSemanaProcessada || '';

  const resultado: ResultadoRollover = {
    semanaAtual,
    semanasProcessadas: [],
    snapshotCriado: false,
    materiasComDeficit: [],
  };

  // Já processou esta semana → sem trabalho
  if (ultimaProcessada === semanaAtual) {
    return resultado;
  }

  // Perfil novo — apenas marca a semana atual
  if (!ultimaProcessada) {
    resultado.semanasProcessadas.push(semanaAtual);
    return resultado;
  }

  // Processa todas as semanas desde a última processada até agora
  const semanasPuladas = gerarSemanasEntre(ultimaProcessada, semanaAtual);

  for (const semanaIso of semanasPuladas) {
    const snapshot = criarSnapshotSemanal(
      perfil.id,
      semanaIso,
      materias,
      sessoes,
      historicoExistente
    );
    resultado.semanasProcessadas.push(semanaIso);
    resultado.snapshotCriado = true;

    // Calcula déficits apenas para a última semana pulada (a que o usuário está a fechar)
    if (semanaIso === semanasPuladas[semanasPuladas.length - 1]) {
      for (const materia of materias) {
        const dados = snapshot.porMateria[materia.id];
        if (dados && dados.realizado < dados.meta) {
          resultado.materiasComDeficit.push({
            materiaId: materia.id,
            deficit: dados.meta - dados.realizado,
            materiasConsecutivasComDeficit: 0,
          });
        }
      }
    }
  }

  return resultado;
}

/**
 * Gera a lista de semanas ISO entre duas semanas (exclusiva à direita).
 * Inclui a "de" e exclui a "ate" — porque a semana "ate" é a nova semana atual.
 *
 * Ex: gerarSemanasEntre("2026-W27", "2026-W30") → ["2026-W27", "2026-W28", "2026-W29"]
 *     gerarSemanasEntre("2026-W52", "2027-W02") → ["2026-W52", "2027-W01"]
 *
 * Usa o número máximo de semanas ISO por ano (53) para anos com 53 semanas.
 */
function gerarSemanasEntre(de: string, ate: string): string[] {
  const semanas: string[] = [];
  const mDe = de.match(/^(\d{4})-W(\d{1,2})$/);
  const mAte = ate.match(/^(\d{4})-W(\d{1,2})$/);
  if (!mDe || !mAte) return [];

  let anoAtual = parseInt(mDe[1], 10);
  let semAtual = parseInt(mDe[2], 10);
  const anoFim = parseInt(mAte[1], 10);
  const semFim = parseInt(mAte[2], 10);

  // Função para saber quantas semanas tem um ano ISO
  const semanasNoAno = (ano: number) => {
    // Semana 53 existe se 1 Jan pertence à semana anterior (ano-1)
    // Truque: se 28/dez + 6 dias cai em janeiro do próximo ano → ano tem 53 semanas
    const d = new Date(ano, 11, 28);
    const ref = new Date(d);
    ref.setDate(ref.getDate() + 6 - d.getDay() + 1); // próxima segunda
    return ref.getMonth() === 0 ? 53 : 52;
  };

  let guard = 0;
  while (guard++ < 1000) {
    // Critério de paragem: chegamos à semana "ate"
    if (anoAtual === anoFim && semAtual === semFim) break;
    // Critério de paragem de segurança: passamos
    if (anoAtual > anoFim || (anoAtual === anoFim && semAtual > semFim)) break;

    semanas.push(`${anoAtual}-W${semAtual.toString().padStart(2, '0')}`);
    semAtual++;
    if (semAtual > semanasNoAno(anoAtual)) {
      semAtual = 1;
      anoAtual++;
    }
  }

  return semanas;
}

/** Cria (ou reutiliza) o snapshot de uma semana. */
function criarSnapshotSemanal(
  perfilId: string,
  semanaIso: string,
  materias: Materia[],
  sessoes: SessaoEstudo[],
  historicoExistente: HistoricoSemanal[]
): HistoricoSemanal {
  const existente = historicoExistente.find(h => h.semanaIso === semanaIso);
  if (existente) return existente;

  const porMateria: HistoricoSemanal['porMateria'] = {};

  for (const materia of materias) {
    const { planejada, extra } = somarMinutosPorMateriaNaSemana(sessoes, materia.id, semanaIso);
    porMateria[materia.id] = {
      meta: materia.metaSemanalMinutos,
      realizado: planejada,
      extra,
    };
  }

  return {
    id: gerarId(),
    perfilId,
    semanaIso,
    porMateria,
    streakNoFinalDaSemana: 0,
  };
}
