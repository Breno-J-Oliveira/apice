import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerfilStore } from '@shared/stores/usePerfilStore';
import { ArrowRight, Mountain, Sparkles, Target, Timer, Shield } from 'lucide-react';
import { cn } from '@shared/lib/utils';

const PASSOS = [
  {
    titulo: 'Bem-vindo ao Ápice',
    icone: Mountain,
    descricao: 'O seu sistema operacional pessoal de estudos. Tudo num só lugar: metas, sessões, anotações, simulados e projeções.',
    destaque: 'Os seus dados ficam 100% no seu dispositivo. Sem servidores, sem nuvens.',
  },
  {
    titulo: 'Os seus motores',
    icone: Sparkles,
    descricao: 'O Ápice tem 6 motores lógicos que se adaptam ao seu ritmo. Em vez de te punir por falhar metas, redistribui o défice e sugere ajustes realistas.',
    destaque: 'Sem culpa. Sem alarmismo. Apenas progresso real.',
  },
  {
    titulo: 'Comece a estudar',
    icone: Timer,
    descricao: 'Use o timer Pomodoro ou a sessão rápida (atalho S) para registar o seu estudo. Cada minuto gera XP, mantém o seu streak e alimenta o motor de priorização.',
    destaque: 'Personalize metas e temas em Configurações.',
  },
];

export default function OnboardingPage() {
  const { perfilAtivo, atualizarPerfil } = usePerfilStore();
  const navigate = useNavigate();
  const [passo, setPasso] = useState(0);

  if (!perfilAtivo) {
    navigate('/');
    return null;
  }

  const finalizar = async () => {
    await atualizarPerfil({ ultimaSemanaProcessada: '' });
    navigate('/dashboard');
  };

  const passoAtual = PASSOS[passo];
  const Icone = passoAtual.icone;
  const ehUltimo = passo === PASSOS.length - 1;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md w-full"
      >
        <div className="card text-center p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={passo}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center mb-5 shadow-soft-lg">
                <Icone size={36} className="text-white" strokeWidth={2.5} />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-text-primary mb-3">
                {passoAtual.titulo}
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                {passoAtual.descricao}
              </p>
              <div className="p-3 rounded-xl bg-accent-soft text-xs text-accent">
                {passoAtual.destaque}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between pt-6 mt-6 border-t border-border-light">
            <div className="flex gap-1.5">
              {PASSOS.map((_, p) => (
                <div
                  key={p}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    p === passo ? 'w-6 bg-accent' : 'w-1.5 bg-border'
                  )}
                />
              ))}
            </div>
            {ehUltimo ? (
              <button onClick={finalizar} className="btn-primary">
                Começar a estudar
              </button>
            ) : (
              <button
                onClick={() => setPasso(p => p + 1)}
                className="btn-primary"
              >
                Próximo <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
