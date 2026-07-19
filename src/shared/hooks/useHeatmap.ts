import { useMemo } from 'react';
import { startOfDay, subDays, isAfter } from 'date-fns';
import type { SessaoEstudo } from '@shared/types';

/**
 * Gera dados para um heatmap de consistência (estilo GitHub).
 *
 * @param sessoes - Todas as sessões do usuário
 * @param dias - Quantos dias para trás (padrão: 90)
 * @param hoje - Data de referência
 * @returns Array de { data, totalMinutos, intensidade (0-4), temEstudo }
 */
export function useHeatmap(sessoes: SessaoEstudo[], dias: number = 90, hoje: Date = new Date()) {
  return useMemo(() => {
    const corte = startOfDay(subDays(hoje, dias - 1));
    const sessoesRecentes = sessoes.filter(s => isAfter(new Date(s.timestampInicio), corte));

    // Agrupa minutos por dia
    const minutosPorDia = new Map<string, number>();
    for (const s of sessoesRecentes) {
      const dia = startOfDay(new Date(s.timestampInicio)).toISOString();
      minutosPorDia.set(dia, (minutosPorDia.get(dia) ?? 0) + s.duracaoMinutos);
    }

    // Gera array de dias com intensidade
    const resultado: { data: Date; totalMinutos: number; intensidade: 0 | 1 | 2 | 3 | 4; temEstudo: boolean }[] = [];
    for (let i = dias - 1; i >= 0; i--) {
      const d = startOfDay(subDays(hoje, i));
      const key = d.toISOString();
      const total = minutosPorDia.get(key) ?? 0;
      const intensidade: 0 | 1 | 2 | 3 | 4 =
        total === 0 ? 0 :
        total < 15 ? 1 :
        total < 30 ? 2 :
        total < 60 ? 3 : 4;
      resultado.push({ data: d, totalMinutos: total, intensidade, temEstudo: total > 0 });
    }

    return resultado;
  }, [sessoes, dias, hoje]);
}
