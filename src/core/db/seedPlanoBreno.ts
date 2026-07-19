/**
 * Plano personalizado Breno
 *
 * Distribuição semanal (18h total):
 *   Matemática    6h    33%  (pesoEnem 10)
 *   Química      2h40  15%  (pesoEnem 7)
 *   Biologia     2h20  13%  (pesoEnem 7)
 *   Física       2h    11%  (pesoEnem 7)
 *   Português    1h30   8%  (pesoEnem 8)
 *   História     1h15   7%  (pesoEnem 6)
 *   Geografia    1h15   7%  (pesoEnem 6)
 *   Filosofia    30m    3%  (pesoEnem 4)
 *   Sociologia   30m    3%  (pesoEnem 4)
 *
 * 9 matérias focadas. Usa o seedDiagnostico.ts para os subtopicos.
 */

import type { Area } from '@shared/types';

export interface MateriaPlanoBreno {
  nome: string;
  area: Area;
  icone: string;
  cor: string;
  pesoPrioridade: 1 | 2 | 3 | 4 | 5;
  pesoEnem: number;
  horasSemanais: number; // minutos
}

export const MATERIAS_PLANO_BRENO: MateriaPlanoBreno[] = [
  { nome: 'Matemática',         area: 'matematica', icone: 'calculator',   cor: '#C47A5A', pesoPrioridade: 5, pesoEnem: 10, horasSemanais: 360 },
  { nome: 'Química',            area: 'natureza',    icone: 'flask-conical', cor: '#7A9B6E', pesoPrioridade: 4, pesoEnem: 7,  horasSemanais: 160 },
  { nome: 'Biologia',           area: 'natureza',    icone: 'leaf',         cor: '#8FAB7A', pesoPrioridade: 4, pesoEnem: 7,  horasSemanais: 140 },
  { nome: 'Física',             area: 'natureza',    icone: 'atom',         cor: '#5DA3C2', pesoPrioridade: 4, pesoEnem: 7,  horasSemanais: 120 },
  { nome: 'Língua Portuguesa', area: 'linguagens',  icone: 'book-open',    cor: '#D9A98C', pesoPrioridade: 5, pesoEnem: 8,  horasSemanais: 90  },
  { nome: 'História',           area: 'humanas',     icone: 'landmark',     cor: '#B8A9C9', pesoPrioridade: 4, pesoEnem: 6,  horasSemanais: 75  },
  { nome: 'Geografia',          area: 'humanas',     icone: 'map',          cor: '#9BB5C0', pesoPrioridade: 4, pesoEnem: 6,  horasSemanais: 75  },
  { nome: 'Filosofia',          area: 'humanas',     icone: 'lightbulb',    cor: '#D4A853', pesoPrioridade: 3, pesoEnem: 4,  horasSemanais: 30  },
  { nome: 'Sociologia',         area: 'humanas',     icone: 'users',        cor: '#A9B899', pesoPrioridade: 3, pesoEnem: 4,  horasSemanais: 30  },
];

// Total: 360+160+140+120+90+75+75+30+30 = 1080 min = 18h
