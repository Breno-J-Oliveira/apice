import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerfilStore } from '@shared/stores/usePerfilStore';
import { useMateriasStore } from '@shared/stores/useMateriasStore';
import { useSessoesStore } from '@shared/stores/useSessoesStore';
import { cn, formatarData } from '@shared/lib/utils';
import { PageHeader } from '@shared/components/PageHeader';
import { EmptyState } from '@shared/components/EmptyState';
import { ConfirmDialog, useConfirm } from '@shared/components/ConfirmDialog';
import { PenTool, Plus, Trash2, Save, X, Search, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Rascunho {
  titulo: string;
  conteudo: string;
  materiaId: string;
}

const RASCUNHO_VAZIO: Rascunho = { titulo: '', conteudo: '', materiaId: '' };

export default function AnotacoesPage() {
  const { perfilAtivo } = usePerfilStore();
  const { materias } = useMateriasStore();
  const { anotacoes, adicionarAnotacao, atualizarAnotacao, removerAnotacao } = useSessoesStore();
  const [materiaFiltro, setMateriaFiltro] = useState<string>('todas');
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  const [editRascunho, setEditRascunho] = useState<Rascunho>(RASCUNHO_VAZIO);
  const [novaAberta, setNovaAberta] = useState(false);
  const [novaRascunho, setNovaRascunho] = useState<Rascunho>(RASCUNHO_VAZIO);
  const { pedirConfirmacao, dialog } = useConfirm();

  const materiasAtivas = useMemo(() => materias.filter(m => !m.arquivada), [materias]);

  const anotacoesFiltradas = useMemo(() => {
    let resultado = materiaFiltro === 'todas'
      ? anotacoes
      : anotacoes.filter(a => a.materiaId === materiaFiltro);

    if (busca.trim()) {
      const q = busca.toLowerCase();
      resultado = resultado.filter(a =>
        a.titulo.toLowerCase().includes(q) ||
        a.conteudo.toLowerCase().includes(q)
      );
    }
    // Copia para não mutar o array original
    return [...resultado].sort((a, b) =>
      new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime()
    );
  }, [anotacoes, materiaFiltro, busca]);

  const handleCriar = async () => {
    if (!novaRascunho.titulo.trim() || !novaRascunho.materiaId || !perfilAtivo) {
      toast.error('Preencha o título e selecione a matéria');
      return;
    }
    try {
      await adicionarAnotacao({
        perfilId: perfilAtivo.id,
        materiaId: novaRascunho.materiaId,
        titulo: novaRascunho.titulo.trim(),
        conteudo: novaRascunho.conteudo.trim(),
      });
      toast.success('Anotação criada');
      setNovaRascunho(RASCUNHO_VAZIO);
      setNovaAberta(false);
    } catch {
      toast.error('Erro ao criar anotação');
    }
  };

  const handleSalvarEdicao = async (id: string) => {
    if (!editRascunho.titulo.trim()) {
      toast.error('O título não pode estar vazio');
      return;
    }
    try {
      await atualizarAnotacao(id, {
        titulo: editRascunho.titulo.trim(),
        conteudo: editRascunho.conteudo,
      });
      toast.success('Anotação atualizada');
      setEditando(null);
      setEditRascunho(RASCUNHO_VAZIO);
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  const handleRemover = (id: string, titulo: string) => {
    pedirConfirmacao({
      titulo: 'Apagar anotação?',
      descricao: `"${titulo}" será removida permanentemente.`,
      onConfirmar: async () => {
        try {
          await removerAnotacao(id);
          toast.success('Anotação removida');
        } catch {
          toast.error('Erro ao remover');
        }
      },
    });
  };

  const iniciarEdicao = (anotacao: typeof anotacoes[0]) => {
    setEditando(anotacao.id);
    setEditRascunho({
      titulo: anotacao.titulo,
      conteudo: anotacao.conteudo,
      materiaId: anotacao.materiaId,
    });
  };

  const cancelarEdicao = () => {
    setEditando(null);
    setEditRascunho(RASCUNHO_VAZIO);
  };

  return (
    <div className="page-container max-w-3xl">
      <PageHeader
        titulo="Anotações"
        subtitulo={`${anotacoes.length} ${anotacoes.length === 1 ? 'anotação' : 'anotações'} no total`}
        acao={
          <button
            onClick={() => setNovaAberta(!novaAberta)}
            className="btn-primary"
          >
            <Plus size={16} /> Nova
          </button>
        }
      />

      {/* Busca */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Procurar nas anotações..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border-light bg-bg-card text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
        />
      </div>

      {/* Filtro por matéria */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setMateriaFiltro('todas')}
          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            materiaFiltro === 'todas' ? 'bg-accent text-white' : 'bg-bg-card border border-border text-text-secondary hover:bg-bg-hover'
          )}
        >
          Todas ({anotacoes.length})
        </button>
        {materiasAtivas.map(m => {
          const count = anotacoes.filter(a => a.materiaId === m.id).length;
          return (
            <button
              key={m.id}
              onClick={() => setMateriaFiltro(m.id)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
                materiaFiltro === m.id ? 'bg-accent text-white' : 'bg-bg-card border border-border text-text-secondary hover:bg-bg-hover'
              )}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.cor }} />
              {m.nome} ({count})
            </button>
          );
        })}
      </div>

      {/* Formulário de nova anotação */}
      <AnimatePresence>
        {novaAberta && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="card mb-4 overflow-hidden space-y-3"
          >
            <select
              value={novaRascunho.materiaId}
              onChange={e => setNovaRascunho({ ...novaRascunho, materiaId: e.target.value })}
              className="input"
              aria-label="Matéria"
            >
              <option value="">Selecione a matéria</option>
              {materiasAtivas.map(m => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
            <input
              value={novaRascunho.titulo}
              onChange={e => setNovaRascunho({ ...novaRascunho, titulo: e.target.value })}
              placeholder="Título da anotação"
              className="input font-medium"
              autoFocus
            />
            <textarea
              value={novaRascunho.conteudo}
              onChange={e => setNovaRascunho({ ...novaRascunho, conteudo: e.target.value })}
              placeholder="Escreve o conteúdo aqui..."
              rows={6}
              className="input resize-none leading-relaxed"
            />
            <div className="flex gap-2">
              <button onClick={() => { setNovaAberta(false); setNovaRascunho(RASCUNHO_VAZIO); }} className="btn-outline flex-1">
                Cancelar
              </button>
              <button onClick={handleCriar} className="btn-primary flex-1">
                <Save size={16} /> Salvar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de anotações */}
      {anotacoesFiltradas.length === 0 ? (
        <EmptyState
          icone={<FileText size={26} strokeWidth={1.5} />}
          titulo={anotacoes.length === 0 ? 'Ainda não tem anotações' : 'Nenhuma anotação encontrada'}
          descricao={anotacoes.length === 0 ? 'Crie a sua primeira anotação para começar a organizar o estudo.' : 'Tente outra pesquisa ou filtro.'}
          acao={anotacoes.length === 0 && <button onClick={() => setNovaAberta(true)} className="btn-primary">Criar primeira</button>}
        />
      ) : (
        <div className="space-y-3">
          {anotacoesFiltradas.map(anotacao => {
            const materia = materias.find(m => m.id === anotacao.materiaId);
            const isEditing = editando === anotacao.id;
            return (
              <motion.div key={anotacao.id} layout className="card">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {materia && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: materia.cor }} />}
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <input
                          value={editRascunho.titulo}
                          onChange={e => setEditRascunho({ ...editRascunho, titulo: e.target.value })}
                          className="w-full font-medium text-text-primary text-sm bg-transparent border-b border-border outline-none focus:border-accent"
                          autoFocus
                          aria-label="Título"
                        />
                      ) : (
                        <p className="font-medium text-text-primary text-sm truncate">{anotacao.titulo}</p>
                      )}
                      <p className="text-xs text-text-muted">{materia?.nome ?? 'Sem matéria'} · {formatarData(anotacao.atualizadoEm)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSalvarEdicao(anotacao.id)}
                          className="p-1.5 rounded-lg hover:bg-bg-hover text-success"
                          aria-label="Salvar"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={cancelarEdicao}
                          className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted"
                          aria-label="Cancelar"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => iniciarEdicao(anotacao)}
                          className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted"
                          aria-label="Editar"
                        >
                          <PenTool size={14} />
                        </button>
                        <button
                          onClick={() => handleRemover(anotacao.id, anotacao.titulo)}
                          className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-danger"
                          aria-label="Apagar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {isEditing ? (
                  <textarea
                    value={editRascunho.conteudo}
                    onChange={e => setEditRascunho({ ...editRascunho, conteudo: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm resize-none leading-relaxed focus:border-accent outline-none"
                    aria-label="Conteúdo"
                  />
                ) : (
                  <p className="text-sm text-text-secondary whitespace-pre-wrap line-clamp-6">{anotacao.conteudo}</p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {dialog}
    </div>
  );
}
