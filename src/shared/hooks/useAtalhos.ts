import { useEffect } from 'react';

type Handler = (e: KeyboardEvent) => void;

/**
 * Hook para registrar atalhos de teclado globais.
 * Combinações como 'mod+k' (Cmd+K no Mac, Ctrl+K em outros) são traduzidas.
 */
export function useAtalhos(atalhos: Record<string, Handler>, habilitado: boolean = true) {
  useEffect(() => {
    if (!habilitado) return;

    const handler = (e: KeyboardEvent) => {
      // Ignora se estiver em input, textarea ou contentEditable
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const parts: string[] = [];
      if (e.metaKey || e.ctrlKey) parts.push('mod');
      if (e.shiftKey) parts.push('shift');
      if (e.altKey) parts.push('alt');
      const key = e.key.toLowerCase();
      if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
        parts.push(key);
      }
      const combo = parts.join('+');

      const fn = atalhos[combo] || atalhos[parts.join('+')];
      if (fn) {
        e.preventDefault();
        fn(e);
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [atalhos, habilitado]);
}
