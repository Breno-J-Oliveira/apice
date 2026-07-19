import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@shared/lib/utils';

interface ConfirmDialogProps {
  aberto: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
  titulo: string;
  descricao?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  /** Variante: 'perigo' (vermelho) ou 'normal' (accent). */
  variante?: 'perigo' | 'normal';
  children?: ReactNode;
}

export function ConfirmDialog({
  aberto, onConfirmar, onCancelar, titulo, descricao,
  textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar',
  variante = 'perigo', children,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {aberto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={onCancelar}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
            role="dialog"
            aria-modal="true"
          >
            <div className="card max-w-sm w-full p-6 pointer-events-auto shadow-soft-lg">
              <div className="flex items-start gap-3 mb-3">
                {variante === 'perigo' && (
                  <div className="w-9 h-9 rounded-xl bg-danger/10 text-danger flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={18} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-lg font-semibold text-text-primary">{titulo}</h2>
                  {descricao && <p className="text-sm text-text-secondary mt-1">{descricao}</p>}
                </div>
              </div>
              {children}
              <div className="flex gap-2 mt-5">
                <button
                  onClick={onCancelar}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-bg-card text-text-secondary text-sm font-medium hover:bg-bg-hover transition-colors"
                >
                  {textoCancelar}
                </button>
                <button
                  onClick={onConfirmar}
                  className={cn(
                    'flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors',
                    variante === 'perigo' ? 'bg-danger hover:bg-danger/90' : 'bg-accent hover:bg-accent-hover'
                  )}
                  autoFocus
                >
                  {textoConfirmar}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Hook para gestão simples de confirmar. */
import { useState, useCallback } from 'react';
export function useConfirm() {
  const [estado, setEstado] = useState<{
    aberto: boolean;
    titulo: string;
    descricao?: string;
    onConfirmar?: () => void;
    variante?: 'perigo' | 'normal';
    textoConfirmar?: string;
  }>({ aberto: false, titulo: '' });

  const pedirConfirmacao = useCallback((opts: {
    titulo: string;
    descricao?: string;
    variante?: 'perigo' | 'normal';
    textoConfirmar?: string;
    onConfirmar: () => void;
  }) => {
    setEstado({ aberto: true, ...opts });
  }, []);

  const fechar = useCallback(() => {
    setEstado(s => ({ ...s, aberto: false }));
  }, []);

  const dialog = (
    <ConfirmDialog
      aberto={estado.aberto}
      onConfirmar={() => { estado.onConfirmar?.(); fechar(); }}
      onCancelar={fechar}
      titulo={estado.titulo}
      descricao={estado.descricao}
      variante={estado.variante}
      textoConfirmar={estado.textoConfirmar}
    />
  );

  return { pedirConfirmacao, fechar, dialog };
}
