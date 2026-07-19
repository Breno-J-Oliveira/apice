import { ReactNode } from 'react';
import { cn } from '@shared/lib/utils';

interface PageHeaderProps {
  titulo: string;
  subtitulo?: string;
  acao?: ReactNode;
  children?: ReactNode;
  /** Mostra um breadcrumb no topo (caminho de páginas). */
  breadcrumb?: ReactNode;
  className?: string;
}

export function PageHeader({ titulo, subtitulo, acao, children, breadcrumb, className }: PageHeaderProps) {
  return (
    <div className={cn('page-header', className)}>
      {breadcrumb && (
        <div className="text-xs text-text-muted mb-2 flex items-center gap-1.5 flex-wrap">
          {breadcrumb}
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="page-title">{titulo}</h1>
          {subtitulo && <p className="page-subtitle">{subtitulo}</p>}
        </div>
        {acao && <div className="flex-shrink-0">{acao}</div>}
      </div>
      {children}
    </div>
  );
}
