import { create } from 'zustand';
import { db } from '@core/db/database';
import type { Perfil, Tema } from '@shared/types';
import { gerarId, hojeISO } from '@shared/lib/utils';
import { MATERIAS_PADRAO, CORES_MATERIA_POR_TEMA, TEMAS_CLAROS, TEMAS_ESCUROS } from '@shared/types';

interface PerfilState {
  perfilAtivo: Perfil | null;
  perfis: Perfil[];
  carregando: boolean;

  carregarPerfis: () => Promise<void>;
  setPerfilAtivo: (perfil: Perfil) => void;
  criarPerfil: (nome: string, dataEvento: string, nomeEvento: string, metaSemanalTotal: number) => Promise<Perfil>;
  atualizarPerfil: (dados: Partial<Perfil>) => Promise<void>;
  atualizarTema: (tema: Tema) => void;
  alternarTemaSistema: () => void;
  removerPerfil: (id: string) => Promise<void>;
}

const LS_KEY_PERFIL = 'apice:perfilAtivo';
const LS_KEY_TEMA_SISTEMA = 'apice:temaSistema';

function resolverTemaEfetivo(perfil: Perfil | null): Tema {
  if (!perfil) return 'areia';
  if (perfil.temaSistema) {
    const prefereEscuro = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefereEscuro ? 'ardosia' : 'areia';
  }
  return perfil.temaAtivo;
}

function aplicarTema(tema: Tema) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', tema);
  }
}

export const usePerfilStore = create<PerfilState>((set, get) => ({
  perfilAtivo: null,
  perfis: [],
  carregando: true,

  carregarPerfis: async () => {
    const perfis = await db.perfis.toArray();
    const perfilAtivoId = localStorage.getItem(LS_KEY_PERFIL);
    let perfilAtivo = perfis.find(p => p.id === perfilAtivoId) ?? null;

    // Migração defensiva: se o perfil ainda tem dataProvaEnem (legado)
    if (perfilAtivo && !(perfilAtivo as any).dataEvento) {
      perfilAtivo = {
        ...perfilAtivo,
        dataEvento: (perfilAtivo as any).dataProvaEnem ?? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        nomeEvento: (perfilAtivo as any).nomeEvento ?? 'ENEM',
        temaSistema: false,
        schemaVersion: 2,
      } as Perfil;
      await db.perfis.put(perfilAtivo);
    }

    if (perfilAtivo) aplicarTema(resolverTemaEfetivo(perfilAtivo));
    set({ perfis, perfilAtivo, carregando: false });
  },

  setPerfilAtivo: (perfil) => {
    localStorage.setItem(LS_KEY_PERFIL, perfil.id);
    aplicarTema(resolverTemaEfetivo(perfil));
    set({ perfilAtivo: perfil });
  },

  criarPerfil: async (nome, dataEvento, nomeEvento, metaSemanalTotal) => {
    const id = gerarId();
    const perfil: Perfil = {
      id,
      nome: nome.trim() || 'Estudante',
      dataEvento,
      nomeEvento: nomeEvento.trim() || 'ENEM',
      temaAtivo: 'areia',
      temaSistema: false,
      diaInicioSemana: 1,
      diasGracaStreakDisponiveis: 1,
      ultimaSemanaProcessada: '',
      criadoEm: hojeISO(),
      ultimoExport: null,
      schemaVersion: 2,
    };

    await db.perfis.add(perfil);

    // Cria matérias padrão
    const cores = CORES_MATERIA_POR_TEMA[perfil.temaAtivo];
    const metasPorArea: Record<string, number> = {};
    for (const m of MATERIAS_PADRAO) {
      metasPorArea[m.area] = (metasPorArea[m.area] ?? 0) + 1;
    }

    for (let i = 0; i < MATERIAS_PADRAO.length; i++) {
      const mp = MATERIAS_PADRAO[i];
      const minutosArea = Math.round((metaSemanalTotal * (mp.pesoEnem / 10)) / (metasPorArea[mp.area] ?? 1));
      await db.materias.add({
        id: gerarId(),
        perfilId: id,
        nome: mp.nome,
        cor: cores[i % cores.length],
        icone: mp.icone,
        metaSemanalMinutos: Math.max(30, minutosArea),
        pesoPrioridade: mp.pesoPrioridade,
        padrao: true,
        arquivada: false,
        area: mp.area,
      });
    }

    await get().carregarPerfis();
    return perfil;
  },

  atualizarPerfil: async (dados) => {
    const { perfilAtivo } = get();
    if (!perfilAtivo) return;
    const atualizado = { ...perfilAtivo, ...dados };
    await db.perfis.put(atualizado);
    if (dados.temaAtivo || dados.temaSistema !== undefined) {
      aplicarTema(resolverTemaEfetivo(atualizado));
    }
    set({ perfilAtivo: atualizado });
  },

  atualizarTema: (tema) => {
    const { perfilAtivo } = get();
    if (perfilAtivo) {
      const atualizado = { ...perfilAtivo, temaAtivo: tema, temaSistema: false };
      aplicarTema(tema);
      set({ perfilAtivo: atualizado });
      db.perfis.put(atualizado);
    }
  },

  alternarTemaSistema: () => {
    const { perfilAtivo } = get();
    if (perfilAtivo) {
      const novoTemaSistema = !perfilAtivo.temaSistema;
      const atualizado = { ...perfilAtivo, temaSistema: novoTemaSistema };
      aplicarTema(resolverTemaEfetivo(atualizado));
      set({ perfilAtivo: atualizado });
      db.perfis.put(atualizado);
    }
  },

  removerPerfil: async (id) => {
    await db.perfis.delete(id);
    const materias = await db.materias.where('perfilId').equals(id).toArray();
    const materiaIds = materias.map(m => m.id);
    await db.materias.where('perfilId').equals(id).delete();
    await db.sessoes.where('perfilId').equals(id).delete();
    await db.historicoSemanal.where('perfilId').equals(id).delete();
    await db.anotacoes.where('perfilId').equals(id).delete();
    await db.redacoes.where('perfilId').equals(id).delete();
    await db.simulados.where('perfilId').equals(id).delete();
    await db.planejamento.where('perfilId').equals(id).delete();
    await db.conquistas.where('perfilId').equals(id).delete();
    if (materiaIds.length > 0) {
      await db.subtopicos.where('materiaId').anyOf(materiaIds).delete();
      await db.flashcards.where('materiaId').anyOf(materiaIds).delete();
    }
    localStorage.removeItem(LS_KEY_PERFIL);
    set({ perfilAtivo: null });
    await get().carregarPerfis();
  },
}));

// Listener de mudanças do tema do sistema operativo
if (typeof window !== 'undefined' && window.matchMedia) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener?.('change', () => {
    const { perfilAtivo } = usePerfilStore.getState();
    if (perfilAtivo?.temaSistema) {
      aplicarTema(resolverTemaEfetivo(perfilAtivo));
    }
  });
}
