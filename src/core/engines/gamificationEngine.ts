/**
 * Motor de Gamificação — Ápice
 *
 * XP, níveis, streaks e conquistas. O Ápice não pressiona; celebra
 * progressos reais sem transformar a rotina numa busca por números.
 */

import type { Perfil, SessaoEstudo, Redacao, Simulado, Conquista, TipoConquista, Flashcard } from '@shared/types';
import { startOfDay, differenceInDays, isSameDay } from 'date-fns';
import { gerarId } from '@shared/lib/utils';

export function calcularXP(
  tipo: 'sessao_planejada' | 'sessao_extra' | 'redacao' | 'simulado' | 'flashcard',
  duracaoMinutos?: number
): number {
  switch (tipo) {
    case 'sessao_planejada':
      return Math.max(0, Math.round(duracaoMinutos ?? 0));
    case 'sessao_extra':
      return Math.max(0, Math.round((duracaoMinutos ?? 0) * 1.5));
    case 'redacao':
      return 50;
    case 'simulado':
      return 80;
    case 'flashcard':
      return 3;
  }
}

export function calcularXPTotal(
  sessoes: SessaoEstudo[],
  redacoes: Redacao[],
  flashcardsCount: number,
  simulados: Simulado[]
): number {
  let xp = 0;
  for (const s of sessoes) {
    xp += s.tipo === 'extra'
      ? Math.round(s.duracaoMinutos * 1.5)
      : s.duracaoMinutos;
  }
  xp += redacoes.length * 50;
  xp += simulados.length * 80;
  xp += flashcardsCount * 3;
  return xp;
}

/**
 * Curva de níveis: nível N requer `N * 100 + N^2 * 15` XP.
 *   1→2: 115 XP, 2→3: 260 XP, 3→4: 435 XP, 5→6: 875 XP, 10→11: 2.650 XP
 */
export function calcularNivel(xpTotal: number): { nivel: number; xpAtual: number; xpProximoNivel: number; progressoPct: number } {
  if (xpTotal < 0) xpTotal = 0;
  let nivel = 1;
  let xpAcumulado = 0;

  while (true) {
    const xpNecessario = nivel * 100 + nivel * nivel * 15;
    if (xpAcumulado + xpNecessario > xpTotal) {
      const xpAtual = xpTotal - xpAcumulado;
      return {
        nivel,
        xpAtual,
        xpProximoNivel: xpNecessario,
        progressoPct: Math.round((xpAtual / xpNecessario) * 100),
      };
    }
    xpAcumulado += xpNecessario;
    nivel++;
    if (nivel > 100) {
      // Limite de segurança
      return { nivel: 100, xpAtual: 0, xpProximoNivel: 1, progressoPct: 100 };
    }
  }
}

/**
 * Calcula o streak atual (dias consecutivos com pelo menos 1 sessão).
 * Consome dias de graça quando há um dia sem estudo.
 *
 * Recupera 1 dia de graça por dia estudado (até ao máximo).
 */
export function calcularStreak(
  sessoes: SessaoEstudo[],
  diasGracaDisponiveis: number,
  hoje: Date = new Date()
): { streak: number; diasGracaUsados: number; diasGracaRestantes: number } {
  if (sessoes.length === 0) {
    return { streak: 0, diasGracaUsados: 0, diasGracaRestantes: diasGracaDisponiveis };
  }

  const diasComEstudo = new Set<string>();
  for (const s of sessoes) {
    const dia = startOfDay(new Date(s.timestampInicio)).toISOString();
    diasComEstudo.add(dia);
  }

  const hojeInicio = startOfDay(hoje).toISOString();
  const hojeTemEstudo = diasComEstudo.has(hojeInicio);

  let streak = hojeTemEstudo ? 1 : 0;
  let gracaRestante = Math.max(0, diasGracaDisponiveis);
  let gracaUsada = 0;

  if (!hojeTemEstudo && gracaRestante <= 0) {
    return { streak: 0, diasGracaUsados: 0, diasGracaRestantes: gracaRestante };
  }

  if (!hojeTemEstudo && gracaRestante > 0) {
    gracaRestante--;
    gracaUsada++;
    streak = 1;
  }

  const hojeDate = startOfDay(hoje);
  for (let i = 1; i <= 365; i++) {
    const diaAnterior = new Date(hojeDate);
    diaAnterior.setDate(diaAnterior.getDate() - i);
    const diaStr = startOfDay(diaAnterior).toISOString();

    if (diasComEstudo.has(diaStr)) {
      streak++;
      // Recupera graça
      gracaRestante = Math.min(diasGracaDisponiveis, gracaRestante + 1);
    } else if (gracaRestante > 0) {
      gracaRestante--;
      gracaUsada++;
      streak++;
    } else {
      break;
    }
  }

  return { streak, diasGracaUsados: gracaUsada, diasGracaRestantes: gracaRestante };
}

/**
 * Verifica conquistas desbloqueadas. Retorna apenas as NOVAS.
 */
export function verificarConquistas(
  perfilId: string,
  conquistasExistentes: Conquista[],
  dados: {
    streak: number;
    nivel: number;
    xpTotal: number;
    redacoes: Redacao[];
    simulados: Simulado[];
    flashcardsCount: number;
    sessoes: SessaoEstudo[];
    sessoesCount: number;
  }
): Conquista[] {
  const novas: Conquista[] = [];
  const tiposExistentes = new Set(conquistasExistentes.map(c => c.tipo));
  const agora = new Date().toISOString();

  const totalHoras = dados.sessoes.reduce((s, sess) => s + sess.duracaoMinutos, 0) / 60;

  const primeiraSessaoHora = dados.sessoes.length > 0
    ? new Date(dados.sessoes.reduce((min, s) => s.timestampInicio < min ? s.timestampInicio : min, dados.sessoes[0].timestampInicio)).getHours()
    : 12;
  const madrugador = dados.sessoes.some(s => {
    const hora = new Date(s.timestampInicio).getHours();
    return hora >= 4 && hora < 7;
  });
  const noturno = dados.sessoes.some(s => {
    const hora = new Date(s.timestampInicio).getHours();
    return hora >= 22 || hora < 2;
  });

  const conquistas: { tipo: TipoConquista; titulo: string; descricao: string; icone: string; condicao: boolean }[] = [
    { tipo: 'primeira_sessao', titulo: 'Primeira Sessão', descricao: 'Começou a sua jornada de estudos', icone: '🎯', condicao: dados.sessoesCount >= 1 },
    { tipo: 'primeira_anotacao', titulo: 'Primeira Anotação', descricao: 'Criou a sua primeira anotação', icone: '📝', condicao: false },
    { tipo: 'streak_7_dias', titulo: 'Uma Semana de Foco', descricao: '7 dias consecutivos a estudar', icone: '🔥', condicao: dados.streak >= 7 },
    { tipo: 'streak_30_dias', titulo: '30 Dias de Foco', descricao: '30 dias consecutivos a estudar', icone: '🔥', condicao: dados.streak >= 30 },
    { tipo: 'streak_100_dias', titulo: '100 Dias de Foco', descricao: '100 dias consecutivos — lenda', icone: '🏆', condicao: dados.streak >= 100 },
    { tipo: '10_horas_estudo', titulo: 'Maratona de 10 Horas', descricao: 'Acumulou 10 horas de estudo', icone: '⏱️', condicao: totalHoras >= 10 },
    { tipo: '50_horas_estudo', titulo: 'Maratona de 50 Horas', descricao: 'Acumulou 50 horas de estudo', icone: '⏱️', condicao: totalHoras >= 50 },
    { tipo: '100_horas_estudo', titulo: 'Maratona de 100 Horas', descricao: 'Acumulou 100 horas de estudo', icone: '⏱️', condicao: totalHoras >= 100 },
    { tipo: 'primeiro_simulado', titulo: 'Primeiro Simulado', descricao: 'Completou o primeiro simulado', icone: '📋', condicao: dados.simulados.length >= 1 },
    { tipo: 'primeira_redacao_900', titulo: 'Redação Nota 900+', descricao: 'Atingiu 900 pontos ou mais numa redação', icone: '✍️', condicao: dados.redacoes.some(r =>
      Object.values(r.notas).reduce((a, b) => a + b, 0) >= 900) },
    { tipo: 'nivel_5', titulo: 'Nível 5', descricao: 'Atingiu o nível 5', icone: '⭐', condicao: dados.nivel >= 5 },
    { tipo: 'nivel_10', titulo: 'Nível 10', descricao: 'Atingiu o nível 10', icone: '🌟', condicao: dados.nivel >= 10 },
    { tipo: 'madrugador', titulo: 'Madrugador', descricao: 'Estudou entre 4h e 7h da manhã', icone: '🌅', condicao: madrugador },
    { tipo: 'noturno', titulo: 'Noturno', descricao: 'Estudou entre 22h e 2h da manhã', icone: '🌙', condicao: noturno },
    { tipo: 'meta_4_semanas_seguidas', titulo: 'Consistência Imbatível', descricao: 'Bateu a meta semanal 4 semanas seguidas', icone: '🎖️', condicao: false },
    { tipo: 'todas_materias_semana', titulo: 'Cobertura Completa', descricao: 'Estudou todas as matérias numa semana', icone: '🎯', condicao: false },
  ];

  for (const c of conquistas) {
    if (c.condicao && !tiposExistentes.has(c.tipo)) {
      novas.push({
        id: gerarId(),
        perfilId,
        tipo: c.tipo,
        desbloqueadaEm: agora,
        titulo: c.titulo,
        descricao: c.descricao,
        icone: c.icone,
      });
    }
  }

  return novas;
}
