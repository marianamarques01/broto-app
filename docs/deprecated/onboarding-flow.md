# Onboarding Flow - Broto

> Documento de planejamento UX/UI para o novo fluxo de onboarding.
> Aplica-se a **Web** e **Mobile** (Expo).

---

## Visao Geral

O onboarding e um wizard multi-step que coleta dados essenciais para personalizar a experiencia de estudo do aluno. O fluxo culmina com a opcao de um **simulado diagnostico** (5 questoes por area) para gerar indicadores iniciais de performance.

### Principios de Design

- **Progressivo**: cada step coleta 1 tipo de informacao — sem overload
- **Visual**: uso intenso de icones, cores das areas, e animacoes sutis
- **Rapido**: 6 steps + simulado opcional = ~3min sem simulado, ~15min com
- **Motivacional**: tom de conversa, nao de formulario
- **Skippable**: botao "Pular" disponivel, mas a experiencia recompensa quem completa

---

## Arquitetura dos Steps

```
Step 1 — Boas-vindas
Step 2 — Objetivo (Faculdade + Curso)
Step 3 — Meta de Nota
Step 4 — Nivel por Area do Conhecimento
Step 5 — Disponibilidade (Horas/dia + Preferencia de horario)
Step 6 — Resumo + Simulado Diagnostico (opcional)
       └── Simulado: 20 questoes (5 por area)
Step 7 — Conclusao (Broto nasce!)
```

---

## Step 1 — Boas-vindas

**Objetivo**: Recepcionar e dar contexto sobre o que sera coletado.

### Layout

```
┌─────────────────────────────────┐
│                                 │
│           🌱                    │
│      (icone grande, animado     │
│       com pulse glow verde)     │
│                                 │
│   "Ola, {nome}!"               │
│   font-display, 2xl, bold      │
│                                 │
│   "Vamos montar seu plano de    │
│    estudos personalizado.       │
│    Sao so algumas perguntas     │
│    rapidas!"                    │
│   font-sans, sm, text-secondary │
│                                 │
│                                 │
│   [ Vamos la! ]  (BrotoCtaBtn) │
│                                 │
│   "Pular configuracao"          │
│   text-muted, xs               │
│                                 │
│   ● ○ ○ ○ ○ ○   (progress)     │
└─────────────────────────────────┘
```

### Dados coletados
Nenhum — apenas navegacao.

---

## Step 2 — Objetivo (Faculdade + Curso)

**Objetivo**: Entender a motivacao e meta do aluno.

### Layout

```
┌─────────────────────────────────┐
│  ← (voltar)        Pular →     │
│                                 │
│   🎓                            │
│                                 │
│   "Qual seu objetivo?"          │
│   font-display, xl             │
│                                 │
│   "Saber o curso ajuda a gente │
│    focar no que importa"        │
│   text-secondary, sm           │
│                                 │
│   ┌─────────────────────────┐   │
│   │ 🔍 Buscar faculdade...  │   │
│   └─────────────────────────┘   │
│   (autocomplete/searchable)     │
│                                 │
│   ou digitar manualmente:       │
│   ┌─────────────────────────┐   │
│   │ Nome da faculdade       │   │
│   └─────────────────────────┘   │
│                                 │
│   ┌─────────────────────────┐   │
│   │ Curso desejado          │   │
│   └─────────────────────────┘   │
│                                 │
│   Opcoes rapidas (chips):       │
│   [Medicina] [Direito]          │
│   [Engenharia] [Outro]          │
│                                 │
│   [ Continuar → ]              │
│                                 │
│   ● ● ○ ○ ○ ○                  │
└─────────────────────────────────┘
```

### Dados coletados
```typescript
{
  objetivo_faculdade: string | null   // ex: "USP", "UFMG"
  objetivo_curso: string | null       // ex: "Medicina", "Direito"
}
```

### Notas UX
- Chips de cursos populares para quick-select
- Campo de faculdade opcional — muitos alunos ainda nao decidiram
- Autocomplete pode vir de lista estatica inicial (top 50 universidades)

---

## Step 3 — Meta de Nota

**Objetivo**: Definir nota-alvo no ENEM para calibrar dificuldade e urgencia.

### Layout

```
┌─────────────────────────────────┐
│  ← (voltar)        Pular →     │
│                                 │
│   🎯                            │
│                                 │
│   "Qual sua meta de nota?"      │
│   font-display, xl             │
│                                 │
│   "A nota media do ENEM e 500.  │
│    Medicina pede ~780+."        │
│   text-secondary, sm           │
│                                 │
│   ┌─────────────────────────┐   │
│   │                         │   │
│   │      [ 700 ]            │   │
│   │   font-display, 4xl     │   │
│   │   cor muda conforme     │   │
│   │   o valor (verde→ouro)  │   │
│   │                         │   │
│   │   ──────●───────────    │   │
│   │   400        900        │   │
│   │   (Slider)              │   │
│   │                         │   │
│   └─────────────────────────┘   │
│                                 │
│   Referencia por curso:         │
│   ┌─────────────────────────┐   │
│   │ Medicina      ~780      │   │
│   │ Direito       ~720      │   │
│   │ Engenharia    ~700      │   │
│   │ Pedagogia     ~600      │   │
│   └─────────────────────────┘   │
│   (mini-cards com nota media    │
│    de corte dos cursos, baseado │
│    no curso escolhido no step2  │
│    fica highlighted)            │
│                                 │
│   [ Continuar → ]              │
│                                 │
│   ● ● ● ○ ○ ○                  │
└─────────────────────────────────┘
```

### Dados coletados
```typescript
{
  meta_nota: number  // 400-900, step 10
}
```

### Notas UX
- Slider com feedback visual — o numero grande muda de cor conforme sobe
  - 400-550: `text-muted` (cinza)
  - 550-700: `green-500` (verde)
  - 700-800: `gold-500` (dourado)
  - 800-900: `violet-500` (roxo, elite)
- Se o aluno escolheu curso no step 2, highlight a referencia daquele curso
- Haptic feedback no mobile ao mover slider

---

## Step 4 — Nivel por Area do Conhecimento

**Objetivo**: Auto-avaliacao do aluno em cada uma das 4 areas do ENEM.

### Layout

```
┌─────────────────────────────────┐
│  ← (voltar)        Pular →     │
│                                 │
│   📊                            │
│                                 │
│   "Como voce se avalia?"        │
│   font-display, xl             │
│                                 │
│   "Seja honesto — isso ajuda    │
│    a criar sua rotina ideal"    │
│   text-secondary, sm           │
│                                 │
│   ┌─ Linguagens ────────────┐   │
│   │ 📖  [Iniciante]         │   │
│   │     [Intermediario]      │   │
│   │     [Avancado]           │   │
│   │  cor: blue-500           │   │
│   └─────────────────────────┘   │
│                                 │
│   ┌─ Ciencias Humanas ─────┐   │
│   │ 🌍  [Iniciante]         │   │
│   │     [Intermediario]      │   │
│   │     [Avancado]           │   │
│   │  cor: amber-500          │   │
│   └─────────────────────────┘   │
│                                 │
│   ┌─ Ciencias da Natureza ─┐   │
│   │ 🧪  [Iniciante]         │   │
│   │     [Intermediario]      │   │
│   │     [Avancado]           │   │
│   │  cor: green-500          │   │
│   └─────────────────────────┘   │
│                                 │
│   ┌─ Matematica ───────────┐   │
│   │ 🔢  [Iniciante]         │   │
│   │     [Intermediario]      │   │
│   │     [Avancado]           │   │
│   │  cor: violet-500         │   │
│   └─────────────────────────┘   │
│                                 │
│   [ Continuar → ]              │
│                                 │
│   ● ● ● ● ○ ○                  │
└─────────────────────────────────┘
```

### Dados coletados
```typescript
{
  nivel_linguagens: 'iniciante' | 'intermediario' | 'avancado'
  nivel_humanas: 'iniciante' | 'intermediario' | 'avancado'
  nivel_natureza: 'iniciante' | 'intermediario' | 'avancado'
  nivel_matematica: 'iniciante' | 'intermediario' | 'avancado'
}
```

### Notas UX
- Cada area usa sua cor do design system (AREA_CONFIG)
- Selecao estilo "segmented control" (3 opcoes lado a lado)
- Opcao selecionada ganha fundo com `glow` da area + borda `color`
- Opcoes nao selecionadas ficam com bg `bg-deep` e texto `text-muted`
- Padrao: nenhuma selecionada (usuario deve escolher)
- Card de cada area tem borda esquerda com a cor da area

---

## Step 5 — Disponibilidade

**Objetivo**: Horas diarias + preferencia de turno para gerar rotina.

### Layout

```
┌─────────────────────────────────┐
│  ← (voltar)        Pular →     │
│                                 │
│   ⏰                            │
│                                 │
│   "Quanto tempo voce tem?"      │
│   font-display, xl             │
│                                 │
│   "Vamos adaptar tudo ao        │
│    seu ritmo"                   │
│   text-secondary, sm           │
│                                 │
│   Horas por dia:                │
│   font-sans-medium, sm         │
│                                 │
│   [1h] [2h] [3h] [4h] [5h+]   │
│   (pills, green-500 quando      │
│    selecionado)                 │
│                                 │
│                                 │
│   Melhor horario pra estudar:   │
│   font-sans-medium, sm         │
│                                 │
│   ┌──────┐ ┌──────┐ ┌──────┐   │
│   │  🌅  │ │  ☀️  │ │  🌙  │   │
│   │Manha │ │Tarde │ │Noite │   │
│   └──────┘ └──────┘ └──────┘   │
│   (cards selecionaveis,         │
│    multipla selecao)            │
│                                 │
│                                 │
│   Data do ENEM (opcional):      │
│   ┌─────────────────────────┐   │
│   │ Selecionar data         │   │
│   └─────────────────────────┘   │
│   "Ajuda a calcular quanto      │
│    tempo falta"                 │
│   text-muted, xs               │
│                                 │
│   [ Continuar → ]              │
│                                 │
│   ● ● ● ● ● ○                  │
└─────────────────────────────────┘
```

### Dados coletados
```typescript
{
  horas_disponiveis_por_dia: number        // 1-5+
  preferencia_horario: ('manha' | 'tarde' | 'noite')[]
  data_enem: string | null                 // ISO date
}
```

### Notas UX
- Pills de horas: estilo identico ao atual da web (broto-hour-pill)
- Cards de horario: selecao multipla (aluno pode estudar manha E noite)
- Card selecionado: borda `green-500`, fundo `green-glow`
- Data do ENEM: mantemos como opcional com hint explicativo

---

## Step 6 — Resumo + Simulado Diagnostico

**Objetivo**: Mostrar resumo das escolhas e oferecer simulado inicial.

### Layout

```
┌─────────────────────────────────┐
│  ← (voltar)                    │
│                                 │
│   ✨                            │
│                                 │
│   "Tudo pronto!"               │
│   font-display, xl             │
│                                 │
│   "Veja seu resumo:"           │
│   text-secondary, sm           │
│                                 │
│   ┌─────────────────────────┐   │
│   │ 🎓 Medicina — USP       │   │
│   │ 🎯 Meta: 780 pontos     │   │
│   │ ⏰ 3h/dia — Manha/Noite │   │
│   │ 📅 ENEM: 02/11/2026     │   │
│   └─────────────────────────┘   │
│   (card resumo com bg-card,     │
│    borda border-default)        │
│                                 │
│   Niveis por area:              │
│   ┌────┐┌────┐┌────┐┌────┐     │
│   │LCT ││HUM ││NAT ││MAT │     │
│   │ ●● ││ ●  ││●●● ││ ●● │     │
│   │Int ││Ini ││Ava ││Int │     │
│   └────┘└────┘└────┘└────┘     │
│   (mini cards com cor da area,  │
│    dots indicam nivel)          │
│                                 │
│                                 │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                 │
│   ┌─────────────────────────┐   │
│   │ 🧠                      │   │
│   │ "Quer fazer um simulado │   │
│   │  diagnostico?"           │   │
│   │                          │   │
│   │ "5 questoes de cada area │   │
│   │  (~15 min). Com isso,    │   │
│   │  seu plano fica ainda    │   │
│   │  mais preciso!"          │   │
│   │                          │   │
│   │ [Fazer simulado] (CTA)   │   │
│   └─────────────────────────┘   │
│   (card especial com            │
│    bg-elevated, borda gold-500  │
│    glow dourado sutil)          │
│                                 │
│   [ Comecar sem simulado ]     │
│   (botao secundario, outline)   │
│                                 │
│   ● ● ● ● ● ●                  │
└─────────────────────────────────┘
```

### Dados coletados
Nenhum novo — decisao de rota (simulado ou direto pro app).

### Notas UX
- O card do simulado deve se destacar visualmente (borda dourada, glow)
- Estimativa de tempo "~15 min" ajuda na decisao
- Botao "Comecar sem simulado" nao e "pular" — e valido, sem culpa
- Se clicar em "Fazer simulado", vai pro fluxo de simulado antes de finalizar

---

## Simulado Diagnostico (Opcional)

**Objetivo**: Coletar dados reais de performance para calibrar rotina e indicadores.

### Estrutura
- **20 questoes**: 5 de cada area do conhecimento
- Questoes selecionadas com dificuldade mista (facil, media, dificil)
- Mesma UI do player de questoes existente (`/study/questions`)
- Timer opcional (sem pressao, mas mostra quanto tempo levou)

### Layout do Simulado

```
┌─────────────────────────────────┐
│  Simulado Diagnostico    5/20   │
│  ━━━━━━━━━━━━━━━●━━━━━━━━━━━━  │
│  (progress bar colorida por     │
│   area: 1-5 blue, 6-10 amber,  │
│   11-15 green, 16-20 violet)   │
│                                 │
│  ┌─ Linguagens ─────────────┐  │
│  │                           │  │
│  │  (Enunciado da questao)   │  │
│  │                           │  │
│  │  ○ A) Alternativa 1       │  │
│  │  ● B) Alternativa 2       │  │
│  │  ○ C) Alternativa 3       │  │
│  │  ○ D) Alternativa 4       │  │
│  │  ○ E) Alternativa 5       │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  [ Proxima → ]                  │
│                                 │
└─────────────────────────────────┘
```

### Apos concluir

```
┌─────────────────────────────────┐
│                                 │
│   🎉                            │
│                                 │
│   "Simulado concluido!"        │
│   font-display, xl             │
│                                 │
│   Resultado por area:           │
│                                 │
│   Linguagens      3/5  ████░   │
│   cor: blue-500                 │
│                                 │
│   C. Humanas      2/5  ██░░░   │
│   cor: amber-500                │
│                                 │
│   C. Natureza     4/5  █████   │
│   cor: green-500                │
│                                 │
│   Matematica      1/5  █░░░░   │
│   cor: violet-500               │
│                                 │
│   "Seu plano foi ajustado com   │
│    base nos resultados!"        │
│   text-secondary, sm           │
│                                 │
│   [ Comecar a estudar 🌱 ]     │
│                                 │
└─────────────────────────────────┘
```

### Dados coletados
```typescript
{
  diagnostico_respostas: Array<{
    question_id: string
    area: string
    resposta: string
    correta: boolean
    tempo_segundos: number
  }>
  diagnostico_resultado: {
    linguagens: { acertos: number, total: 5 }
    humanas: { acertos: number, total: 5 }
    natureza: { acertos: number, total: 5 }
    matematica: { acertos: number, total: 5 }
  }
}
```

---

## Componente: Progress Indicator

Barra de progresso visivel em todos os steps (exceto step 1 welcome e resultado do simulado).

```
● ● ● ○ ○ ○     (dots)
━━━━━━━━━░░░░░   (ou barra continua)
```

### Specs
- **Tipo**: Dots (mobile) / Barra continua (web)
- **Cor ativo**: `green-500`
- **Cor inativo**: `bg-elevated`
- **Posicao**: Bottom do container no mobile, top no web
- **Animacao**: Dot cresce com spring ao ativar (mobile)

---

## Navegacao e Persistencia

### Navegacao
- **Voltar**: Sempre disponivel (exceto step 1)
- **Pular**: Disponivel em steps 2-5 (pula pro proximo step)
- **Pular tudo**: Disponivel no step 1 (vai direto pro app com defaults)
- **Gestos**: Swipe horizontal para navegar (mobile)

### Persistencia
- Estado local durante o wizard (useState/useReducer)
- **Salva tudo de uma vez** ao final (step 6 "Comecar" ou apos simulado)
- Se o app fechar no meio, o onboarding recomexa (sem dados parciais)

### API
```typescript
// PATCH /api/user/profile
{
  onboarding_done: true,
  objetivo_faculdade: string | null,
  objetivo_curso: string | null,
  meta_nota: number | null,
  nivel_linguagens: 'iniciante' | 'intermediario' | 'avancado' | null,
  nivel_humanas: 'iniciante' | 'intermediario' | 'avancado' | null,
  nivel_natureza: 'iniciante' | 'intermediario' | 'avancado' | null,
  nivel_matematica: 'iniciante' | 'intermediario' | 'avancado' | null,
  horas_disponiveis_por_dia: number,
  preferencia_horario: string[],
  data_enem: string | null,
}
```

---

## Alteracoes no Banco de Dados

### Nova migration: `add_onboarding_fields`

```sql
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS objetivo_faculdade  text,
  ADD COLUMN IF NOT EXISTS objetivo_curso      text,
  ADD COLUMN IF NOT EXISTS meta_nota           integer,
  ADD COLUMN IF NOT EXISTS nivel_linguagens    text,
  ADD COLUMN IF NOT EXISTS nivel_humanas       text,
  ADD COLUMN IF NOT EXISTS nivel_natureza      text,
  ADD COLUMN IF NOT EXISTS nivel_matematica    text,
  ADD COLUMN IF NOT EXISTS preferencia_horario text[] DEFAULT '{}';
```

### Validacoes
- `meta_nota`: CHECK between 400 and 900
- `nivel_*`: CHECK in ('iniciante', 'intermediario', 'avancado')
- `horas_disponiveis_por_dia`: ja existe, range 1-8

---

## Diferenxas Web vs Mobile

| Aspecto | Web | Mobile |
|---------|-----|--------|
| Layout | Card centralizado (broto-auth style) | Fullscreen com scroll |
| Progress | Barra continua no topo | Dots no bottom |
| Navegacao | Botoes ←/→ | Swipe + botoes |
| Animacoes | CSS transitions + Firefly bg | Reanimated + spring |
| Slider (meta) | Input range nativo | @react-native-community/slider |
| Date picker | Input type=date | DateTimePicker modal |
| Autocomplete | Dropdown HTML | FlatList + TextInput |
| Simulado | Reutiliza QuestionPlayer | Reutiliza QuestionPlayer mobile |

---

## Mapa de Componentes

### Compartilhados (logica em @broto/shared)
- `OnboardingData` (type) — schema dos dados coletados
- `CURSOS_POPULARES` — lista de cursos para chips
- `NOTAS_REFERENCIA` — notas de corte por curso
- `NivelArea` — type union

### Web (apps/web)
- `OnboardingWizard` — container do wizard
- `OnboardingStep` — wrapper de cada step
- `OnboardingProgress` — barra de progresso
- `StepWelcome`, `StepObjetivo`, `StepMeta`, `StepNivel`, `StepDisponibilidade`, `StepResumo`
- `DiagnosticoQuiz` — player do simulado diagnostico

### Mobile (apps/mobile)
- `OnboardingWizard` — container com Animated.View + gestures
- `OnboardingStep` — wrapper com safe area
- `OnboardingDots` — indicador de progresso (dots)
- `StepWelcome`, `StepObjetivo`, `StepMeta`, `StepNivel`, `StepDisponibilidade`, `StepResumo`
- `DiagnosticoQuiz` — player do simulado diagnostico

---

## Fluxo de Dados (Resumo)

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Step 1  │────→│  Step 2  │────→│  Step 3  │
│ Welcome  │     │ Objetivo │     │  Meta    │
└──────────┘     └──────────┘     └──────────┘
                                       │
                                       ▼
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Step 6  │←────│  Step 5  │←────│  Step 4  │
│  Resumo  │     │ Horas    │     │  Nivel   │
└──────────┘     └──────────┘     └──────────┘
      │
      ├──→ [Fazer simulado] ──→ Simulado (20q) ──→ Resultado ──→ Home
      │
      └──→ [Comecar sem simulado] ──→ Home
```

---

## Tokens de Design Usados

| Token | Uso no Onboarding |
|-------|-------------------|
| `colors.bg.deep` | Fundo principal dos steps |
| `colors.bg.card` | Cards de conteudo |
| `colors.bg.elevated` | Card do simulado, opcoes nao selecionadas |
| `colors.green.500` | Progresso, selecao, CTA |
| `colors.green.glow` | Hover/selecao de cards |
| `colors.gold.500` | Destaque do simulado, notas altas |
| `colors.gold.glow` | Background card simulado |
| `colors.blue.500` | Area Linguagens |
| `colors.amber.500` | Area Humanas |
| `colors.violet.500` | Area Matematica |
| `colors.text.primary` | Titulos e labels |
| `colors.text.secondary` | Subtitulos e hints |
| `colors.text.muted` | Link "Pular", textos opcionais |
| `fonts.display` | Titulos de step |
| `fonts.sans` | Corpo de texto |
| `fonts.sansBold` | Labels de campos |
| `BrotoCtaButton` | Botao principal de avancar |
| `radii.sm (12)` | Cards e inputs |
| `radii.full` | Pills de horas |

---

## Codigo da Turma

O campo de codigo da turma (presente no onboarding atual da web) sera movido para **fora do onboarding** — acessivel via menu/perfil ou deep link. Isso simplifica o wizard e foca na experiencia pessoal do aluno.

---

## Prioridade de Implementacao

1. **Migration DB** — adicionar colunas novas na tabela users
2. **Types em @broto/shared** — OnboardingData, NivelArea, etc.
3. **Mobile** — Wizard completo (steps 1-6 + simulado)
4. **Web** — Wizard completo (mesma logica, UI adaptada)
5. **Edge function** — Atualizar user-profile para aceitar novos campos
6. **Simulado** — Endpoint para buscar 5 questoes por area + salvar respostas