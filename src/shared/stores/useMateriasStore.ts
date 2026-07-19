import { create } from 'zustand';
import { db } from '@core/db/database';
import type { Materia, Subtopico } from '@shared/types';
import { gerarId } from '@shared/lib/utils';
import { DIAGNOSTICO_SUBTOPICOS } from '@core/db/seedDiagnostico';
import { MATERIAS_PLANO_BRENO } from '@core/db/seedPlanoBreno';

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
  /**
   * Aplica o plano Breno:
   *  - Substitui/arquiva as 12 matérias padrão
   *  - Cria as 9 matérias com pesos e metas corretos (distribuição 18h)
   *  - Importa os subtopicos do diagnóstico
   */
  aplicarPlanoBreno: (perfilId: string) => Promise<{ materias: number; subtopicos: number }>;
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

  /**
   * Aplica o plano Breno:
   * 1. Arquiva as matérias padrão que não fazem parte do plano
   * 2. Cria/atualiza as 9 matérias com pesos e metas corretos
   * 3. Importa os subtopicos do diagnóstico para essas matérias
   */
  aplicarPlanoBreno: async (perfilId) => {
    const { materias, subtopicos } = get();
    const nomesPlano = new Set(MATERIAS_PLANO_BRENO.map(m => m.nome.toLowerCase()));

    // 1. Arquivar matérias padrão que não estão no plano
    const paraArquivar = materias.filter(m => !nomesPlano.has(m.nome.toLowerCase()));
    if (paraArquivar.length > 0) {
      await db.materias.bulkUpdate(paraArquivar.map(m => ({ key: m.id, changes: { arquivada: true } })));
    }

    // 2. Criar/atualizar as 9 matérias do plano
    const mapaCores = MATERIAS_PLANO_BRENO.map((mp, i) => ({ ...mp, cor: mp.cor || `hsl(${i * 40}, 50%, 60%)` }));
    const novasMaterias: Materia[] = [];
    const mapaMateriaId = new Map<string, string>(); // nome -> id

    for (const mp of mapaCores) {
      const existente = materias.find(m => m.nome.toLowerCase() === mp.nome.toLowerCase());
      if (existente) {
        // Atualizar
        const atualizada: Materia = {
          ...existente,
          metaSemanalMinutos: mp.horasSemanais,
          pesoPrioridade: mp.pesoPrioridade,
          area: mp.area,
          cor: mp.cor,
          icone: mp.icone,
          arquivada: false,
        };
        await db.materias.put(atualizada);
        mapaMateriaId.set(mp.nome.toLowerCase(), existente.id);
      } else {
        // Criar
        const nova: Materia = {
          id: gerarId(),
          perfilId,
          nome: mp.nome,
          cor: mp.cor,
          icone: mp.icone,
          metaSemanalMinutos: mp.horasSemanais,
          pesoPrioridade: mp.pesoPrioridade,
          area: mp.area,
          padrao: true,
          arquivada: false,
        };
        await db.materias.add(nova);
        novasMaterias.push(nova);
        mapaMateriaId.set(mp.nome.toLowerCase(), nova.id);
      }
    }

    // 3. Importar subtopicos do diagnóstico
    const nomesPlanoSet = new Set(MATERIAS_PLANO_BRENO.map(m => m.nome));
    const subtopicosPlano = DIAGNOSTICO_SUBTOPICOS.filter(d => nomesPlanoSet.has(d.materiaNome));
    const subExistentes = new Set(subtopicos.map(s => s.nome.toLowerCase()));
    const novosSub: Subtopico[] = [];

    for (const diag of subtopicosPlano) {
      if (subExistentes.has(diag.nome.toLowerCase())) continue;
      const materiaId = mapaMateriaId.get(diag.materiaNome.toLowerCase());
      if (!materiaId) continue;

      novosSub.push({
        id: gerarId(),
        materiaId,
        nome: diag.nome,
        status: diag.status,
        criadoEm: new Date().toISOString(),
      });
    }

    if (novosSub.length > 0) {
      await db.subtopicos.bulkAdd(novosSub);
    }

    // Atualizar store
    const todasMaterias = await db.materias.where('perfilId').equals(perfilId).toArray();
    const todosSubtopicos = await db.subtopicos
      .filter(s => todasMaterias.some(m => m.id === s.materiaId))
      .toArray();

    set({ materias: todasMaterias, subtopicos: todosSubtopicos });

    return {
      materias: novasMaterias.length + (materias.length - novasMaterias.length),
      subtopicos: novosSub.length,
    };
  },
}));
