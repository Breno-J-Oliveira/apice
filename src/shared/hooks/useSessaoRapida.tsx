import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { usePerfilStore } from '@shared/stores/usePerfilStore';
import { useMateriasStore } from '@shared/stores/useMateriasStore';
import { useSessoesStore } from '@shared/stores/useSessoesStore';
import { Modal } from '@shared/components/Modal';
import { toast } from 'sonner';
import { useSessoesPorMateriaSemana } from '@shared/hooks/useSessoesPorMateriaSemana';
import { getAnoSemanaIso } from '@core/engines/metaEngine';
import { formatarMinutos, cn } from '@shared/lib/utils';

/**
 * Sessão Rápida — modal global acessível via atalho "S".
 * Permite registar uma sessão avulsa para qualquer matéria.
 */
export function useSessaoRapida() {
  const [aberto, setAberto] = useState(false);
  const abrir = () => setAberto(true);
  const fechar = () => setAberto(false);
  return { aberto, abrir, fechar };
}

interface SessaoRapidaModalProps {
  aberto: boolean;
  onFechar: () => void;
}

export function SessaoRapidaModal({ aberto, onFechar }: SessaoRapidaModalProps) {
  const { perfilAtivo } = usePerfilStore();
  const { materias } = useMateriasStore();
  const { sessoes, registrarSessao } = useSessoesStore();
  const [materiaId, setMateriaId] = useState<string>('');
  const [duracao, setDuracao] = useState<number>(25);
  const [nota, setNota] = useState('');

  const semanaAtual = perfilAtivo ? getAnoSemanaIso(new Date(), perfilAtivo.diaInicioSemana) : '';
  const materiasAtivas = materias.filter(m => !m.arquivada);
  const materiaAtiva = materiasAtivas.find(m => m.id === materiaId);
  const materiasComProgresso = useSessoesPorMateriaSemana(materiasAtivas, sessoes, semanaAtual);

  useEffect(() => {
    if (!materiaId && materiasComProgresso.length > 0) {
      const proxima = materiasComProgresso.find(m => !m.concluida) ?? materiasComProgresso[0];
      setMateriaId(proxima.id);
    }
  }, [materiasComProgresso, materiaId]);

  useEffect(() => {
    if (!aberto) {
      setNota('');
      setDuracao(25);
    }
  }, [aberto]);

  const handleRegistar = async () => {
    if (!perfilAtivo || !materiaAtiva) return;
    try {
      await registrarSessao({
        perfilId: perfilAtivo.id,
        materiaId: materiaAtiva.id,
        duracaoMinutos: duracao,
        duracaoRealMinutos: duracao,
        origem: 'sessao-rapida',
        nota: nota.trim() || undefined,
        metaSemanalMinutos: materiaAtiva.metaSemanalMinutos,
        diaInicioSemana: perfilAtivo.diaInicioSemana,
      });
      toast.success(`Sessão rápida registada: ${formatarMinutos(duracao)} de ${materiaAtiva.nome}`);
      onFechar();
    } catch {
      toast.error('Erro ao registar sessão rápida');
    }
  };

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Sessão rápida" largura="md">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary -mt-2">
          Regista uma sessão avulsa para uma matéria. Útil para quando estudaste offline.
        </p>

        <div>
          <label className="text-xs font-medium text-text-muted mb-2 block">Matéria</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto">
            {materiasComProgresso.map(m => (
              <button
                key={m.id}
                onClick={() => setMateriaId(m.id)}
                className={cn(
                  'flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all',
                  materiaId === m.id
                    ? 'border-accent bg-accent-soft'
                    : 'border-border-light hover:border-border hover:bg-bg-hover'
                )}
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: m.cor }} />
                <span className="text-xs font-medium text-text-primary truncate flex-1 min-w-0">{m.nome}</span>
                {m.concluida && <span className="text-success text-xs">✓</span>}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted mb-2 block">Duração</label>
          <div className="flex items-center gap-2 flex-wrap">
            {[5, 10, 15, 25, 30, 45, 60, 90].map(d => (
              <button
                key={d}
                onClick={() => setDuracao(d)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  duracao === d
                    ? 'bg-accent text-white'
                    : 'bg-bg-card border border-border text-text-secondary hover:bg-bg-hover'
                )}
              >
                {d}min
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted mb-2 block">Nota (opcional)</label>
          <input
            type="text"
            value={nota}
            onChange={e => setNota(e.target.value)}
            placeholder="Ex: cap. 3, exercícios 1-10"
            className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-sm focus:border-accent outline-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onFechar}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-bg-card text-text-secondary text-sm font-medium hover:bg-bg-hover transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleRegistar}
            disabled={!materiaAtiva}
            className="flex-1 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Registar
          </button>
        </div>
      </div>
    </Modal>
  );
}

/** Botão flutuante para abrir sessão rápida (visível em todas as páginas). */
export function SessaoRapidaBotao({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-accent text-white shadow-soft-lg flex items-center justify-center hover:bg-accent-hover transition-colors"
      aria-label="Sessão rápida (atalho: S)"
      title="Sessão rápida (S)"
    >
      <Plus size={22} strokeWidth={2.5} />
    </motion.button>
  );
}
