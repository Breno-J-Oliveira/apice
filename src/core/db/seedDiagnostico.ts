/**
 * Seed de diagnóstico — subtópicos pré-mapeados com níveis de dificuldade
 * baseados no diagnóstico do utilizador.
 * 
 * 🔴 Grande dificuldade → status: 'nao_iniciado' (prioridade máxima)
 * 🟡 Dificuldade média  → status: 'em_andamento'
 * 🟢 Boa base           → status: 'dominado'
 * ⚪ Não avaliado       → status: 'nao_iniciado'
 */

import type { StatusSubtopico } from '@shared/types';

export interface SubtopicoDiagnostico {
  nome: string;
  status: StatusSubtopico;
  /** Matéria pai (procurada por nome) */
  materiaNome: string;
}

/**
 * Mapeamento completo do diagnóstico para subtópicos.
 * Agrupado por matéria para facilitar a leitura.
 */
export const DIAGNOSTICO_SUBTOPICOS: SubtopicoDiagnostico[] = [
  // ─── MATEMÁTICA ───
  // Aritmética
  { materiaNome: 'Matemática', nome: 'Razão e proporção', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Regra de três simples', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Regra de três composta', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Porcentagem', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Juros simples', status: 'em_andamento' },
  { materiaNome: 'Matemática', nome: 'Juros compostos', status: 'em_andamento' },
  { materiaNome: 'Matemática', nome: 'Média', status: 'dominado' },
  { materiaNome: 'Matemática', nome: 'Moda', status: 'dominado' },
  { materiaNome: 'Matemática', nome: 'Mediana', status: 'dominado' },
  { materiaNome: 'Matemática', nome: 'Probabilidade', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Análise combinatória', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Sequências', status: 'nao_iniciado' },
  // Álgebra
  { materiaNome: 'Matemática', nome: 'Equações do 1º grau', status: 'em_andamento' },
  { materiaNome: 'Matemática', nome: 'Equações do 2º grau', status: 'em_andamento' },
  { materiaNome: 'Matemática', nome: 'Sistemas de equações', status: 'em_andamento' },
  { materiaNome: 'Matemática', nome: 'Função afim', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Função quadrática', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Função exponencial', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Função logarítmica', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Progressão Aritmética (PA)', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Progressão Geométrica (PG)', status: 'nao_iniciado' },
  // Geometria Plana
  { materiaNome: 'Matemática', nome: 'Área (Geometria Plana)', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Perímetro', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Semelhança de triângulos', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Teorema de Pitágoras', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Circunferência', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Polígonos', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Ângulos', status: 'nao_iniciado' },
  // Geometria Espacial
  { materiaNome: 'Matemática', nome: 'Prismas', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Cilindros', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Cones', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Pirâmides', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Esferas', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Volume', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Área total', status: 'nao_iniciado' },
  // Geometria Analítica
  { materiaNome: 'Matemática', nome: 'Plano cartesiano', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Distância entre pontos', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Equação da reta', status: 'nao_iniciado' },
  // Estatística
  { materiaNome: 'Matemática', nome: 'Interpretação de gráficos', status: 'dominado' },
  { materiaNome: 'Matemática', nome: 'Tabelas', status: 'dominado' },
  { materiaNome: 'Matemática', nome: 'Desvio padrão', status: 'nao_iniciado' },
  // Matemática Financeira
  { materiaNome: 'Matemática', nome: 'Juros (Mat. Financeira)', status: 'em_andamento' },
  { materiaNome: 'Matemática', nome: 'Descontos', status: 'nao_iniciado' },
  { materiaNome: 'Matemática', nome: 'Inflação', status: 'nao_iniciado' },

  // ─── QUÍMICA ───
  { materiaNome: 'Química', nome: 'Estrutura atômica', status: 'em_andamento' },
  { materiaNome: 'Química', nome: 'Tabela periódica', status: 'em_andamento' },
  { materiaNome: 'Química', nome: 'Ligações químicas', status: 'em_andamento' },
  { materiaNome: 'Química', nome: 'Funções inorgânicas', status: 'nao_iniciado' },
  { materiaNome: 'Química', nome: 'Ácidos', status: 'nao_iniciado' },
  { materiaNome: 'Química', nome: 'Bases', status: 'nao_iniciado' },
  { materiaNome: 'Química', nome: 'Sais', status: 'nao_iniciado' },
  { materiaNome: 'Química', nome: 'Óxidos', status: 'nao_iniciado' },
  { materiaNome: 'Química', nome: 'pH', status: 'nao_iniciado' },
  { materiaNome: 'Química', nome: 'Soluções', status: 'nao_iniciado' },
  { materiaNome: 'Química', nome: 'Estequiometria', status: 'nao_iniciado' },
  { materiaNome: 'Química', nome: 'Termoquímica', status: 'nao_iniciado' },
  { materiaNome: 'Química', nome: 'Cinética química', status: 'nao_iniciado' },
  { materiaNome: 'Química', nome: 'Equilíbrio químico', status: 'nao_iniciado' },
  { materiaNome: 'Química', nome: 'Eletroquímica', status: 'nao_iniciado' },
  { materiaNome: 'Química', nome: 'Funções orgânicas', status: 'nao_iniciado' },
  { materiaNome: 'Química', nome: 'Cadeias carbônicas', status: 'em_andamento' },
  { materiaNome: 'Química', nome: 'Isomeria', status: 'nao_iniciado' },
  { materiaNome: 'Química', nome: 'Polímeros', status: 'nao_iniciado' },
  { materiaNome: 'Química', nome: 'Poluição', status: 'nao_iniciado' },
  { materiaNome: 'Química', nome: 'Chuva ácida', status: 'nao_iniciado' },
  { materiaNome: 'Química', nome: 'Efeito estufa', status: 'nao_iniciado' },
  { materiaNome: 'Química', nome: 'Tratamento de água', status: 'nao_iniciado' },

  // ─── BIOLOGIA ───
  { materiaNome: 'Biologia', nome: 'Mitocôndria', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'ATP', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Respiração celular', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Fermentação', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Fotossíntese', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Membrana plasmática', status: 'em_andamento' },
  { materiaNome: 'Biologia', nome: 'Organelas', status: 'em_andamento' },
  { materiaNome: 'Biologia', nome: 'DNA', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'RNA', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Síntese proteica', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Hereditariedade', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Leis de Mendel', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Darwin', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Lamarck', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Seleção natural', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Cadeia alimentar', status: 'em_andamento' },
  { materiaNome: 'Biologia', nome: 'Teia alimentar', status: 'em_andamento' },
  { materiaNome: 'Biologia', nome: 'Ciclos biogeoquímicos', status: 'em_andamento' },
  { materiaNome: 'Biologia', nome: 'Espécies invasoras', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Sucessão ecológica', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Wolbachia', status: 'dominado' },
  { materiaNome: 'Biologia', nome: 'Biomas', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Visão', status: 'dominado' },
  { materiaNome: 'Biologia', nome: 'Sistema nervoso', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Sistema endócrino', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Sistema digestório', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Sistema respiratório', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Sistema circulatório', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Sistema imunológico', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Eritropoietina', status: 'dominado' },
  { materiaNome: 'Biologia', nome: 'Vacinas', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Clonagem', status: 'nao_iniciado' },
  { materiaNome: 'Biologia', nome: 'Transgênicos', status: 'nao_iniciado' },

  // ─── FÍSICA ───
  { materiaNome: 'Física', nome: 'Movimento uniforme', status: 'nao_iniciado' },
  { materiaNome: 'Física', nome: 'Movimento uniformemente variado', status: 'nao_iniciado' },
  { materiaNome: 'Física', nome: 'Leis de Newton', status: 'nao_iniciado' },
  { materiaNome: 'Física', nome: 'Trabalho', status: 'nao_iniciado' },
  { materiaNome: 'Física', nome: 'Energia', status: 'nao_iniciado' },
  { materiaNome: 'Física', nome: 'Potência', status: 'nao_iniciado' },
  { materiaNome: 'Física', nome: 'Gravitação', status: 'nao_iniciado' },
  { materiaNome: 'Física', nome: 'Calor', status: 'nao_iniciado' },
  { materiaNome: 'Física', nome: 'Temperatura', status: 'nao_iniciado' },
  { materiaNome: 'Física', nome: 'Dilatação', status: 'nao_iniciado' },
  { materiaNome: 'Física', nome: 'Refração', status: 'dominado' },
  { materiaNome: 'Física', nome: 'Reflexão', status: 'nao_iniciado' },
  { materiaNome: 'Física', nome: 'Espelhos', status: 'nao_iniciado' },
  { materiaNome: 'Física', nome: 'Lentes', status: 'nao_iniciado' },
  { materiaNome: 'Física', nome: 'Som', status: 'nao_iniciado' },
  { materiaNome: 'Física', nome: 'Ondas', status: 'nao_iniciado' },
  { materiaNome: 'Física', nome: 'Corrente elétrica', status: 'nao_iniciado' },
  { materiaNome: 'Física', nome: 'Resistores', status: 'nao_iniciado' },
  { materiaNome: 'Física', nome: 'Associação de resistores', status: 'nao_iniciado' },
  { materiaNome: 'Física', nome: 'Potência elétrica', status: 'nao_iniciado' },

  // ─── HISTÓRIA ───
  { materiaNome: 'História', nome: 'Brasil Colônia', status: 'dominado' },
  { materiaNome: 'História', nome: 'Escravidão', status: 'dominado' },
  { materiaNome: 'História', nome: 'Independência', status: 'dominado' },
  { materiaNome: 'História', nome: 'Império', status: 'dominado' },
  { materiaNome: 'História', nome: 'República', status: 'dominado' },
  { materiaNome: 'História', nome: 'Era Vargas', status: 'nao_iniciado' },
  { materiaNome: 'História', nome: 'Ditadura Militar', status: 'nao_iniciado' },
  { materiaNome: 'História', nome: 'Revolução Industrial', status: 'nao_iniciado' },
  { materiaNome: 'História', nome: 'Revolução Francesa', status: 'nao_iniciado' },
  { materiaNome: 'História', nome: 'Guerras Mundiais', status: 'nao_iniciado' },
  { materiaNome: 'História', nome: 'Guerra Fria', status: 'nao_iniciado' },

  // ─── GEOGRAFIA ───
  { materiaNome: 'Geografia', nome: 'Urbanização', status: 'dominado' },
  { materiaNome: 'Geografia', nome: 'Globalização', status: 'dominado' },
  { materiaNome: 'Geografia', nome: 'Agropecuária', status: 'dominado' },
  { materiaNome: 'Geografia', nome: 'Questões ambientais', status: 'dominado' },
  { materiaNome: 'Geografia', nome: 'Climatologia', status: 'nao_iniciado' },
  { materiaNome: 'Geografia', nome: 'Cartografia', status: 'nao_iniciado' },
  { materiaNome: 'Geografia', nome: 'Demografia', status: 'nao_iniciado' },
  { materiaNome: 'Geografia', nome: 'Industrialização', status: 'nao_iniciado' },
  { materiaNome: 'Geografia', nome: 'Geopolítica', status: 'nao_iniciado' },

  // ─── FILOSOFIA ───
  { materiaNome: 'Filosofia', nome: 'Hannah Arendt', status: 'dominado' },
  { materiaNome: 'Filosofia', nome: 'Platão', status: 'nao_iniciado' },
  { materiaNome: 'Filosofia', nome: 'Aristóteles', status: 'nao_iniciado' },
  { materiaNome: 'Filosofia', nome: 'Sócrates', status: 'nao_iniciado' },
  { materiaNome: 'Filosofia', nome: 'Contrato Social', status: 'nao_iniciado' },
  { materiaNome: 'Filosofia', nome: 'Ética', status: 'nao_iniciado' },
  { materiaNome: 'Filosofia', nome: 'Política', status: 'nao_iniciado' },

  // ─── SOCIOLOGIA ───
  { materiaNome: 'Sociologia', nome: 'Racismo estrutural', status: 'dominado' },
  { materiaNome: 'Sociologia', nome: 'Cidadania', status: 'dominado' },
  { materiaNome: 'Sociologia', nome: 'Exclusão social', status: 'dominado' },
  { materiaNome: 'Sociologia', nome: 'Cultura', status: 'nao_iniciado' },
  { materiaNome: 'Sociologia', nome: 'Movimentos sociais', status: 'nao_iniciado' },
  { materiaNome: 'Sociologia', nome: 'Trabalho', status: 'nao_iniciado' },
  { materiaNome: 'Sociologia', nome: 'Indústria cultural', status: 'nao_iniciado' },

  // ─── LÍNGUA PORTUGUESA ───
  { materiaNome: 'Língua Portuguesa', nome: 'Interpretação geral', status: 'dominado' },
  { materiaNome: 'Língua Portuguesa', nome: 'Ideia principal', status: 'em_andamento' },
  { materiaNome: 'Língua Portuguesa', nome: 'Estratégia argumentativa', status: 'em_andamento' },
  { materiaNome: 'Língua Portuguesa', nome: 'Estratégia persuasiva', status: 'em_andamento' },
  { materiaNome: 'Língua Portuguesa', nome: 'Finalidade do texto', status: 'dominado' },
  { materiaNome: 'Língua Portuguesa', nome: 'Gêneros textuais', status: 'dominado' },
  { materiaNome: 'Língua Portuguesa', nome: 'Figuras de linguagem', status: 'nao_iniciado' },
  { materiaNome: 'Língua Portuguesa', nome: 'Variação linguística', status: 'nao_iniciado' },
  { materiaNome: 'Língua Portuguesa', nome: 'Funções da linguagem', status: 'nao_iniciado' },
  { materiaNome: 'Língua Portuguesa', nome: 'Coesão', status: 'nao_iniciado' },
  { materiaNome: 'Língua Portuguesa', nome: 'Coerência', status: 'nao_iniciado' },

  // ─── LITERATURA ───
  { materiaNome: 'Literatura', nome: 'Romantismo', status: 'em_andamento' },
  { materiaNome: 'Literatura', nome: 'Realismo', status: 'nao_iniciado' },
  { materiaNome: 'Literatura', nome: 'Modernismo', status: 'nao_iniciado' },
  { materiaNome: 'Literatura', nome: 'Vanguardas', status: 'nao_iniciado' },
  { materiaNome: 'Literatura', nome: 'Barroco', status: 'nao_iniciado' },
  { materiaNome: 'Literatura', nome: 'Arcadismo', status: 'nao_iniciado' },

  // ─── INGLÊS ───
  { materiaNome: 'Inglês', nome: 'Interpretação', status: 'nao_iniciado' },
  { materiaNome: 'Inglês', nome: 'Cognatos', status: 'nao_iniciado' },
  { materiaNome: 'Inglês', nome: 'False friends', status: 'nao_iniciado' },
  { materiaNome: 'Inglês', nome: 'Gêneros textuais', status: 'nao_iniciado' },
  { materiaNome: 'Inglês', nome: 'Anúncios', status: 'nao_iniciado' },
  { materiaNome: 'Inglês', nome: 'Charges', status: 'nao_iniciado' },
];