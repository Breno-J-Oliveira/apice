import { ReactNode } from 'react';
import { cn } from '@shared/lib/utils';
import { Mountain } from 'lucide-react';

interface EmptyStateProps {
  /** Ícone customizado (Lucide). Padrão: montanha. */
  icone?: ReactNode;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  className?: string;
  /** Variante: 'card' (com card) ou 'plain' (sem). */
  variante?: 'card' | 'plain';
}

export function EmptyState({ icone, titulo, descricao, acao, className, variante = 'card' }: EmptyStateProps) {
  const conteudo = (
    <div className={cn('text-center py-10 sm:py-12 px-4', className)}>
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-soft text-accent mb-4">
        {icone ?? <Mountain size={26} strokeWidth={1.5} />}
      </div>
      <h3 className="font-serif text-lg font-semibold text-text-primary">{titulo}</h3>
      {descricao && <p className="text-sm text-text-secondary mt-1 max-w-md mx-auto">{descricao}</p>}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
  return variante === 'card' ? <div className="card">{conteudo}</div> : conteudo;
}
