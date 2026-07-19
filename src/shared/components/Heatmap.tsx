import { cn } from '@shared/lib/utils';
import { useHeatmap } from '@shared/hooks/useHeatmap';
import type { SessaoEstudo } from '@shared/types';
import { Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { formatarMinutosCurto, formatarData } from '@shared/lib/utils';

interface HeatmapProps {
  sessoes: SessaoEstudo[];
  dias?: number;
  className?: string;
}

const CORES_INTENSIDADE = [
  'var(--color-bg-hover)',       // 0 - sem estudo
  'rgba(196, 122, 90, 0.2)',     // 1 - < 15min
  'rgba(196, 122, 90, 0.4)',     // 2 - < 30min
  'rgba(196, 122, 90, 0.7)',     // 3 - < 60min
  'var(--color-accent)',         // 4 - >= 60min
];

export function Heatmap({ sessoes, dias = 90, className }: HeatmapProps) {
  const data = useHeatmap(sessoes, dias);

  const { semanas, totalMinutos, diasComEstudo } = useMemo(() => {
    // Agrupa por semana (7 dias) e por dia da semana
    const semanas: { data: Date; intensidade: 0 | 1 | 2 | 3 | 4; totalMinutos: number; temEstudo?: boolean }[][] = [];
    let semanaAtual: typeof semanas[0] = [];

    data.forEach((d, i) => {
      semanaAtual.push(d);
      if (semanaAtual.length === 7 || i === data.length - 1) {
        semanas.push(semanaAtual);
        semanaAtual = [];
      }
    });

    const totalMinutos = data.reduce((s, d) => s + d.totalMinutos, 0);
    const diasComEstudo = data.filter(d => d.temEstudo).length;

    return { semanas, totalMinutos, diasComEstudo };
  }, [data]);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span>Menos</span>
          <div className="flex gap-0.5">
            {CORES_INTENSIDADE.map((cor, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: cor }}
              />
            ))}
          </div>
          <span>Mais</span>
        </div>
        <div className="text-xs text-text-muted">
          {diasComEstudo} {diasComEstudo === 1 ? 'dia' : 'dias'} com estudo · {formatarMinutosCurto(totalMinutos)} no total
        </div>
      </div>
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="inline-flex gap-0.5">
          {semanas.map((semana, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {semana.map((dia, di) => (
                <motion.div
                  key={di}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: wi * 0.005 + di * 0.002 }}
                  className="w-3 h-3 rounded-sm cursor-pointer hover:ring-2 hover:ring-accent/40 transition-shadow"
                  style={{ backgroundColor: CORES_INTENSIDADE[dia.intensidade] }}
                  title={`${formatarData(dia.data.toISOString())} · ${formatarMinutosCurto(dia.totalMinutos)}${dia.temEstudo ? '' : ' · sem estudo'}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
