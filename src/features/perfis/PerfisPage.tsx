import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerfilStore } from '@shared/stores/usePerfilStore';
import { UserPlus, ArrowRight, Trash2, Mountain, Calendar } from 'lucide-react';
import { formatarData, cn } from '@shared/lib/utils';
import { differenceInDays } from 'date-fns';
import { ConfirmDialog, useConfirm } from '@shared/components/ConfirmDialog';
import { toast } from 'sonner';

const EVENTOS_SUGERIDOS = [
  { nome: 'ENEM', icone: '📚' },
  { nome: 'Concurso Público', icone: '⚖️' },
  { nome: 'OAB', icone: '🎓' },
  { nome: 'Vestibular', icone: '🏛️' },
  { nome: 'ENARE', icone: '🏥' },
  { nome: 'Outro', icone: '✨' },
];

export default function PerfisPage() {
  const { perfis, setPerfilAtivo, criarPerfil, removerPerfil } = usePerfilStore();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(perfis.length === 0);
  const [nome, setNome] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [nomeEvento, setNomeEvento] = useState('ENEM');
  const [metaTotal, setMetaTotal] = useState(600);
  const { pedirConfirmacao, dialog } = useConfirm();

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !dataEvento) {
      toast.error('Preencha o nome e a data');
      return;
    }
    const perfil = await criarPerfil(nome.trim(), dataEvento, nomeEvento, metaTotal);
    setPerfilAtivo(perfil);
    toast.success(`Bem-vindo, ${perfil.nome}!`);
    navigate('/onboarding');
  };

  const handleEntrar = (perfil: typeof perfis[0]) => {
    setPerfilAtivo(perfil);
    navigate('/dashboard');
  };

  const handleRemover = (id: string, nome: string) => {
    pedirConfirmacao({
      titulo: 'Remover perfil?',
      descricao: `O perfil "${nome}" e todos os seus dados serão eliminados permanentemente.`,
      onConfirmar: async () => {
        await removerPerfil(id);
        toast.success('Perfil removido');
      },
    });
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo + branding */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shadow-soft-lg mb-4"
          >
            <Mountain size={36} className="text-white" strokeWidth={2.5} />
          </motion.div>
          <h1 className="font-serif text-4xl font-semibold text-text-primary mb-2">Ápice</h1>
          <p className="text-text-muted">O seu sistema operacional de estudos</p>
        </div>

        {/* Perfis existentes */}
        {perfis.length > 0 && !showForm && (
          <div className="space-y-2 mb-4">
            <p className="text-xs uppercase tracking-wider text-text-muted px-1 mb-2">
              {perfis.length === 1 ? 'O seu perfil' : 'Os seus perfis'}
            </p>
            {perfis.map(perfil => {
              const dias = differenceInDays(new Date(perfil.dataEvento), new Date());
              return (
                <motion.button
                  key={perfil.id}
                  layout
                  onClick={() => handleEntrar(perfil)}
                  className="w-full card-hover flex items-center justify-between p-4 text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center font-serif font-semibold flex-shrink-0">
                      {perfil.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-text-primary truncate">{perfil.nome}</p>
                      <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                        <Calendar size={11} />
                        <span>{perfil.nomeEvento} · {dias > 0 ? `${dias} dias` : 'hoje'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemover(perfil.id, perfil.nome); }}
                      className="p-2 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
                      aria-label="Remover perfil"
                    >
                      <Trash2 size={16} />
                    </button>
                    <ArrowRight size={18} className="text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!showForm ? (
            <motion.button
              key="criar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(true)}
              className="w-full card-hover flex items-center justify-center gap-2 p-4 text-text-secondary hover:text-accent transition-colors"
            >
              <UserPlus size={18} />
              Criar novo perfil
            </motion.button>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCriar}
              className="card space-y-4"
            >
              <h3 className="font-serif text-lg font-semibold text-text-primary">Novo perfil</h3>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Como se chama?</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="input"
                  placeholder="O seu nome"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Para o que se está a preparar?</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {EVENTOS_SUGERIDOS.map(e => (
                    <button
                      key={e.nome}
                      type="button"
                      onClick={() => setNomeEvento(e.nome)}
                      className={cn(
                        'px-2 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1',
                        nomeEvento === e.nome
                          ? 'bg-accent-soft text-accent border border-accent/30'
                          : 'bg-bg border border-border text-text-secondary hover:bg-bg-hover'
                      )}
                    >
                      <span>{e.icone}</span>
                      <span className="truncate">{e.nome}</span>
                    </button>
                  ))}
                </div>
                {nomeEvento === 'Outro' && (
                  <input
                    type="text"
                    onChange={e => setNomeEvento(e.target.value)}
                    className="input mt-2"
                    placeholder="Nome do evento (ex: Mestrado em...)"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Data do evento</label>
                <input
                  type="date"
                  value={dataEvento}
                  onChange={e => setDataEvento(e.target.value)}
                  className="input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Meta semanal: <span className="text-text-primary font-bold">{Math.round(metaTotal / 60)}h</span> ({metaTotal}min)
                </label>
                <input
                  type="range"
                  min="120"
                  max="2400"
                  step="30"
                  value={metaTotal}
                  onChange={e => setMetaTotal(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>2h</span>
                  <span>40h</span>
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Distribuiremos este tempo entre as 12 matérias com base no peso real de cada uma.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                {perfis.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-outline flex-1"
                  >
                    Cancelar
                  </button>
                )}
                <button type="submit" className="btn-primary flex-1">
                  Criar perfil
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-xs text-text-muted text-center mt-8">
          Os seus dados ficam guardados <strong>apenas no seu dispositivo</strong>. Nada de servidores, nada de nuvens.
        </p>

        {dialog}
      </motion.div>
    </div>
  );
}
