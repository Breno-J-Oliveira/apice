import { create } from 'zustand';
import { db } from '@core/db/database';
import type { Materia, Subtopico } from '@shared/types';
import { gerarId } from '@shared/lib/utils';
import { DIAGNOSTICO_SUBTOPICOS } from '@core/db/seedDiagnostico';

interface MateriasState {
  materias: Materia[];
  subtopicos: Subtopico[];
  carregando: boolean;

  carregar: (perfilId: string) => Promise<void>;
  adicionarMateria: (dados: Omit<Materia, 'id' | 'padrao'>) => Promise<Materia>;
  atualizarMateria: (id: string, dados: Partial<Materia>) => Promise<void>;
  arquivarMateria: (id: string) => Promise<void>;
  adicionarSubtopico: (dados: Omit<Subtopico, 'id'>) => Promise<Subtopico>;
  atualizarSubtopico: (id: string, dados: Partial<Subtopico>) => Promise<void>;
  removerSubtopico: (id: string) => Promise<void>;
  importarDiagnostico: () => Promise<{ adicionados: number }>;
}

export const useMateriasStore = create<MateriasState>((set, get) => ({
  materias: [],
  subtopicos: [],
  carregando: true,

  carregar: async (perfilId) => {
    const materias = await db.materias.where('perfilId').equals(perfilId).toArray();
    const subtopicos = await db.subtopicos
      .filter(s => materias.some(m => m.id === s.materiaId))
      .toArray();
    set({ materias, subtopicos, carregando: false });
  },

  adicionarMateria: async (dados) => {
    const materia: Materia = { ...dados, id: gerarId(), padrao: false };
    await db.materias.add(materia);
    set(s => ({ materias: [...s.materias, materia] }));
    return materia;
  },

  atualizarMateria: async (id, dados) => {
    await db.materias.update(id, dados);
    set(s => ({
      materias: s.materias.map(m => m.id === id ? { ...m, ...dados } : m),
    }));
  },

  arquivarMateria: async (id) => {
    const materia = get().materias.find(m => m.id === id);
    if (!materia) return;
    await db.materias.update(id, { arquivada: !materia.arquivada });
    set(s => ({
      materias: s.materias.map(m =>
        m.id === id ? { ...m, arquivada: !m.arquivada } : m
      ),
    }));
  },

  adicionarSubtopico: async (dados) => {
    const subtopico: Subtopico = { ...dados, id: gerarId(), criadoEm: new Date().toISOString() };
    await db.subtopicos.add(subtopico);
    set(s => ({ subtopicos: [...s.subtopicos, subtopico] }));
    return subtopico;
  },

  atualizarSubtopico: async (id, dados) => {
    await db.subtopicos.update(id, dados);
    set(s => ({
      subtopicos: s.subtopicos.map(st => st.id === id ? { ...st, ...dados } : st),
    }));
  },

  removerSubtopico: async (id) => {
    await db.subtopicos.delete(id);
    set(s => ({ subtopicos: s.subtopicos.filter(st => st.id !== id) }));
  },

  importarDiagnostico: async () => {
    const { materias, subtopicos } = get();
    const existentes = new Set(subtopicos.map(s => s.nome.toLowerCase()));
    const novos: Subtopico[] = [];
    
    for (const diag of DIAGNOSTICO_SUBTOPICOS) {
      if (existentes.has(diag.nome.toLowerCase())) continue;
      
      const materia = materias.find(m => 
        m.nome.toLowerCase() === diag.materiaNome.toLowerCase()
      );
      if (!materia) continue;

      const subtopico: Subtopico = {
        id: gerarId(),
        materiaId: materia.id,
        nome: diag.nome,
        status: diag.status,
        criadoEm: new Date().toISOString(),
      };
      novos.push(subtopico);
      existentes.add(diag.nome.toLowerCase());
    }

    if (novos.length > 0) {
      await db.subtopicos.bulkAdd(novos);
      set(s => ({ subtopicos: [...s.subtopicos, ...novos] }));
    }

    return { adicionados: novos.length };
  },
}));
