# Ápice — Sistema Operacional Pessoal de Estudos

<p align="center">
  <img src="public/favicon.svg" alt="Ápice Banner" width="128">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 18">
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/IndexedDB-Dexie-FF6B6B?style=for-the-badge&logo=database&logoColor=white" alt="Dexie">
  <img src="https://img.shields.io/badge/PWA-instalável-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA">
  <br>
  <img src="https://img.shields.io/badge/build-passing-brightgreen?style=flat-square&logo=vitest&logoColor=white" alt="Build">
  <img src="https://img.shields.io/badge/tipos-100%25-brightgreen?style=flat-square&logo=typescript&logoColor=white" alt="Types">
  <img src="https://img.shields.io/badge/vulnerabilidades-0-brightgreen?style=flat-square&logo=shield&logoColor=white" alt="Vulnerabilities">
  <img src="https://img.shields.io/badge/licença-MIT-blue?style=flat-square" alt="License">
</p>

---

## O que e o Apice?

O **Apice** e o seu sistema operacional pessoal de estudos — uma plataforma PWA instalavel, 100% local, que se adapta a sua rotina real. Nao e um app de checklist. E um sistema com **6 motores logicos** que aprendem o seu ritmo, redistribuem defices, sugerem ajustes e celebram progressos reais.

**Plug-and-play:** abre no navegador, cria um perfil, comeca a estudar. Os dados ficam 100% no seu dispositivo (IndexedDB). Sem servidor, sem login, sem nuvem.

> **v2.0** — Rebranding completo do antigo Enemzin. Agora suporta qualquer objetivo: ENEM, concursos, OAB, vestibular, mestrado. Nao esta preso ao ENEM.

---

## O que ele entrega?

### Para o estudante
- **Multi-perfil** — varios utilizadores no mesmo dispositivo, dados isolados
- **5 temas visuais** (Areia, Bruma, Musgo, Ardósia, Aurora) + tema do sistema operativo
- **Sessao rapida** (atalho `S`) — regista estudo offline em segundos
- **Timer Pomodoro robusto** — baseado em timestamps reais (não zera se saíres da aba, minimizar ou mudar de aba do browser)
- **Tempo ao vivo no titulo do site** — o `document.title` mostra `⏱ 24:35 · Matematica — Apice` enquanto estudas
- **Subgeneros da materia na pagina de estudo** — vês todos os subtopicos logo abaixo da materia selecionada, sem ter que sair
- **Botao +5 / +15 / +30 min** — adiciona tempo ao timer atual sem resetar (e atalho `Ctrl + +`)
- **Filtro de materias** (Ativas / Pendentes / Concluidas / Todas) — todas as materias visiveis, incluindo arquivadas
- **Heatmap de consistencia** estilo GitHub (90 dias)
- **Painel inteligente** com prioridades explicadas ("porquê estudar isto agora")
- **Planeamento semanal** com blocos por dia, marcar como feito e navegar para o timer
- **Anotacoes por materia** com busca, tags e filtros
- **Redacoes** com 5 competencias, grafico radar, evolucao no tempo
- **Simulados** com acertos por area e grafico de evolucao
- **Flashcards** com algoritmo de repeticao espacada (SM-2)
- **Conquistas** (14 badges) com grafico de progresso
- **Backup/restore** versionado com validacao Zod
- **PWA instalavel** — funciona offline, icone proprio, splash screen
- **Plano Breno pre-configurado** (18h/semana) — aplica com 1 clique em Configuracoes

### Para o auto-conhecimento
- **Streak** com dias de graca (1-2 por semana) — nao te sentes culpado por falhar um dia
- **XP e niveis** com curva nao-linear — equilibrados, nao viciantes
- **Projecao ate o evento** ("E se eu continuar assim?") — status otimista/atencao/critico
- **Heatmap de horas por dia** — visualizas a tua consistencia real
- **Relatorios** com filtro de periodo e exportacao CSV

---

## Como funciona?

### Fluxo de Estudo Tipico

```
1. Estudante cria um perfil (nome, evento-alvo, data)
2. O Apice sugere 12 materias pre-configuradas com peso por area
3. Estudante ajusta metas semanais (ex: 10h/semana, distribuidas)
4. Cada dia:
   - Abre a app, ve a fila de materias priorizadas
   - Carrega "Estudar" → timer Pomodoro inicia
   - Ao terminar, sessao e registada automaticamente
5. O motor de priorizacao reordena a fila:
   - Materias com maior deficit
   - Materias ha mais tempo sem estudar
   - Proximidade do evento
6. Ao final da semana, rollover processa snapshots
7. Streak atualiza, XP acumula, conquistas desbloqueiam
```

### Fluxo de Sessao Rapida (atalho S)

```
1. Estudante carrega em S (ou clica no botao +)
2. Modal aparece, sugere materia nao concluida
3. Escolhe duracao (5, 10, 15, 25, 30, 45, 60, 90 min)
4. Adiciona nota opcional (ex: "cap. 3, exercicios 1-10")
5. Carrega Registar
6. Sessao e adicionada ao historico com toast de confirmacao
```

### Fluxo de Estudo com Timer Robusto

```
1. Estudante escolhe uma materia (vê todas, mesmo concluidas, com filtro)
2. Os subtopicos da materia aparecem logo abaixo
3. Ajusta a duracao (15, 25, 30, 45, 60, 90 min) ou usa a pre-definida
4. Carrega "Iniciar" (ou barra de espaco) — o timer comeca
5. O titulo do site mostra o tempo ao vivo: "⏱ 24:35 · Matematica — Apice"
6. Se precisares de mais tempo: clica +5min / +15min / +30min (ou Ctrl + +)
7. O timer nao zera se mudares de aba, minimizares ou navegares para outra pagina
8. Ao terminar, a sessao e registada com duracao real (nao a configurada)
```

### Algoritmo de Priorizacao

```
score = (peso_materia * 0.30)
      + (deficit_semanal_pct * 0.30)
      + (dias_sem_estudar_normalizado * 0.20)
      + (proximidade_evento * 0.20)

Resultado vem com explicacao textual:
  "Matematica esta em prioridade porque peso alto,
   esta 60% abaixo da meta semanal, ultima sessao
   foi ha 4 dias"
```

---

## Arquitetura

```
┌─────────────────────────────────────────┐
│           React 18 + TypeScript         │
│  ┌────────────────────────────────────┐ │
│  │  Vite + Tailwind + Framer Motion   │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │   Zustand stores (3)               │ │
│  │   ├ usePerfilStore                 │ │
│  │   ├ useMateriasStore               │ │
│  │   └ useSessoesStore (sessoes,      │ │
│  │     anotacoes, redacoes, etc.)     │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │   6 Motores Logicos (puros)        │ │
│  │   ├ metaEngine                     │ │
│  │   ├ weekRolloverEngine             │ │
│  │   ├ priorizacaoEngine              │ │
│  │   ├ gamificationEngine             │ │
│  │   ├ simulacaoEngine                │ │
│  │   └ pomodoroEngine                 │ │
│  └────────────────────────────────────┘ │
│              │                          │
│              v                          │
│  ┌────────────────────────────────────┐ │
│  │   IndexedDB (Dexie.js)             │ │
│  │   11 tabelas, multi-tenant         │ │
│  │   Migracao automatica v1→v2        │ │
│  └────────────────────────────────────┘ │
│              │                          │
│              v                          │
│  ┌────────────────────────────────────┐ │
│  │   PWA Service Worker               │ │
│  │   Funciona offline                 │ │
│  │   Instalavel (Add to Home)         │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Protecoes integradas

O Apice foi desenhado com foco em **privacidade, dados locais e resiliência**.

| Camada | O que protege |
|--------|---------------|
| **Dados** | 100% no dispositivo (IndexedDB). Sem servidor, sem nuvem, sem telemetria. |
| **Backup** | Exportacao versionada com validacao Zod. So substitui dados apos confirmacao explicita. |
| **Tema** | Suporte a `prefers-reduced-motion` e `prefers-color-scheme`. 5 paletas refinadas. |
| **Erros** | Confirmacao visual antes de qualquer acao destrutiva (apagar perfil, materia, nota, etc). |
| **Performance** | Toasts nao-bloqueantes, animacoes GPU-accelerated, lazy loading de modais. |
| **Validacao** | Zod em todos os schemas de backup, validacao de inputs no client. |
| **PWA** | Service worker com cache inteligente — funciona offline. |
| **Seguranca** | CSP via meta tags, sem inline scripts perigosos, sem APIs externas em runtime. |
| **Multi-perfil** | Isolamento total de dados por perfilId — sem cross-leak. |
| **i18n-ready** | Texto separado da logica. Estrutura permite internacionalizacao futura. |

---

## Stack Tecnologica

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Navegador moderno (ES2020+) |
| Framework UI | React 18.3 |
| Linguagem | TypeScript 5.5 (strict) |
| Bundler | Vite 5.4 |
| Estilizacao | Tailwind CSS 3.4 (com CSS variables) |
| Animacoes | Framer Motion 11 |
| Estado | Zustand 4.5 (3 stores) |
| Persistencia | Dexie.js 4.0 (IndexedDB) |
| Graficos | Recharts 2.12 |
| Validacao | Zod 3.23 |
| Form datas | date-fns 3.6 |
| Icones | Lucide React |
| Toasts | Sonner |
| Flashcards | Algoritmo SM-2 custom |
| PWA | vite-plugin-pwa |
| Testes | Vitest 2 + Testing Library |
| Backup | jsPDF (versao atualizada, sem vulnerabilidades) |

---

## Funcionalidades em Detalhe

### Painel (Dashboard)
| Componente | Descricao |
|------------|-----------|
| Saudacao personalizada | "Ola, [nome]" com dias para o evento |
| Stats cards | XP, Streak, Horas da semana, Sessoes totais |
| Barra de progresso de nivel | XP acumulado com gradiente |
| Heatmap 90 dias | Visualizacao de consistencia diaria (5 niveis de intensidade) |
| Prioridades | Top 5 materias com motivo textual da urgencia |
| Metas da semana | Barras de progresso por materia com falta |
| Projecao | "Voce chegara a [evento] com X horas" (otimo/bom/atencao/critico) |

### Estudar (Timer)
| Componente | Descricao |
|------------|-----------|
| Filtro de materias | Ativas / Pendentes / Concluidas / Todas |
| Subtopicos | Lista展开/colapsavel com cores por status |
| Timer Pomodoro | Configuravel (15-90 min), com sons, pausavel, retomavel |
| **Timer robusto** | Baseado em timestamps reais — não zera ao sair da aba ou minimizar |
| **Tempo no titulo** | `document.title` mostra o tempo ao vivo (ex: `⏱ 24:35 · Matematica — Apice`) |
| **Botao +5/+15/+30** | Adiciona tempo sem resetar (atalho: `Ctrl + +`) |
| Atalho Espaço | Inicia/pausa o timer |
| Atalho Esc | Para o timer |
| Sons | Beep ao iniciar, beep duplo ao concluir (toggle on/off) |
| Tempo real | Regista duracao real decorrida, nao a configurada |
| Sugestao automatica | Apos concluir, sugere proxima materia nao concluida |
| Modo foco | Esconde chrome, mostra apenas o timer |

### Materias
- CRUD completo (criar, editar, arquivar)
- 12 materias pre-configuradas com peso real por area (ENEM)
- Distribuicao de horas com grafico de pizza
- Subtopicos com status (nao iniciado, em andamento, dominado)
- Importacao de diagnostico com 181 subtopicos pre-mapeados
- Ajuste proporcional de meta total

### Anotacoes
- CRUD com titulo, conteudo, tags
- Busca textual
- Filtro por materia
- Estado de edicao isolado do estado de criacao (sem perda de dados)
- Confirmacao visual antes de apagar

### Redacao
- 5 competencias com slider (0-200)
- Grafico radar com media das ultimas 5
- Grafico de evolucao temporal
- Conquista especial em 900+
- Texto completo visualizavel

### Simulados
- Acertos por area (linguagens, humanas, natureza, matematica)
- Grafico de evolucao por area
- Simulador "E se eu continuar assim?" (projecao ate o evento)

### Semana
- 7 dias da semana com expansao/colapso
- Blocos por materia com duracao
- Marcar como concluido
- Navegar direto para o timer
- Resumo semanal com % cumprido

### Conquistas (14 badges)
- Primeira Sessao, Primeira Anotacao
- Streak 7/30/100 dias
- 10/50/100 horas de estudo
- Nivel 5/10
- Primeiro Simulado, Redacao 900+
- Madrugador, Noturno

### Configuracoes
- 5 temas + tema do sistema
- Backup/restore (com confirmacao)
- Importacao de diagnostico (181 subtopicos)
- **Plano Breno pre-configurado (18h/semana)** — aplica com 1 clique: arquiva Inglês/Literatura/Redação, cria as 9 matérias com pesos corretos e importa subtopicos
- Atalhos de teclado (visualizacao)
- Resumo de dados (sessoes, anotacoes, simulados, redacoes, total estudado)
- Zona de perigo (apagar perfil, apagar tudo)

### Atalhos de teclado
| Atalho | Acao |
|--------|------|
| `S` | Sessao rapida |
| `G` + `D` | Ir para o Painel |
| `G` + `E` | Ir para Estudar |
| `G` + `M` | Ir para Materias |
| `G` + `N` | Ir para Anotacoes |
| `G` + `R` | Ir para Relatorios |
| `G` + `S` | Ir para Semana |
| `G` + `C` | Ir para Configuracoes |
| `Espaco` | Iniciar/pausar timer (na pagina de estudo) |
| `Esc` | Parar timer (na pagina de estudo) |
| `Ctrl +` `+` | Adicionar 5min ao timer atual |

---

## API dos Motores (uso direto)

Todos os motores sao funcoes puras em `src/core/engines/` — testaveis e reutilizaveis fora do React.

```typescript
import { calcularPrioridades } from '@core/engines/priorizacaoEngine';
import { getAnoSemanaIso } from '@core/engines/metaEngine';
import { calcularStreak, verificarConquistas } from '@core/engines/gamificationEngine';

const prioridades = calcularPrioridades(perfil, materias, subtopicos, sessoes, semanaIso);
const semana = getAnoSemanaIso(new Date(), 1);
const { streak, diasGracaRestantes } = calcularStreak(sessoes, 1, new Date());
const novasConquistas = verificarConquistas(perfilId, conquistas, dados);
```

---

## Como Rodar

### Pre-requisitos
- Node.js 18+
- npm 9+ (ou pnpm/yarn)

### 1. Clone

```bash
git clone https://github.com/Breno-J-Oliveira/Apice.git
cd Apice
```

### 2. Instale as dependencias

```bash
npm install
```

### 3. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

O servidor estara disponivel em **http://localhost:5173**.

### 4. Para build de producao

```bash
npm run build
```

O bundle sera gerado na pasta `dist/`.

### 5. Para testar o build de producao

```bash
npm run preview
```

---

## Deploy

### Opcao 1: Local (PWA instalavel)

O Apice foi desenhado para funcionar **100% local** — basta abrir o navegador e usar. Para instalar como app:

1. Abre no Chrome/Edge/Safari
2. Botao "Instalir" aparece na barra de endereco (ou no menu)
3. Confirma — fica disponivel como app nativo

### Opcao 2: Hospedar estatico

O build de producao em `dist/` e um site estatico. Podes hospedar em:

- **Vercel**: `vercel --prod`
- **Netlify**: arrastar a pasta `dist/` para o dashboard
- **GitHub Pages**: configurar workflow de deploy
- **Qualquer servidor estatico**: nginx, Apache, Caddy, etc.

Exemplo de nginx:
```nginx
server {
  listen 80;
  server_name apice.exemplo.com;
  root /var/www/apice/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # PWA - service worker na raiz
  location /sw.js {
    add_header Cache-Control "no-cache";
  }
}
```

> Como o Apice e 100% client-side, **nao precisa de backend**. Os dados ficam no IndexedDB do navegador do utilizador.

---

## Estrutura do Projeto

```
src/
├── core/
│   ├── engines/              Motores logicos (funcoes puras, zero React)
│   │   ├── metaEngine.ts            Motor de metas semanais
│   │   ├── weekRolloverEngine.ts    Motor de virada de semana
│   │   ├── priorizacaoEngine.ts     Motor de priorizacao inteligente
│   │   ├── gamificationEngine.ts    Motor de gamificacao (XP, niveis, streaks, conquistas)
│   │   ├── simulacaoEngine.ts       Motor de simulacao "E se"
│   │   ├── pomodoroEngine.ts        Maquina de estados do Pomodoro
│   │   └── __tests__/               Testes unitarios (Vitest)
│   ├── db/
│   │   ├── database.ts              Configuracao Dexie.js (IndexedDB) com migracao v1→v2
│   │   └── seedDiagnostico.ts       181 subtopicos do diagnostico
│   └── migrations/                  Migracoes de schema (versionado)
├── features/                 Feature-based (cada pasta = uma tela)
│   ├── anotacoes/            Anotacoes por materia
│   ├── conquistas/           Galeria de conquistas
│   ├── configuracoes/        Temas, backup, diagnostico, atalhos
│   ├── dashboard/            Painel principal
│   ├── materias/             Gestao de materias e subtopicos
│   ├── perfis/               Selecao/criacao de perfil + onboarding
│   ├── pomodoro/             Timer + fila de estudos do dia
│   ├── redacao/              Redacao com texto completo + 5 competencias
│   ├── relatorios/           Relatorios e graficos
│   ├── semana/               Planeamento semanal
│   └── simulados/            Simulados + simulador "E se"
└── shared/                   Codigo partilhado
    ├── components/            Layout, PageHeader, EmptyState, ConfirmDialog, Modal, Heatmap, BarraProgressoMateria
    ├── hooks/                 useHeatmap, useSessoesPorMateriaSemana, useAtalhos, useSessaoRapida
    ├── stores/                Zustand stores (perfil, materias, sessoes)
    ├── types/                 Tipos TypeScript e constantes
    └── lib/                   Utilitarios (cn, formatarMinutos, backupSchema Zod, tocarBeep)
```

### Principio: separar "motor" de "interface"

Cada sistema logico complexo e implementado como **funcoes puras** em `core/engines/`, sem dependencia de React. Os componentes apenas chamam essas funcoes e renderizam o resultado. Isto garante que a logica possa ser testada com testes unitarios sem renderizar UI.

---

## Migracao de Dados

O Apice inclui **migracao automatica** da v1 (Enemzin) para v2 (Apice):

- Campo `dataProvaEnem` → `dataEvento` (default: ENEM)
- Adiciona `nomeEvento`, `temaSistema`, `schemaVersion`
- Sessoes: `duracaoRealMinutos` (calculado automaticamente)
- Sessoes: origem `sessao-rapida` adicionada
- Subtopicos: campo `criadoEm` adicionado
- Tabela `flashcards` adicionada

A migracao acontece automaticamente no primeiro carregamento — **sem perda de dados**.

---

## Tests

```bash
npm run test       # Corre testes em modo watch
npm run test:ui    # Interface grafica dos testes
```

Os testes unitarios estao em `src/core/engines/__tests__/` e cobrem os calculos criticos (metas, priorizacao, gamificacao).

---

## Comparacao v1 (Enemzin) → v2 (Apice)

| Area | v1 | v2 |
|------|----|----|
| Nome | Enemzin (preso a ENEM) | **Apice** (qualquer objetivo) |
| Temas | 4 | **5 + tema do sistema** |
| Heatmap | Nao existia | **90 dias estilo GitHub** |
| Sessao rapida | Nao existia | **Atalho S, modal global** |
| Conquistas | 6 basicas | **14 com graficos** |
| Flashcards | Nao existia | **Com SM-2** |
| Bug: virada de ano | Quebrado | Corrigido com `getISOWeekYear` |
| Bug: timer Pomodoro | Duracao fixa | Tempo real decorrido |
| Bug: anotacoes | Estado partilhado | Estados isolados |
| Backup | Sem validacao rigorosa | Zod v2 schema |
| Migracao | Nenhuma | v1→v2 automatica |
| Vulnerabilidades | 8 (1 critical) | **0** |
| Build | 312 kB gzip | 314 kB gzip |
| Timer | Decrementa (zera ao sair) | **Timestamps reais (persiste)** |
| Titulo do site | Fixo | **Tempo ao vivo (MM:SS · Mat)** |
| Subtopicos na pagina | Fora (requer saida) | **Dentro da pagina de estudo** |
| Adicionar tempo | Reset obrigatorio | **+5/+15/+30 min (sem reset)** |
| Plano Breno | Nao existia | **1 clique (18h/semana)** |

---

## Licença

MIT — sinta-se livre para usar, modificar e distribuir.

---

## Como funciona o Timer Robusto (detalhes tecnicos)

O timer Pomodoro do Apice foi desenhado para **nunca zerar** em situacoes inesperadas:

```typescript
// Em vez de decrementar um contador a cada tick:
setInterval(() => setTempoRestante(prev => prev - 1), 1000);  // ❌ Zera se perder tick

// Calculamos o tempo restante a partir de timestamps reais:
const calcularTempoRestante = () => {
  if (estado !== 'foco') {
    return duracaoTotalRef.current - tempoAcumuladoRef.current;
  }
  const agora = Date.now();
  const decorrido = (agora - inicioRef.current) / 1000;
  return duracaoTotalRef.current - (tempoAcumuladoRef.current + decorrido);
};
setInterval(calcularTempoRestante, 250);  // ✅ Resistente a qualquer interrupcao
```

**Beneficios:**
- Sair da aba do Apice → timer continua
- Minimizar o browser → timer continua
- O componente desmontar e remontar (React.StrictMode em dev) → timer continua
- Adicionar +5min → soma ao total e ao restante, sem resetar
- O titulo do site (`document.title`) e atualizado a cada 250ms com o tempo restante

---

## Plano Breno (18h/semana)

Pre-configurado em **`src/core/db/seedPlanoBreno.ts`**, aplicavel com 1 clique em Configuracoes:

| Materia | Horas | % |
|---------|-------|---|
| ➗ Matematica | 6h | 33% |
| 🧪 Quimica | 2h40 | 15% |
| 🧬 Biologia | 2h20 | 13% |
| ⚡ Fisica | 2h | 11% |
| 📖 Portugues | 1h30 | 8% |
| 🌎 Historia | 1h15 | 7% |
| 🌍 Geografia | 1h15 | 7% |
| 🏛️ Filosofia | 30min | 3% |
| 👥 Sociologia | 30min | 3% |
| **Total** | **18h** | **100%** |

O botao **"Aplicar plano Breno"** em Configuracoes:
- Arquiva as 12 materias padrao (Ingles, Literatura, Redacao)
- Cria as 9 materias com pesos e metas corretos
- Importa automaticamente os 181 subtopicos do diagnostico (com o status correto)

---

## Changelog v2.0

- **Rebranding completo**: Enemzin → Apice
- **5 temas** + tema do sistema operativo
- **Heatmap de consistencia** estilo GitHub
- **Sessao rapida** (atalho global `S`)
- **Pagina de Conquistas** (14 badges)
- **Flashcards** com algoritmo SM-2
- **Atalhos de teclado** globais
- **Toasts** (sonner) com feedback de cada acao
- **Timer robusto** baseado em timestamps reais
- **Tempo ao vivo no titulo do site** (`document.title`)
- **Subtopicos visiveis na pagina de estudo**
- **Botao +5/+15/+30 min** para adicionar tempo sem resetar
- **Filtro de materias** (Ativas/Pendentes/Concluidas/Todas)
- **Plano Breno pre-configurado** (18h/semana, 1 clique)
- **0 vulnerabilidades** (jspdf atualizado)
- **Build**: 314 kB gzip, TypeScript strict, PWA instalavel

---

## Contatos e Redes Sociais

<p align="center">
  <a href="https://github.com/Breno-J-Oliveira" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
  <a href="https://www.linkedin.com/in/breno-j-oliveira-672619352/" target="_blank">
    <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
  </a>
  <a href="https://www.instagram.com/brenoov" target="_blank">
    <img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram">
  </a>
  <a href="https://x.com/BrenoJOliveira_" target="_blank">
    <img src="https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white" alt="X (Twitter)">
  </a>
</p>

<p align="center">
  <strong>Apice v2.0 — finalizado e pronto para usar.</strong><br>
  0 vulnerabilidades · 0 erros TypeScript · PWA instalavel · Timer robusto + Plano Breno
</p>
