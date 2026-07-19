import { create } from 'zustand';
import { db } from '@core/db/database';
import type { SessaoEstudo, HistoricoSemanal, Anotacao, Redacao, Simulado, BlocoPlanejamento, Conquista, Flashcard } from '@shared/types';
import { gerarId } from '@shared/lib/utils';
import { getAnoSemanaIso, determinarTipoSessao, somarMinutosPorMateriaNaSemana } from '@core/engines/metaEngine';

interface SessoesState {
  sessoes: SessaoEstudo[];
  historicoSemanal: HistoricoSemanal[];
  anotacoes: Anotacao[];
  redacoes: Redacao[];
  simulados: Simulado[];
  planejamento: BlocoPlanejamento[];
  conquistas: Conquista[];
  flashcards: Flashcard[];
  carregando: boolean;

  carregarTudo: (perfilId: string) => Promise<void>;
  /**
   * Regista uma sessão. A função calcula internamente o tipo (planejada/extra)
   * com base no acumulado atual e na meta da matéria — o chamador não precisa passar.
   */
  registrarSessao: (dados: {
    perfilId: string;
    materiaId: string;
    subtopicoId?: string;
    duracaoMinutos: number;
    duracaoRealMinutos?: number;
    origem: 'manual' | 'pomodoro' | 'sessao-rapida';
    nota?: string;
    /** Metadados opcionais para cálculo de tipo (calculados internamente se faltarem). */
    metaSemanalMinutos?: number;
    diaInicioSemana?: 0 | 1;
  }) => Promise<SessaoEstudo>;

  // Anotações
  adicionarAnotacao: (dados: Omit<Anotacao, 'id' | 'atualizadoEm' | 'criadoEm' | 'tags'> & { tags?: string[] }) => Promise<Anotacao>;
  atualizarAnotacao: (id: string, dados: Partial<Anotacao>) => Promise<void>;
  removerAnotacao: (id: string) => Promise<void>;

  // Flashcards
  adicionarFlashcard: (dados: Omit<Flashcard, 'id' | 'criadoEm' | 'facilidade' | 'intervalo' | 'repeticoes' | 'proximaRevisao'>) => Promise<Flashcard>;
  removerFlashcard: (id: string) => Promise<void>;
  revisarFlashcard: (id: string, qualidade: 0 | 1 | 2 | 3 | 4 | 5) => Promise<void>;

  // Outros
  adicionarRedacao: (dados: Omit<Redacao, 'id'>) => Promise<Redacao>;
  removerRedacao: (id: string) => Promise<void>;
  adicionarSimulado: (dados: Omit<Simulado, 'id'>) => Promise<Simulado>;
  removerSimulado: (id: string) => Promise<void>;
  salvarPlanejamento: (blocos: BlocoPlanejamento[]) => Promise<void>;
  adicionarConquistas: (conquistas: Conquista[]) => Promise<void>;
}

export const useSessoesStore = create<SessoesState>((set, get) => ({
  sessoes: [],
  historicoSemanal: [],
  anotacoes: [],
  redacoes: [],
  simulados: [],
  planejamento: [],
  conquistas: [],
  flashcards: [],
  carregando: true,

  carregarTudo: async (perfilId) => {
    const [s, h, a, r, sim, p, c, f] = await Promise.all([
      db.sessoes.where('perfilId').equals(perfilId).toArray(),
      db.historicoSemanal.where('perfilId').equals(perfilId).toArray(),
      db.anotacoes.where('perfilId').equals(perfilId).toArray(),
      db.redacoes.where('perfilId').equals(perfilId).toArray(),
      db.simulados.where('perfilId').equals(perfilId).toArray(),
      db.planejamento.where('perfilId').equals(perfilId).toArray(),
      db.conquistas.where('perfilId').equals(perfilId).toArray(),
      db.flashcards.where('perfilId').equals(perfilId).toArray(),
    ]);
    set({ sessoes: s, historicoSemanal: h, anotacoes: a, redacoes: r, simulados: sim, planejamento: p, conquistas: c, flashcards: f, carregando: false });
  },

  registrarSessao: async (dados) => {
    const agora = new Date();
    const duracao = Math.max(0, dados.duracaoMinutos);
    const duracaoReal = Math.max(0, dados.duracaoRealMinutos ?? duracao);
    const diaInicio = dados.diaInicioSemana ?? 1;
    const semanaIso = getAnoSemanaIso(agora, diaInicio);
    const meta = Math.max(0, dados.metaSemanalMinutos ?? 0);

    // Calcula o acumulado atual para determinar o tipo
    const sessoesAtuais = get().sessoes;
    const { planejada: acumuladoAtual } = somarMinutosPorMateriaNaSemana(
      sessoesAtuais, dados.materiaId, semanaIso
    );

    const { tipo } = determinarTipoSessao(acumuladoAtual, meta, duracao);

    const sessao: SessaoEstudo = {
      id: gerarId(),
      perfilId: dados.perfilId,
      materiaId: dados.materiaId,
      subtopicoId: dados.subtopicoId,
      duracaoMinutos: duracao,
      duracaoRealMinutos: duracaoReal,
      timestampInicio: agora.toISOString(),
      timestampFim: agora.toISOString(),
      tipo,
      origem: dados.origem,
      semanaIso,
      nota: dados.nota,
    };

    await db.sessoes.add(sessao);
    set(s => ({ sessoes: [...s.sessoes, sessao] }));
    return sessao;
  },

  adicionarAnotacao: async (dados) => {
    const agora = new Date().toISOString();
    const anotacao: Anotacao = {
      ...dados,
      id: gerarId(),
      tags: dados.tags ?? [],
      criadoEm: agora,
      atualizadoEm: agora,
    };
    await db.anotacoes.add(anotacao);
    set(s => ({ anotacoes: [...s.anotacoes, anotacao] }));
    return anotacao;
  },

  atualizarAnotacao: async (id, dados) => {
    const atualizado = { ...dados, atualizadoEm: new Date().toISOString() };
    await db.anotacoes.update(id, atualizado);
    set(s => ({ anotacoes: s.anotacoes.map(a => a.id === id ? { ...a, ...atualizado } : a) }));
  },

  removerAnotacao: async (id) => {
    await db.anotacoes.delete(id);
    set(s => ({ anotacoes: s.anotacoes.filter(a => a.id !== id) }));
  },

  adicionarFlashcard: async (dados) => {
    const agora = new Date().toISOString();
    const fc: Flashcard = {
      ...dados,
      id: gerarId(),
      facilidade: 2.5,
      intervalo: 1,
      repeticoes: 0,
      proximaRevisao: agora,
      criadoEm: agora,
    };
    await db.flashcards.add(fc);
    set(s => ({ flashcards: [...s.flashcards, fc] }));
    return fc;
  },

  removerFlashcard: async (id) => {
    await db.flashcards.delete(id);
    set(s => ({ flashcards: s.flashcards.filter(f => f.id !== id) }));
  },

  revisarFlashcard: async (id, qualidade) => {
    const fc = get().flashcards.find(f => f.id === id);
    if (!fc) return;
    // Algoritmo SM-2 simplificado
    let { facilidade, intervalo, repeticoes } = fc;
    if (qualidade < 3) {
      repeticoes = 0;
      intervalo = 1;
    } else {
      repeticoes += 1;
      if (repeticoes === 1) intervalo = 1;
      else if (repeticoes === 2) intervalo = 6;
      else intervalo = Math.round(intervalo * facilidade);
      facilidade = Math.max(1.3, facilidade + (0.1 - (5 - qualidade) * (0.08 + (5 - qualidade) * 0.02)));
    }
    const proxima = new Date();
    proxima.setDate(proxima.getDate() + intervalo);
    const atualizada: Flashcard = {
      ...fc,
      facilidade: Math.round(facilidade * 100) / 100,
      intervalo,
      repeticoes,
      proximaRevisao: proxima.toISOString(),
    };
    await db.flashcards.update(id, atualizada);
    set(s => ({ flashcards: s.flashcards.map(f => f.id === id ? atualizada : f) }));
  },

  adicionarRedacao: async (dados) => {
    const redacao: Redacao = { ...dados, id: gerarId() };
    await db.redacoes.add(redacao);
    set(s => ({ redacoes: [...s.redacoes, redacao] }));
    return redacao;
  },

  removerRedacao: async (id) => {
    await db.redacoes.delete(id);
    set(s => ({ redacoes: s.redacoes.filter(r => r.id !== id) }));
  },

  adicionarSimulado: async (dados) => {
    const simulado: Simulado = { ...dados, id: gerarId() };
    await db.simulados.add(simulado);
    set(s => ({ simulados: [...s.simulados, simulado] }));
    return simulado;
  },

  removerSimulado: async (id) => {
    await db.simulados.delete(id);
    set(s => ({ simulados: s.simulados.filter(sim => sim.id !== id) }));
  },

  salvarPlanejamento: async (blocos) => {
    if (blocos.length > 0) {
      await db.planejamento.where('perfilId').equals(blocos[0].perfilId).delete();
      await db.planejamento.bulkAdd(blocos);
    } else {
      // Sem blocos — limpa o planeamento do perfil
      const { planejamento } = get();
      if (planejamento.length > 0) {
        await db.planejamento.where('perfilId').equals(planejamento[0].perfilId).delete();
      }
    }
    set({ planejamento: blocos });
  },

  adicionarConquistas: async (conquistas) => {
    if (conquistas.length === 0) return;
    await db.conquistas.bulkAdd(conquistas);
    set(s => ({ conquistas: [...s.conquistas, ...conquistas] }));
  },
}));
