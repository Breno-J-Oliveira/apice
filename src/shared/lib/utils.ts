import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Gera um ID único (UUID v4). */
export function gerarId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para browsers antigos
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Combina classes Tailwind com merge inteligente. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Formata minutos em "Xh Ymin" (mais legível em português). */
export function formatarMinutos(minutos: number): string {
  if (minutos < 0 || !isFinite(minutos)) return '0min';
  const total = Math.round(minutos);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/** Formata minutos para formato compacto "XhYY" (ex: "1h25"). */
export function formatarMinutosCurto(minutos: number): string {
  const total = Math.round(minutos);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

/** Formata data ISO para "DD/MM/AAAA". */
export function formatarData(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR');
}

/** Formata data ISO para "DD/MM" curto. */
export function formatarDataCurta(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/** Formata data ISO para "DD MMM" (ex: "15 Jan"). */
export function formatarDataMedia(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/** Retorna a data de hoje como ISO. */
export function hojeISO(): string {
  return new Date().toISOString();
}

/** Calcula a diferença em dias entre duas datas. */
export function diasEntre(de: Date, ate: Date): number {
  const ms = ate.getTime() - de.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/** Trunca texto com reticências. */
export function truncar(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  return texto.slice(0, max - 1).trimEnd() + '…';
}

/** Validação Zod para backup. */
import { z } from 'zod';

const notasRedacaoSchema = z.object({
  competencia1: z.number().min(0).max(200),
  competencia2: z.number().min(0).max(200),
  competencia3: z.number().min(0).max(200),
  competencia4: z.number().min(0).max(200),
  competencia5: z.number().min(0).max(200),
});

export const backupSchema = z.object({
  versaoSchema: z.literal(2),
  exportadoEm: z.string(),
  perfil: z.object({
    id: z.string(),
    nome: z.string(),
    dataEvento: z.string(),
    nomeEvento: z.string(),
    temaAtivo: z.enum(['areia', 'bruma', 'musgo', 'ardosia', 'aurora']),
    temaSistema: z.boolean(),
    diaInicioSemana: z.union([z.literal(0), z.literal(1)]),
    diasGracaStreakDisponiveis: z.number(),
    ultimaSemanaProcessada: z.string(),
    criadoEm: z.string(),
    ultimoExport: z.string().nullable(),
    schemaVersion: z.number(),
  }),
  materias: z.array(z.any()),
  subtopicos: z.array(z.any()),
  sessoes: z.array(z.any()),
  anotacoes: z.array(z.any()),
  redacoes: z.array(z.any()),
  simulados: z.array(z.any()),
  historicoSemanal: z.array(z.any()),
  planejamento: z.array(z.any()),
  conquistas: z.array(z.any()),
  flashcards: z.array(z.any()).optional(),
});

/** Calcula o total de uma redação. */
export function totalRedacao(notas: { competencia1: number; competencia2: number; competencia3: number; competencia4: number; competencia5: number }): number {
  return notas.competencia1 + notas.competencia2 + notas.competencia3 + notas.competencia4 + notas.competencia5;
}

/** Toca um beep usando Web Audio API. */
export function tocarBeep(frequencia: number = 880, duracaoMs: number = 200, volume: number = 0.3): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequencia;
    osc.type = 'sine';
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duracaoMs / 1000);
    osc.start();
    osc.stop(ctx.currentTime + duracaoMs / 1000);
  } catch {
    // Silencia erros de autoplay
  }
}
