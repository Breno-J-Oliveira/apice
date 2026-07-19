import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo?: string;
  children: ReactNode;
  largura?: 'sm' | 'md' | 'lg';
  /** Esconde o botão X (fechar). */
  semFechar?: boolean;
}

export function Modal({ aberto, onFechar, titulo, children, largura = 'md', semFechar = false }: ModalProps) {
  // Fecha com ESC
  useEffect(() => {
    if (!aberto) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [aberto, onFechar]);

  // Bloqueia scroll do body
  useEffect(() => {
    if (aberto) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [aberto]);

  const larguras = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

  return (
    <AnimatePresence>
      {aberto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
            onClick={onFechar}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[91] flex items-center justify-center p-4 pointer-events-none"
            role="dialog"
            aria-modal="true"
          >
            <div className={`card ${larguras[largura]} w-full p-6 pointer-events-auto shadow-soft-lg`}>
              {(titulo || !semFechar) && (
                <div className="flex items-center justify-between mb-4">
                  {titulo && <h2 className="font-serif text-lg font-semibold">{titulo}</h2>}
                  {!semFechar && (
                    <button
                      onClick={onFechar}
                      className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted"
                      aria-label="Fechar"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              )}
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
