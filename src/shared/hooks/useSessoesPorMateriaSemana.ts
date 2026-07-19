import { useMemo } from 'react';
import type { SessaoEstudo, Materia } from '@shared/types';
import { somarMinutosPorMateriaNaSemana, calcularProgressoSemanal, metaConcluida } from '@core/engines/metaEngine';

export interface MateriaComProgresso extends Materia {
  acumulado: number;
  extra: number;
  progresso: number;
  concluida: boolean;
  falta: number;
}

/**
 * Hook que devolve as matérias com seu progresso semanal calculado.
 * Elimina repetição entre Dashboard, Estudar, Matérias, Relatórios.
 */
export function useSessoesPorMateriaSemana(
  materias: Materia[],
  sessoes: SessaoEstudo[],
  semanaIso: string
): MateriaComProgresso[] {
  return useMemo(() => {
    return materias.map(m => {
      const { planejada, extra } = somarMinutosPorMateriaNaSemana(sessoes, m.id, semanaIso);
      return {
        ...m,
        acumulado: planejada,
        extra,
        progresso: calcularProgressoSemanal(planejada, m.metaSemanalMinutos),
        concluida: metaConcluida(planejada, m.metaSemanalMinutos),
        falta: Math.max(0, m.metaSemanalMinutos - planejada),
      };
    });
  }, [materias, sessoes, semanaIso]);
}
