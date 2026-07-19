import Dexie, { type Table } from 'dexie';
import type {
  Perfil, Materia, Subtopico, SessaoEstudo, HistoricoSemanal,
  Anotacao, Redacao, Simulado, BlocoPlanejamento, Conquista, Flashcard,
} from '@shared/types';

export class ApiceDB extends Dexie {
  perfis!: Table<Perfil, string>;
  materias!: Table<Materia, string>;
  subtopicos!: Table<Subtopico, string>;
  sessoes!: Table<SessaoEstudo, string>;
  historicoSemanal!: Table<HistoricoSemanal, string>;
  anotacoes!: Table<Anotacao, string>;
  redacoes!: Table<Redacao, string>;
  simulados!: Table<Simulado, string>;
  planejamento!: Table<BlocoPlanejamento, string>;
  conquistas!: Table<Conquista, string>;
  flashcards!: Table<Flashcard, string>;

  constructor() {
    super('ApiceDB');

    // Migração v1 → v2: Enemzin → Ápice, adiciona campos novos
    this.version(1).stores({
      perfis: 'id',
      materias: 'id, perfilId',
      subtopicos: 'id, materiaId',
      sessoes: 'id, perfilId, materiaId, semanaIso, timestampInicio',
      historicoSemanal: 'id, perfilId, semanaIso',
      anotacoes: 'id, perfilId, materiaId',
      redacoes: 'id, perfilId',
      simulados: 'id, perfilId',
      planejamento: 'id, perfilId, semanaIso',
      conquistas: 'id, perfilId',
    });

    this.version(2).stores({
      perfis: 'id',
      materias: 'id, perfilId',
      subtopicos: 'id, materiaId',
      sessoes: 'id, perfilId, materiaId, semanaIso, timestampInicio',
      historicoSemanal: 'id, perfilId, semanaIso',
      anotacoes: 'id, perfilId, materiaId',
      redacoes: 'id, perfilId',
      simulados: 'id, perfilId',
      planejamento: 'id, perfilId, semanaIso',
      conquistas: 'id, perfilId',
      flashcards: 'id, perfilId, materiaId, proximaRevisao',
    });

    // Migração automática de dados da v1 (Enemzin) para v2 (Ápice) ao abrir
    this.version(2).upgrade(async (tx) => {
      // Renomeia dataProvaEnem → dataEvento (default ENEM) e adiciona campos novos
      await tx.table('perfis').toCollection().modify((perfil: any) => {
        if (perfil.dataProvaEnem && !perfil.dataEvento) {
          perfil.dataEvento = perfil.dataProvaEnem;
          perfil.nomeEvento = 'ENEM';
          delete perfil.dataProvaEnem;
        }
        if (perfil.temaAtivo === undefined) perfil.temaAtivo = 'areia';
        if (perfil.temaSistema === undefined) perfil.temaSistema = false;
        if (perfil.schemaVersion === undefined) perfil.schemaVersion = 2;
      });
      // Adiciona duracaoRealMinutos em sessões antigas
      await tx.table('sessoes').toCollection().modify((sessao: any) => {
        if (sessao.duracaoRealMinutos === undefined) {
          sessao.duracaoRealMinutos = sessao.duracaoMinutos ?? 0;
        }
        if (sessao.origem === 'manual' || sessao.origem === 'pomodoro') {
          // OK
        } else if (sessao.origem) {
          sessao.origem = 'manual';
        }
      });
    });
  }
}

export const db = new ApiceDB();
