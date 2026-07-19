/**
 * Motor de Simulação "E se eu continuar assim?" — Ápice
 *
 * Usa a média de horas semanais reais dos últimos 30 dias por matéria
 * e a data do evento-alvo para projetar quantas horas o usuário terá
 * estudado até lá.
 *
 * A rotina é imperfeita: a projeção é honesta, não otimista.
 */

import type { SessaoEstudo, Materia } from '@shared/types';
import { differenceInWeeks, differenceInDays, subDays, isAfter } from 'date-fns';

export interface ProjecaoMateria {
  materiaId: string;
  nome: string;
  horasEstudadasUltimos30Dias: number;
  mediaHorasPorSemana: number;
  semanasRestantes: number;
  horasProjetadasAteProva: number;
  metaHoras: number;
  deficitHoras: number;
  recomendacao: string;
  noRitmo: boolean;
}

export interface ResultadoSimulacao {
  dataEvento: string;
  nomeEvento: string;
  semanasRestantes: number;
  diasRestantes: number;
  projecoes: ProjecaoMateria[];
  resumo: string;
  /** Classificação global: 'otimo' | 'bom' | 'atencao' | 'critico'. */
  status: 'otimo' | 'bom' | 'atencao' | 'critico';
}

export function executarSimulacao(
  materias: Materia[],
  sessoes: SessaoEstudo[],
  dataEvento: string,
  metasHoras: Record<string, number>,
  nomeEvento: string = 'a prova',
  hoje: Date = new Date()
): ResultadoSimulacao {
  const dataEventoDate = new Date(dataEvento);
  const semanasRestantes = Math.max(1, differenceInWeeks(dataEventoDate, hoje));
  const diasRestantes = Math.max(0, differenceInDays(dataEventoDate, hoje));

  // Janela de 30 dias para calcular ritmo real
  const corte30Dias = subDays(hoje, 30);
  const sessoesRecentes = sessoes.filter(s =>
    isAfter(new Date(s.timestampInicio), corte30Dias)
  );

  const projecoes: ProjecaoMateria[] = [];

  for (const materia of materias.filter(m => !m.arquivada)) {
    const minutosRecentes = sessoesRecentes
      .filter(s => s.materiaId === materia.id)
      .reduce((sum, s) => sum + s.duracaoMinutos, 0);

    const horasRecentes = minutosRecentes / 60;
    const semanasNoPeriodo = 4.29;
    const mediaHorasPorSemana = horasRecentes / semanasNoPeriodo;
    const horasProjetadas = mediaHorasPorSemana * semanasRestantes;

    const metaHoras = metasHoras[materia.id] ?? 40;
    const deficitHoras = Math.max(0, metaHoras - horasProjetadas);
    const noRitmo = horasProjetadas >= metaHoras;

    const recomendacao = gerarRecomendacao(
      materia.nome, horasProjetadas, metaHoras,
      deficitHoras, mediaHorasPorSemana, semanasRestantes, nomeEvento
    );

    projecoes.push({
      materiaId: materia.id,
      nome: materia.nome,
      horasEstudadasUltimos30Dias: Math.round(horasRecentes * 10) / 10,
      mediaHorasPorSemana: Math.round(mediaHorasPorSemana * 10) / 10,
      semanasRestantes,
      horasProjetadasAteProva: Math.round(horasProjetadas),
      metaHoras,
      deficitHoras: Math.round(deficitHoras),
      recomendacao,
      noRitmo,
    });
  }

  // Ordena por déficit (mais urgente primeiro)
  projecoes.sort((a, b) => b.deficitHoras - a.deficitHoras);

  const { resumo, status } = gerarResumo(projecoes, semanasRestantes, diasRestantes, nomeEvento);

  return {
    dataEvento,
    nomeEvento,
    semanasRestantes,
    diasRestantes,
    projecoes,
    resumo,
    status,
  };
}

function gerarRecomendacao(
  nome: string,
  horasProjetadas: number,
  metaHoras: number,
  deficitHoras: number,
  mediaSemanal: number,
  semanasRestantes: number,
  nomeEvento: string
): string {
  if (deficitHoras <= 0) {
    return `No seu ritmo atual (${mediaSemanal.toFixed(1)}h/semana), você chegará a ${nomeEvento} com ${Math.round(horasProjetadas)}h de ${nome} — acima da meta de ${metaHoras}h. Continue assim!`;
  }

  const horasExtrasPorSemana = deficitHoras / semanasRestantes;
  const minutosExtrasPorSemana = Math.round(horasExtrasPorSemana * 60);

  if (minutosExtrasPorSemana <= 30) {
    return `Você está quase lá! Com apenas ${minutosExtrasPorSemana}min extras por semana, atinge a meta de ${metaHoras}h de ${nome}.`;
  }

  return `No seu ritmo atual (${mediaSemanal.toFixed(1)}h/semana), você chegará a ${nomeEvento} com ${Math.round(horasProjetadas)}h de ${nome} — ${Math.round(deficitHoras)}h abaixo da meta de ${metaHoras}h. Considere aumentar ${Math.round(horasExtrasPorSemana * 60)}min/semana.`;
}

function gerarResumo(
  projecoes: ProjecaoMateria[],
  semanasRestantes: number,
  diasRestantes: number,
  nomeEvento: string
): { resumo: string; status: 'otimo' | 'bom' | 'atencao' | 'critico' } {
  const noRitmo = projecoes.filter(p => p.noRitmo).length;
  const total = projecoes.length;

  if (total === 0) {
    return {
      resumo: `Adicione matérias para ver a projeção até ${nomeEvento}.`,
      status: 'atencao',
    };
  }

  const pct = noRitmo / total;

  if (pct === 1) {
    return {
      resumo: `Excelente! Está no ritmo certo para todas as ${total} matérias. Faltam ${semanasRestantes} semanas (${diasRestantes} dias) para ${nomeEvento}.`,
      status: 'otimo',
    };
  }
  if (pct === 0) {
    return {
      resumo: `Atenção: nenhuma matéria está no ritmo. Faltam ${semanasRestantes} semanas (${diasRestantes} dias) para ${nomeEvento}. É hora de intensificar.`,
      status: 'critico',
    };
  }
  if (pct >= 0.7) {
    return {
      resumo: `Está no ritmo para ${noRitmo} de ${total} matérias. Faltam ${semanasRestantes} semanas. Continue assim, com pequenos ajustes.`,
      status: 'bom',
    };
  }
  return {
    resumo: `Está no ritmo para ${noRitmo} de ${total} matérias. ${total - noRitmo} precisam de mais atenção. Faltam ${semanasRestantes} semanas (${diasRestantes} dias) para ${nomeEvento}.`,
    status: 'atencao',
  };
}
