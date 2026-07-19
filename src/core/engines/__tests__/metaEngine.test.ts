import { describe, it, expect } from 'vitest';
import {
  determinarTipoSessao,
  calcularProgressoSemanal,
  metaConcluida,
  calcularDeficit,
  calcularOpcoesDeficit,
  somarMinutosPorMateriaNaSemana,
} from '../metaEngine';
import type { Materia, SessaoEstudo } from '@shared/types';

const materiaBase: Materia = {
  id: 'm1',
  perfilId: 'p1',
  nome: 'Matemática',
  cor: '#FF0000',
  icone: 'calculator',
  metaSemanalMinutos: 120,
  pesoPrioridade: 5,
  padrao: true,
  arquivada: false,
  area: 'matematica',
};

describe('metaEngine', () => {
  describe('determinarTipoSessao', () => {
    it('deve marcar como planejada quando dentro da meta', () => {
      const result = determinarTipoSessao(0, 120, 60);
      expect(result.tipo).toBe('planejada');
      expect(result.novoAcumulado).toBe(60);
      expect(result.excedente).toBe(0);
    });

    it('deve marcar como extra quando meta já foi batida', () => {
      const result = determinarTipoSessao(120, 120, 30);
      expect(result.tipo).toBe('extra');
      expect(result.excedente).toBe(30);
    });

    it('deve marcar como planejada quando completa exatamente a meta', () => {
      const result = determinarTipoSessao(60, 120, 60);
      expect(result.tipo).toBe('planejada');
      expect(result.novoAcumulado).toBe(120);
    });

    it('deve calcular excedente quando sessão ultrapassa a meta', () => {
      const result = determinarTipoSessao(100, 120, 40);
      expect(result.tipo).toBe('planejada');
      expect(result.novoAcumulado).toBe(120);
      expect(result.excedente).toBe(20);
    });
  });

  describe('calcularProgressoSemanal', () => {
    it('deve retornar 0 quando acumulado é 0', () => {
      expect(calcularProgressoSemanal(0, 120)).toBe(0);
    });

    it('deve retornar 50 quando está na metade', () => {
      expect(calcularProgressoSemanal(60, 120)).toBe(50);
    });

    it('deve retornar 100 quando meta atingida', () => {
      expect(calcularProgressoSemanal(120, 120)).toBe(100);
    });

    it('deve capar em 100 mesmo se ultrapassar', () => {
      expect(calcularProgressoSemanal(200, 120)).toBe(100);
    });

    it('deve retornar 0 quando meta é 0', () => {
      expect(calcularProgressoSemanal(50, 0)).toBe(0);
    });
  });

  describe('metaConcluida', () => {
    it('deve retornar false quando abaixo da meta', () => {
      expect(metaConcluida(100, 120)).toBe(false);
    });

    it('deve retornar true quando igual à meta', () => {
      expect(metaConcluida(120, 120)).toBe(true);
    });

    it('deve retornar true quando acima da meta', () => {
      expect(metaConcluida(150, 120)).toBe(true);
    });
  });

  describe('calcularDeficit', () => {
    it('deve retornar o valor do déficit', () => {
      expect(calcularDeficit(80, 120)).toBe(40);
    });

    it('deve retornar 0 quando meta foi batida', () => {
      expect(calcularDeficit(120, 120)).toBe(0);
      expect(calcularDeficit(150, 120)).toBe(0);
    });
  });

  describe('calcularOpcoesDeficit', () => {
    it('deve oferecer redistribuir e ignorar quando deficit simples', () => {
      const opcoes = calcularOpcoesDeficit(materiaBase, 40, 1);
      expect(opcoes).toHaveLength(2);
      expect(opcoes[0].tipo).toBe('redistribuir');
      expect((opcoes[0] as any).valorExtra).toBe(20); // 50% de 40
      expect(opcoes[1].tipo).toBe('ignorar');
    });

    it('deve sugerir redução de meta após 3 semanas de déficit', () => {
      const opcoes = calcularOpcoesDeficit(materiaBase, 40, 3);
      const reducao = opcoes.find(o => o.tipo === 'reduzir_meta');
      expect(reducao).toBeDefined();
    });

    it('não deve sugerir redução se deficit for 0', () => {
      const opcoes = calcularOpcoesDeficit(materiaBase, 0, 3);
      const reducao = opcoes.find(o => o.tipo === 'reduzir_meta');
      expect(reducao).toBeUndefined();
    });
  });

  describe('somarMinutosPorMateriaNaSemana', () => {
    const sessoes: SessaoEstudo[] = [
      {
        id: 's1', perfilId: 'p1', materiaId: 'm1',
        duracaoMinutos: 30, duracaoRealMinutos: 30,
        timestampInicio: '2026-01-01T10:00:00Z',
        tipo: 'planejada', origem: 'manual', semanaIso: '2026-W01',
      },
      {
        id: 's2', perfilId: 'p1', materiaId: 'm1',
        duracaoMinutos: 45, duracaoRealMinutos: 45,
        timestampInicio: '2026-01-02T10:00:00Z',
        tipo: 'extra', origem: 'pomodoro', semanaIso: '2026-W01',
      },
      {
        id: 's3', perfilId: 'p1', materiaId: 'm2',
        duracaoMinutos: 60, duracaoRealMinutos: 60,
        timestampInicio: '2026-01-01T10:00:00Z',
        tipo: 'planejada', origem: 'manual', semanaIso: '2026-W01',
      },
    ];

    it('deve somar planejada e extra separadamente', () => {
      const result = somarMinutosPorMateriaNaSemana(sessoes, 'm1', '2026-W01');
      expect(result.planejada).toBe(30);
      expect(result.extra).toBe(45);
    });

    it('deve retornar 0 para matéria sem sessões', () => {
      const result = somarMinutosPorMateriaNaSemana(sessoes, 'm3', '2026-W01');
      expect(result.planejada).toBe(0);
      expect(result.extra).toBe(0);
    });
  });
});