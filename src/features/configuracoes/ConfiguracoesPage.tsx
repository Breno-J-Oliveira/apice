import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { usePerfilStore } from '@shared/stores/usePerfilStore';
import { useMateriasStore } from '@shared/stores/useMateriasStore';
import { useSessoesStore } from '@shared/stores/useSessoesStore';
import { db } from '@core/db/database';
import { backupSchema } from '@shared/lib/utils';
import type { Tema, BackupExportado, Flashcard } from '@shared/types';
import { NOMES_TEMAS } from '@shared/types';
import { cn, formatarData, hojeISO, formatarMinutos } from '@shared/lib/utils';
import { PageHeader } from '@shared/components/PageHeader';
import { ConfirmDialog, useConfirm } from '@shared/components/ConfirmDialog';
import { Download, Upload, Save, Trash2, Moon, Sun, Palette, AlertTriangle, FileDown, Monitor, Sparkles, Database, Info, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { db as database } from '@core/db/database';

export default function ConfiguracoesPage() {
  const { perfilAtivo, atualizarPerfil, atualizarTema, alternarTemaSistema, removerPerfil } = usePerfilStore();
  const { materias, subtopicos, importarDiagnostico } = useMateriasStore();
  const { sessoes, historicoSemanal, anotacoes, redacoes, simulados, planejamento, conquistas, flashcards } = useSessoesStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const { pedirConfirmacao, dialog } = useConfirm();

  if (!perfilAtivo) return null;

  const exportarBackup = async () => {
    try {
      const backup: BackupExportado = {
        versaoSchema: 2,
        exportadoEm: new Date().toISOString(),
        perfil: { ...perfilAtivo, ultimoExport: hojeISO() },
        materias,
        subtopicos,
        sessoes,
        anotacoes,
        redacoes,
        simulados,
        historicoSemanal,
        planejamento,
        conquistas,
        flashcards,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apice-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      await atualizarPerfil({ ultimoExport: hojeISO() });
      toast.success('Backup exportado com sucesso');
    } catch {
      toast.error('Erro ao exportar backup');
    }
  };

  const importarBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const texto = await file.text();
      const dados = JSON.parse(texto);
      const resultado = backupSchema.safeParse(dados);

      if (!resultado.success) {
        toast.error('Arquivo inválido ou incompatível');
        return;
      }

      pedirConfirmacao({
        titulo: 'Importar backup?',
        descricao: 'Os dados atuais serão substituídos. Recomendamos exportar o estado atual antes de continuar.',
        onConfirmar: async () => {
          try {
            const backup = resultado.data as BackupExportado;
            await db.perfis.clear();
            await db.materias.clear();
            await db.subtopicos.clear();
            await db.sessoes.clear();
            await db.historicoSemanal.clear();
            await db.anotacoes.clear();
            await db.redacoes.clear();
            await db.simulados.clear();
            await db.planejamento.clear();
            await db.conquistas.clear();
            await db.flashcards.clear();

            await db.perfis.put(backup.perfil);
            await db.materias.bulkPut(backup.materias);
            await db.subtopicos.bulkPut(backup.subtopicos);
            await db.sessoes.bulkPut(backup.sessoes);
            await db.historicoSemanal.bulkPut(backup.historicoSemanal);
            await db.anotacoes.bulkPut(backup.anotacoes);
            await db.redacoes.bulkPut(backup.redacoes);
            await db.simulados.bulkPut(backup.simulados);
            await db.planejamento.bulkPut(backup.planejamento);
            await db.conquistas.bulkPut(backup.conquistas);
            if (backup.flashcards) await db.flashcards.bulkPut(backup.flashcards);

            toast.success('Backup importado! A recarregar...');
            setTimeout(() => window.location.reload(), 1200);
          } catch {
            toast.error('Erro ao importar backup');
          }
        },
      });
    } catch {
      toast.error('Arquivo corrompido');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleImportarDiagnostico = async () => {
    try {
      const result = await importarDiagnostico();
      if (result.adicionados > 0) {
        toast.success(`${result.adicionados} subtópicos importados do diagnóstico`);
      } else {
        toast.info('Todos os subtópicos do diagnóstico já estão importados');
      }
    } catch {
      toast.error('Erro ao importar diagnóstico');
    }
  };

  const handleApagarTudo = () => {
    pedirConfirmacao({
      titulo: 'Apagar TODOS os dados?',
      descricao: 'Esta ação é irreversível. Todos os perfis, sessões, anotações, redações, simulados e configurações serão eliminados.',
      textoConfirmar: 'Sim, apagar tudo',
      onConfirmar: async () => {
        try {
          await database.delete();
          toast.success('Todos os dados foram apagados. A recarregar...');
          setTimeout(() => window.location.reload(), 1000);
        } catch {
          toast.error('Erro ao apagar dados');
        }
      },
    });
  };

  const handleRemoverPerfil = () => {
    pedirConfirmacao({
      titulo: 'Excluir este perfil?',
      descricao: `O perfil "${perfilAtivo.nome}" e todos os seus dados serão eliminados.`,
      textoConfirmar: 'Excluir',
      onConfirmar: async () => {
        await removerPerfil(perfilAtivo.id);
        toast.success('Perfil removido');
      },
    });
  };

  return (
    <div className="page-container max-w-2xl">
      <PageHeader titulo="Configurações" subtitulo="Personalize o seu Ápice" />

      {/* Resumo de dados */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Database size={18} className="text-accent" />
          <h3 className="font-serif text-lg font-semibold">Os seus dados</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-text-primary">{sessoes.length}</p>
            <p className="text-xs text-text-muted">Sessões</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{anotacoes.length}</p>
            <p className="text-xs text-text-muted">Anotações</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{simulados.length + redacoes.length}</p>
            <p className="text-xs text-text-muted">Simulados + Redações</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{formatarMinutos(sessoes.reduce((s, sess) => s + sess.duracaoMinutos, 0))}</p>
            <p className="text-xs text-text-muted">Total estudado</p>
          </div>
        </div>
      </motion.div>

      {/* Tema */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Palette size={18} className="text-accent" />
          <h3 className="font-serif text-lg font-semibold">Tema</h3>
        </div>

        {/* Toggle: tema do sistema */}
        <button
          onClick={alternarTemaSistema}
          className={cn(
            'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left mb-3',
            perfilAtivo.temaSistema ? 'border-accent bg-accent-soft' : 'border-border hover:bg-bg-hover'
          )}
        >
          <Monitor size={18} className="text-text-muted" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary">Seguir o sistema</p>
            <p className="text-xs text-text-muted">Muda automaticamente entre claro e escuro</p>
          </div>
          <div className={cn(
            'w-9 h-5 rounded-full p-0.5 transition-colors flex-shrink-0',
            perfilAtivo.temaSistema ? 'bg-accent' : 'bg-border'
          )}>
            <div className={cn(
              'w-4 h-4 rounded-full bg-white transition-transform',
              perfilAtivo.temaSistema && 'translate-x-4'
            )} />
          </div>
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Object.keys(NOMES_TEMAS) as Tema[]).map(tema => {
            const info = NOMES_TEMAS[tema];
            const isEscuro = tema === 'musgo' || tema === 'ardosia';
            const ativo = !perfilAtivo.temaSistema && perfilAtivo.temaAtivo === tema;
            return (
              <button
                key={tema}
                onClick={() => atualizarTema(tema)}
                disabled={perfilAtivo.temaSistema}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed',
                  ativo ? 'border-accent bg-accent-soft' : 'border-border hover:bg-bg-hover'
                )}
              >
                <span className="text-lg flex-shrink-0">{info.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">{info.nome}</p>
                  <p className="text-xs text-text-muted truncate">{info.descricao}</p>
                </div>
                {isEscuro ? <Moon size={12} className="text-text-muted flex-shrink-0" /> : <Sun size={12} className="text-text-muted flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Perfil */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card mb-4">
        <h3 className="font-serif text-lg font-semibold mb-4">Perfil</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Nome</label>
            <input
              type="text"
              defaultValue={perfilAtivo.nome}
              onBlur={e => e.target.value.trim() && e.target.value !== perfilAtivo.nome && atualizarPerfil({ nome: e.target.value.trim() })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Nome do evento</label>
            <input
              type="text"
              defaultValue={perfilAtivo.nomeEvento}
              onBlur={e => e.target.value.trim() && atualizarPerfil({ nomeEvento: e.target.value.trim() })}
              className="input"
              placeholder="ENEM, Concurso, OAB..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Data do evento</label>
            <input
              type="date"
              defaultValue={perfilAtivo.dataEvento.split('T')[0]}
              onChange={e => atualizarPerfil({ dataEvento: new Date(e.target.value).toISOString() })}
              className="input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Início da semana</label>
              <select
                value={perfilAtivo.diaInicioSemana}
                onChange={e => atualizarPerfil({ diaInicioSemana: Number(e.target.value) as 0 | 1 })}
                className="input"
              >
                <option value={1}>Segunda-feira</option>
                <option value={0}>Domingo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Dias de graça</label>
              <select
                value={perfilAtivo.diasGracaStreakDisponiveis}
                onChange={e => atualizarPerfil({ diasGracaStreakDisponiveis: Number(e.target.value) })}
                className="input"
              >
                <option value={0}>Nenhum</option>
                <option value={1}>1 por semana</option>
                <option value={2}>2 por semana</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Backup */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Save size={18} className="text-accent" />
          <h3 className="font-serif text-lg font-semibold">Backup</h3>
        </div>
        <p className="text-sm text-text-secondary mb-3">
          Os seus dados ficam 100% no seu dispositivo. Exporte regularmente para não perder o progresso.
        </p>
        {perfilAtivo.ultimoExport && (
          <p className="text-xs text-text-muted mb-3 flex items-center gap-1.5">
            <Info size={12} /> Último export: {formatarData(perfilAtivo.ultimoExport)}
          </p>
        )}
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportarBackup} className="btn-primary">
            <Download size={16} /> Exportar
          </button>
          <label className="btn-outline cursor-pointer">
            <Upload size={16} /> Importar
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              onChange={importarBackup}
              className="hidden"
            />
          </label>
        </div>
      </motion.div>

      {/* Diagnóstico */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <FileDown size={18} className="text-accent" />
          <h3 className="font-serif text-lg font-semibold">Diagnóstico de subtópicos</h3>
        </div>
        <p className="text-sm text-text-secondary mb-3">
          Importa 181 subtópicos pré-mapeados com níveis de dificuldade (🔴🟡🟢⚪).
          Atualmente existem <strong>{subtopicos.length}</strong> subtópicos.
        </p>
        <button onClick={handleImportarDiagnostico} className="btn-outline">
          <Sparkles size={16} /> Importar diagnóstico
        </button>
      </motion.div>

      {/* Atalhos */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card mb-4">
        <h3 className="font-serif text-lg font-semibold mb-3">Atalhos de teclado</h3>
        <div className="space-y-2 text-sm">
          <Atalho teclas={['S']} descricao="Sessão rápida" />
          <Atalho teclas={['G', 'D']} descricao="Ir para o Painel" />
          <Atalho teclas={['G', 'E']} descricao="Ir para Estudar" />
          <Atalho teclas={['G', 'M']} descricao="Ir para Matérias" />
          <Atalho teclas={['G', 'N']} descricao="Ir para Anotações" />
          <Atalho teclas={['G', 'R']} descricao="Ir para Relatórios" />
          <Atalho teclas={['G', 'S']} descricao="Ir para Semana" />
          <Atalho teclas={['G', 'C']} descricao="Ir para Configurações" />
          <Atalho teclas={['Espaço']} descricao="Iniciar/pausar timer" />
          <Atalho teclas={['Esc']} descricao="Parar timer" />
        </div>
      </motion.div>

      {/* Zona de perigo */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card border-danger/30">
        <div className="flex items-center gap-2 mb-3 text-danger">
          <AlertTriangle size={18} />
          <h3 className="font-serif text-lg font-semibold">Zona de perigo</h3>
        </div>
        <p className="text-sm text-text-secondary mb-4">
          Ações irreversíveis. Recomendamos exportar um backup antes.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={handleRemoverPerfil} className="btn-outline border-danger/30 text-danger hover:bg-danger/10">
            <Trash2 size={16} /> Excluir este perfil
          </button>
          <button onClick={handleApagarTudo} className="btn-outline border-danger/30 text-danger hover:bg-danger/10">
            <Trash size={16} /> Apagar TUDO
          </button>
        </div>
      </motion.div>

      <p className="text-xs text-text-muted text-center mt-6">
        Ápice v2.0 · {materias.length} matérias · {sessoes.length} sessões
      </p>

      {dialog}
    </div>
  );
}

function Atalho({ teclas, descricao }: { teclas: string[]; descricao: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-secondary">{descricao}</span>
      <div className="flex items-center gap-1">
        {teclas.map((t, i) => (
          <span key={i} className="flex items-center gap-1">
            <kbd className="px-2 py-0.5 text-[11px] font-mono rounded-md bg-bg-hover text-text-primary border border-border-light">
              {t}
            </kbd>
            {i < teclas.length - 1 && <span className="text-text-muted text-xs">depois</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
