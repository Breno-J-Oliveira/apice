// ─────────────────────────────────────────────
// Ápice — Tipos e constantes
// ─────────────────────────────────────────────

// ─── Perfil ───
export interface Perfil {
  id: string;
  nome: string;
  /** Data do evento-alvo (prova, concurso, objetivo). O Ápice não se limita ao ENEM. */
  dataEvento: string;
  /** Nome do evento (ex: "ENEM 2026", "Concurso TRT", "OAB"). */
  nomeEvento: string;
  temaAtivo: Tema;
  /** Se true, segue o tema do sistema operativo (claro/escuro). */
  temaSistema: boolean;
  diaInicioSemana: 0 | 1;
  diasGracaStreakDisponiveis: number;
  ultimaSemanaProcessada: string;
  criadoEm: string;
  ultimoExport: string | null;
  /** Versão do schema do perfil (para migrações futuras). */
  schemaVersion: number;
}

export type Tema = 'areia' | 'bruma' | 'musgo' | 'ardosia' | 'aurora';

// ─── Matéria ───
export interface Materia {
  id: string;
  perfilId: string;
  nome: string;
  cor: string;
  icone: string;
  metaSemanalMinutos: number;
  pesoPrioridade: 1 | 2 | 3 | 4 | 5;
  padrao: boolean;
  arquivada: boolean;
  area: Area;
}

export type Area = 'linguagens' | 'humanas' | 'natureza' | 'matematica' | 'redacao';

export interface Subtopico {
  id: string;
  materiaId: string;
  nome: string;
  metaSemanalMinutos?: number;
  status: StatusSubtopico;
  criadoEm?: string;
}

export type StatusSubtopico = 'nao_iniciado' | 'em_andamento' | 'dominado';

// ─── Sessão de Estudo ───
export interface SessaoEstudo {
  id: string;
  perfilId: string;
  materiaId: string;
  subtopicoId?: string;
  duracaoMinutos: number;
  /** Minutos reais decorridos (pode ser menor que duracaoMinutos se parou cedo). */
  duracaoRealMinutos: number;
  timestampInicio: string;
  timestampFim?: string;
  tipo: TipoSessao;
  origem: OrigemSessao;
  semanaIso: string;
  /** Nota/observação opcional do usuário. */
  nota?: string;
}

export type TipoSessao = 'planejada' | 'extra';
export type OrigemSessao = 'manual' | 'pomodoro' | 'sessao-rapida';

// ─── Histórico Semanal ───
export interface HistoricoSemanal {
  id: string;
  perfilId: string;
  semanaIso: string;
  porMateria: Record<string, { meta: number; realizado: number; extra: number }>;
  streakNoFinalDaSemana: number;
}

// ─── Anotação ───
export interface Anotacao {
  id: string;
  perfilId: string;
  materiaId: string;
  titulo: string;
  conteudo: string;
  tags: string[];
  criadoEm: string;
  atualizadoEm: string;
}

// ─── Flashcard (reintroduzido) ───
export interface Flashcard {
  id: string;
  perfilId: string;
  materiaId: string;
  frente: string;
  verso: string;
  /** Algoritmo SM-2 simplificado: 0–5 (0=errou, 5=perfeito). */
  facilidade: number;
  intervalo: number; // dias até a próxima revisão
  repeticoes: number;
  proximaRevisao: string; // ISO
  criadoEm: string;
}

// ─── Redação ───
export interface Redacao {
  id: string;
  perfilId: string;
  tema: string;
  data: string;
  texto: string;
  notas: NotasRedacao;
  feedback?: string;
  /** Competência 1 a 5 (0-200 cada; total 0-1000). */
  total?: number;
}

export interface NotasRedacao {
  competencia1: number;
  competencia2: number;
  competencia3: number;
  competencia4: number;
  competencia5: number;
}

// ─── Simulado ───
export interface Simulado {
  id: string;
  perfilId: string;
  data: string;
  nome?: string;
  acertosPorArea: Partial<Record<Area, number>>;
  totalQuestoesPorArea: Partial<Record<Area, number>>;
  tempoMinutos: number;
  notaTriEstimada?: number;
}

// ─── Planejamento Semanal ───
export interface BlocoPlanejamento {
  id: string;
  perfilId: string;
  diaSemana: number;
  materiaId: string;
  subtopicoId?: string;
  duracaoEstimadaMinutos: number;
  concluido: boolean;
  semanaIso: string;
}

// ─── Conquista ───
export interface Conquista {
  id: string;
  perfilId: string;
  tipo: TipoConquista;
  desbloqueadaEm: string;
  titulo: string;
  descricao: string;
  icone: string;
}

export type TipoConquista =
  | 'meta_4_semanas_seguidas'
  | 'primeira_redacao_900'
  | 'streak_7_dias'
  | 'streak_30_dias'
  | 'streak_100_dias'
  | 'primeiro_simulado'
  | '10_horas_estudo'
  | '50_horas_estudo'
  | '100_horas_estudo'
  | 'todas_materias_semana'
  | 'nivel_5'
  | 'nivel_10'
  | 'primeira_anotacao'
  | 'primeira_sessao'
  | 'madrugador'
  | 'noturno';

// ─── Backup ───
export interface BackupExportado {
  versaoSchema: number;
  exportadoEm: string;
  perfil: Perfil;
  materias: Materia[];
  subtopicos: Subtopico[];
  sessoes: SessaoEstudo[];
  anotacoes: Anotacao[];
  redacoes: Redacao[];
  simulados: Simulado[];
  historicoSemanal: HistoricoSemanal[];
  planejamento: BlocoPlanejamento[];
  conquistas: Conquista[];
  flashcards: Flashcard[];
}

// ─── Configurações do Pomodoro ───
export interface ConfigPomodoro {
  focoMinutos: number;
  pausaCurtaMinutos: number;
  pausaLongaMinutos: number;
  ciclosAtePausaLonga: number;
  /** Reproduz som ao iniciar/terminar ciclo. */
  somAtivo: boolean;
  /** Notificações do browser. */
  notificacoesAtivas: boolean;
}

export type EstadoPomodoro = 'idle' | 'foco' | 'pausaCurta' | 'pausaLonga' | 'pausado';

// ─── Configurações da App ───
export interface ConfiguracaoApp {
  atalhos: boolean;
  modoFocoAutomatico: boolean;
  mostrarHeatmap: boolean;
}

// ─── Cores de matéria por tema ───
export const CORES_MATERIA_POR_TEMA: Record<Tema, string[]> = {
  areia: ['#D9A98C', '#A9B899', '#C4A882', '#B8A9C9', '#9BB5C0', '#D4B896', '#A8C4A2', '#CDB5A8', '#B5C4D0', '#C9A99D', '#BFA888', '#A0B8C8'],
  bruma: ['#8CA3B8', '#B7AAC9', '#9FB5C0', '#A898B0', '#8CAE9F', '#B0A5C0', '#95B0BE', '#ACA0C4', '#8DA0AD', '#AEA5BE', '#A0A8C0', '#90B0BA'],
  musgo: ['#8FA876', '#D9A98C', '#A8C490', '#C49A7A', '#9CB28A', '#BD9B80', '#9CC094', '#C19678', '#A0B68E', '#B89274', '#9EB88C', '#C09080'],
  ardosia: ['#5DA3C2', '#C4868E', '#7AB4D0', '#D49098', '#6CAAC4', '#CC9098', '#6BB0CC', '#CE8E96', '#7AAED0', '#C88A92', '#6DA8C8', '#D09096'],
  aurora: ['#B07AA8', '#7AA8B0', '#A8B07A', '#B0887A', '#7A8FB0', '#B0A87A', '#9F7AB0', '#7AB0A0', '#B07A8F', '#88B07A', '#7A8FB0', '#B07A95'],
};

export interface MateriaPadrao {
  nome: string;
  icone: string;
  area: Area;
  pesoPrioridade: 1 | 2 | 3 | 4 | 5;
  pesoEnem: number; // 1-10: quanto mais cai no ENEM
}

export const MATERIAS_PADRAO: MateriaPadrao[] = [
  { nome: 'Língua Portuguesa', icone: 'book-open', area: 'linguagens', pesoPrioridade: 5, pesoEnem: 8 },
  { nome: 'Literatura', icone: 'feather', area: 'linguagens', pesoPrioridade: 3, pesoEnem: 5 },
  { nome: 'Inglês', icone: 'globe', area: 'linguagens', pesoPrioridade: 3, pesoEnem: 3 },
  { nome: 'História', icone: 'landmark', area: 'humanas', pesoPrioridade: 4, pesoEnem: 6 },
  { nome: 'Geografia', icone: 'map', area: 'humanas', pesoPrioridade: 4, pesoEnem: 6 },
  { nome: 'Filosofia', icone: 'lightbulb', area: 'humanas', pesoPrioridade: 3, pesoEnem: 4 },
  { nome: 'Sociologia', icone: 'users', area: 'humanas', pesoPrioridade: 3, pesoEnem: 4 },
  { nome: 'Matemática', icone: 'calculator', area: 'matematica', pesoPrioridade: 5, pesoEnem: 10 },
  { nome: 'Física', icone: 'atom', area: 'natureza', pesoPrioridade: 4, pesoEnem: 7 },
  { nome: 'Química', icone: 'flask-conical', area: 'natureza', pesoPrioridade: 4, pesoEnem: 7 },
  { nome: 'Biologia', icone: 'leaf', area: 'natureza', pesoPrioridade: 4, pesoEnem: 7 },
  { nome: 'Redação', icone: 'pen-tool', area: 'redacao', pesoPrioridade: 5, pesoEnem: 10 },
];

export const NOMES_AREAS: Record<Area, string> = {
  linguagens: 'Linguagens, Códigos e suas Tecnologias',
  humanas: 'Ciências Humanas e suas Tecnologias',
  natureza: 'Ciências da Natureza e suas Tecnologias',
  matematica: 'Matemática e suas Tecnologias',
  redacao: 'Redação',
};

export const NOMES_TEMAS: Record<Tema, { nome: string; descricao: string; emoji: string }> = {
  areia: { nome: 'Areia', descricao: 'Claro quente — padrão', emoji: '☀️' },
  bruma: { nome: 'Bruma', descricao: 'Claro frio e calmo', emoji: '🌫️' },
  musgo: { nome: 'Musgo', descricao: 'Escuro quente e natural', emoji: '🌿' },
  ardosia: { nome: 'Ardósia', descricao: 'Escuro frio de alto contraste', emoji: '🌑' },
  aurora: { nome: 'Aurora', descricao: 'Gradiente suave e criativo', emoji: '🌅' },
};

export const TEMAS_CLAROS: Tema[] = ['areia', 'bruma', 'aurora'];
export const TEMAS_ESCUROS: Tema[] = ['musgo', 'ardosia'];

export interface MateriaPriorizada {
  materiaId: string;
  score: number;
  motivo: string;
}

export interface PesosPriorizacao {
  pesoMateria: number;
  defictSemanal: number;
  diasSemEstudar: number;
  proximidadeProva: number;
}
