import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatarMinutos } from '@shared/lib/utils';
import { metaConcluida, calcularProgressoSemanal } from '@core/engines/metaEngine';

interface BarraProgressoMateriaProps {
  /** Cor principal (geralmente cor da matéria). */
  cor: string;
  /** Nome da matéria. */
  nome: string;
  /** Minutos já estudados (somatório de sessões planejadas). */
  acumulado: number;
  /** Meta semanal em minutos. */
  meta: number;
  /** Mostrar texto "Falta Xmin" abaixo. */
  mostrarFalta?: boolean;
  /** Tamanho: 'sm' (h-1.5) | 'md' (h-2) | 'lg' (h-3). */
  tamanho?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BarraProgressoMateria({
  cor, nome, acumulado, meta,
  mostrarFalta = false, tamanho = 'md', className,
}: BarraProgressoMateriaProps) {
  const progresso = calcularProgressoSemanal(acumulado, meta);
  const concluida = metaConcluida(acumulado, meta);
  const falta = Math.max(0, meta - acumulado);

  const altura = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' }[tamanho];

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm text-text-secondary truncate flex-1 min-w-0">{nome}</span>
        <span className="text-xs text-text-muted flex-shrink-0">
          {concluida
            ? <CheckCircle2 size={14} className="inline text-success" />
            : `${formatarMinutos(acumulado)} / ${formatarMinutos(meta)}`}
        </span>
      </div>
      <div className={cn('bg-bg-hover rounded-full overflow-hidden', altura)}>
        {concluida ? (
          <div className="h-full rounded-full bg-success w-full" />
        ) : (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progresso}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full"
            style={{ backgroundColor: cor }}
          />
        )}
      </div>
      {mostrarFalta && !concluida && (
        <p className="text-xs text-text-muted mt-0.5">Falta {formatarMinutos(falta)}</p>
      )}
    </div>
  );
}
