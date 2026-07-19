/**
 * Motor de Priorização Inteligente — Ápice
 *
 * Calcula um score de urgência por matéria, ordenando a fila "O que
 * estudar agora" do dashboard. Quatro fatores ponderados:
 *
 *   score = peso_materia    × 0.30
 *         + deficit_semanal × 0.30
 *         + dias_sem_estudar× 0.20
 *         + proximidade_evento × 0.20
 *
 * O resultado é transparente: cada posição vem com uma explicação textual
 * do porquê daquela matéria estar ali.
 */

import type {
  Perfil, Materia, SessaoEstudo, Subtopico,
  MateriaPriorizada, PesosPriorizacao,
} from '@shared/types';
import { differenceInDays, differenceInWeeks } from 'date-fns';

export const PESOS_PADRAO: PesosPriorizacao = {
  pesoMateria: 0.30,
  defictSemanal: 0.30,
  diasSemEstudar: 0.20,
  proximidadeProva: 0.20,
};

export function calcularPrioridades(
  perfil: Perfil,
  materias: Materia[],
  subtopicos: Subtopico[],
  sessoes: SessaoEstudo[],
  semanaAtual: string,
  pesos: PesosPriorizacao = PESOS_PADRAO,
  hoje: Date = new Date()
): MateriaPriorizada[] {
  const materiasAtivas = materias.filter(m => !m.arquivada);
  if (materiasAtivas.length === 0) return [];

  const dataEvento = new Date(perfil.dataEvento);
  const semanasAteProva = Math.max(1, differenceInWeeks(dataEvento, hoje));
  const diasAteProva = Math.max(1, differenceInDays(dataEvento, hoje));
  const nomeEvento = perfil.nomeEvento || 'a prova';

  const resultados: MateriaPriorizada[] = [];

  for (const materia of materiasAtivas) {
    // 1. Peso da matéria (1-5 normalizado para 0-1)
    const scorePesoMateria = (materia.pesoPrioridade - 1) / 4;

    // 2. Déficit semanal atual
    const { planejada } = somarSessoesNaSemana(sessoes, materia.id, semanaAtual);
    const deficit = Math.max(0, materia.metaSemanalMinutos - planejada);
    const deficitPct = materia.metaSemanalMinutos > 0
      ? Math.min(1, deficit / materia.metaSemanalMinutos)
      : 0;

    // 3. Dias sem estudar
    const diasSemEstudar = calcularDiasSemEstudar(sessoes, materia.id, hoje);
    const scoreDiasSemEstudar = Math.min(1, diasSemEstudar / 14);

    // 4. Proximidade do evento + domínio dos subtópicos
    const subMateria = subtopicos.filter(s => s.materiaId === materia.id);
    const dominioMedio = calcularDominioMedio(subMateria);
    const urgenciaProva = Math.min(1, semanasAteProva <= 4 ? 1 : 4 / semanasAteProva);
    const scoreProximidade = urgenciaProva * (1 - dominioMedio);

    const score =
      scorePesoMateria * pesos.pesoMateria +
      deficitPct * pesos.defictSemanal +
      scoreDiasSemEstudar * pesos.diasSemEstudar +
      scoreProximidade * pesos.proximidadeProva;

    const motivo = gerarMotivo(
      materia.nome, scorePesoMateria, deficitPct,
      diasSemEstudar, dominioMedio, semanasAteProva, nomeEvento
    );

    resultados.push({
      materiaId: materia.id,
      score: Math.round(score * 1000) / 1000,
      motivo,
    });
  }

  return resultados.sort((a, b) => b.score - a.score);
}

function somarSessoesNaSemana(
  sessoes: SessaoEstudo[],
  materiaId: string,
  semanaIso: string
): { planejada: number; extra: number } {
  let planejada = 0;
  let extra = 0;
  for (const s of sessoes) {
    if (s.materiaId === materiaId && s.semanaIso === semanaIso) {
      if (s.tipo === 'planejada') planejada += s.duracaoMinutos;
      else extra += s.duracaoMinutos;
    }
  }
  return { planejada, extra };
}

function calcularDiasSemEstudar(
  sessoes: SessaoEstudo[],
  materiaId: string,
  hoje: Date
): number {
  const sessoesMateria = sessoes
    .filter(s => s.materiaId === materiaId)
    .sort((a, b) => b.timestampInicio.localeCompare(a.timestampInicio));

  if (sessoesMateria.length === 0) return 30;
  const ultimaSessao = new Date(sessoesMateria[0].timestampInicio);
  return Math.max(0, differenceInDays(hoje, ultimaSessao));
}

function calcularDominioMedio(subtopicos: Subtopico[]): number {
  if (subtopicos.length === 0) return 0;
  const soma = subtopicos.reduce((acc, s) => {
    switch (s.status) {
      case 'dominado': return acc + 1;
      case 'em_andamento': return acc + 0.5;
      default: return acc;
    }
  }, 0);
  return soma / subtopicos.length;
}

function gerarMotivo(
  nomeMateria: string,
  scorePeso: number,
  deficitPct: number,
  diasSemEstudar: number,
  dominioMedio: number,
  semanasProva: number,
  nomeEvento: string
): string {
  const razoes: string[] = [];

  if (scorePeso > 0.7) {
    razoes.push('peso de prioridade alto');
  }

  if (deficitPct > 0.5) {
    razoes.push(`está ${Math.round(deficitPct * 100)}% abaixo da meta semanal`);
  } else if (deficitPct > 0.2) {
    razoes.push('ainda não atingiu a meta da semana');
  }

  if (diasSemEstudar >= 7) {
    razoes.push(`não estuda há ${diasSemEstudar} dias`);
  } else if (diasSemEstudar >= 3) {
    razoes.push(`última sessão foi há ${diasSemEstudar} dias`);
  }

  if (dominioMedio < 0.3 && semanasProva <= 4) {
    razoes.push(`domínio baixo e ${nomeEvento} está em ${semanasProva} semanas`);
  }

  if (razoes.length === 0) {
    return `${nomeMateria} está em dia — continue assim!`;
  }

  return `${nomeMateria} está em prioridade porque ${razoes.join(', ')}`;
}
