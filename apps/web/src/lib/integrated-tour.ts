import type { LucideIcon } from 'lucide-react'
import {
  Award,
  BookOpen,
  Brain,
  CalendarCheck,
  ClipboardCheck,
  Filter,
  Flame,
  Heart,
  Layers,
  LayoutGrid,
  LineChart,
  Package,
  RotateCcw,
  ScrollText,
  Sprout,
  Target,
  Timer,
  TrendingUp,
  Trophy,
} from 'lucide-react'

/** Incremente quando mudar textos/ordem dos slides para reexibir o tour automaticamente uma vez. */
export const INTEGRATED_TOUR_CONTENT_VERSION = '6'

const STORAGE_KEY = 'broto.integratedTour.v1'
const SESSION_FROM_ONBOARDING = 'broto.integratedTour.fromOnboarding'
const SESSION_REPLAY = 'broto.integratedTour.replay'

export type IntegratedTourStatus = 'in_progress' | 'completed' | 'skipped'

export interface IntegratedTourPersist {
  status: IntegratedTourStatus
  step: number
  contentVersion: string
}

/** Mini-benefícios no rodapé do slide (grid estilo onboarding). */
export interface IntegratedTourHighlight {
  Icon: LucideIcon
  label: string
  hint: string
  /** Cor de destaque — token `--teal-400`, `--gold-400`, etc. */
  accentVar: string
}

export interface IntegratedTourSlide {
  title: string
  body: string
  /** Omitido no layout `note` quando não há ícone decorativo */
  Icon?: LucideIcon
  /** Trechos do `body` repetidos com `<strong>` (case-insensitive na junção). */
  bodyEmphasis?: string[]
  /** Caminho público (ex.: `/carousel1.png`) para arte raster; se definido, substitui o ícone. */
  imageSrc?: string
  /** Texto curto para leitores de tela quando `imageSrc` está definido */
  imageAlt?: string
  /** Variável CSS de cor para o círculo do ícone */
  accentVar: string
  highlights?: IntegratedTourHighlight[]
  /** Layout editorial (sem grid de highlights), ex.: encerramento do tour */
  layout?: 'standard' | 'note'
}

export const INTEGRATED_TOUR_SLIDES: IntegratedTourSlide[] = [
  {
    title: 'Tudo integrado',
    body:
      'Rotina do dia, questões, simulado e seu Broto conversam entre si. O que você pratica alimenta ' +
      'missões, progresso e o mascote — sem caminhos soltos.',
    bodyEmphasis: ['simulado', 'missões', 'progresso', 'mascote'],
    Icon: Layers,
    imageSrc: '/carousel1.png',
    imageAlt:
      'Ilustração: rotina, questões, progresso e mascote Broto conectados em um ciclo integrado',
    accentVar: '--teal-400',
    highlights: [
      {
        Icon: Target,
        label: 'Metas claras',
        hint: 'Rotina alinhada ao que importa para você',
        accentVar: '--gold-400',
      },
      {
        Icon: TrendingUp,
        label: 'Evolução visível',
        hint: 'Prática vira números na home',
        accentVar: '--teal-400',
      },
      {
        Icon: Brain,
        label: 'Estudo organizado',
        hint: 'Áreas e tópicos no mesmo fluxo',
        accentVar: '--status-sky',
      },
      {
        Icon: Heart,
        label: 'Broto com você',
        hint: 'Hábito e motivação integrados',
        accentVar: '--green-500',
      },
    ],
  },
  {
    title: 'Prática por área',
    body:
      'No banco de questões você treina por área e tópico, com filtros de ano e língua quando fizer sentido. ' +
      'O desempenho aparece nos gráficos da home.',
    bodyEmphasis: ['área', 'tópico', 'gráficos'],
    Icon: BookOpen,
    accentVar: '--status-sky',
    highlights: [
      {
        Icon: LayoutGrid,
        label: 'Por área',
        hint: 'Blocos do ENEM no mesmo lugar',
        accentVar: '--area-linguagens',
      },
      {
        Icon: Filter,
        label: 'Filtros úteis',
        hint: 'Ano e idioma quando fizer sentido',
        accentVar: '--status-sky',
      },
      {
        Icon: LineChart,
        label: 'Gráficos',
        hint: 'Respostas viram desempenho',
        accentVar: '--teal-400',
      },
      {
        Icon: BookOpen,
        label: 'Banco vivo',
        hint: 'Questões para treinar com foco',
        accentVar: '--area-humanas',
      },
    ],
  },
  {
    title: 'Simulado estilo ENEM',
    body:
      'Monte sessões no formato prova: blocos de questões, tempo opcional e retorno às respostas. ' +
      'Ideal para sentir o ritmo do exame e medir evolução.',
    bodyEmphasis: ['prova', 'tempo', 'evolução'],
    Icon: ClipboardCheck,
    accentVar: '--gold-400',
    highlights: [
      {
        Icon: Timer,
        label: 'Ritmo de prova',
        hint: 'Cronômetro opcional',
        accentVar: '--gold-500',
      },
      {
        Icon: ClipboardCheck,
        label: 'Formato ENEM',
        hint: 'Blocos e checklist de sessão',
        accentVar: '--teal-400',
      },
      {
        Icon: RotateCcw,
        label: 'Revisão',
        hint: 'Volte às respostas e aprenda',
        accentVar: '--status-sky',
      },
      {
        Icon: Award,
        label: 'Medir evolução',
        hint: 'Sessões que contam no progresso',
        accentVar: '--gold-400',
      },
    ],
  },
  {
    title: 'Broto e consistência',
    body:
      'Seu mascote cresce com o hábito de estudar. Streak e fases refletem constância — ' +
      'a ideia é celebrar quem volta, sem separar “game” do estudo sério.',
    bodyEmphasis: ['Streak', 'fases', '\u201Cgame\u201D'],
    Icon: Sprout,
    accentVar: '--green-500',
    highlights: [
      {
        Icon: Sprout,
        label: 'Cresce com você',
        hint: 'Fases do Broto no ritmo real',
        accentVar: '--green-500',
      },
      {
        Icon: Flame,
        label: 'Constância',
        hint: 'Streak sem pressão tóxica',
        accentVar: '--status-coral',
      },
      {
        Icon: Trophy,
        label: 'Conquistas',
        hint: 'Celebração leve, estudo sério',
        accentVar: '--gold-500',
      },
      {
        Icon: CalendarCheck,
        label: 'Hábito',
        hint: 'Voltar amanhã já vale ouro',
        accentVar: '--teal-400',
      },
    ],
  },
  {
    title: 'Pacotes de estudo',
    body:
      'Em cada área e tópico você encontra pacotes que organizam a revisão: ' +
      'resumos para consolidar ideias, flashcards para memorizar e blocos de prática que conversam com simulado e progresso.',
    bodyEmphasis: ['resumos', 'flashcards', 'pacotes'],
    Icon: Package,
    accentVar: '--area-humanas',
    highlights: [
      {
        Icon: Package,
        label: 'Pacotes guiados',
        hint: 'Trilha por tópico, sem improvisar o que estudar',
        accentVar: '--status-sky',
      },
      {
        Icon: ScrollText,
        label: 'Resumos',
        hint: 'Leitura objetiva antes de partir para as questões',
        accentVar: '--area-matematica',
      },
      {
        Icon: Layers,
        label: 'Flashcards',
        hint: 'Memorização ativa em sessões curtas',
        accentVar: '--gold-400',
      },
      {
        Icon: ClipboardCheck,
        label: 'Prática integrada',
        hint: 'Questões e simulado no mesmo fluxo do pacote',
        accentVar: '--teal-400',
      },
    ],
  },
  {
    title: 'Projeto acadêmico',
    body:
      'O Broto é um trabalho de conclusão de curso (TCC): estamos em versão beta, testando ideias com calma e aprendendo no uso real. ' +
      'Contamos com você para nos dar seus feedbacks e sugestões de melhoria — cada mensagem ajuda a moldar o produto.',
    bodyEmphasis: ['TCC', 'beta', 'feedbacks', 'sugestões'],
    accentVar: '--green-500',
    layout: 'note',
  },
]

export function isIntegratedTourFeatureEnabled(): boolean {
  return import.meta.env.VITE_APP_INTEGRATED_TOUR !== 'false'
}

export function readIntegratedTourPersist(): IntegratedTourPersist | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<IntegratedTourPersist>
    if (
      parsed.status !== 'in_progress' &&
      parsed.status !== 'completed' &&
      parsed.status !== 'skipped'
    ) {
      return null
    }
    const step = typeof parsed.step === 'number' && parsed.step >= 0 ? parsed.step : 0
    const contentVersion =
      typeof parsed.contentVersion === 'string' ? parsed.contentVersion : INTEGRATED_TOUR_CONTENT_VERSION
    return { status: parsed.status, step, contentVersion }
  } catch {
    return null
  }
}

export function writeIntegratedTourPersist(
  state: Omit<IntegratedTourPersist, 'contentVersion'> & { contentVersion?: string },
): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        contentVersion: INTEGRATED_TOUR_CONTENT_VERSION,
      }),
    )
  } catch {
    // ignore
  }
}

/** Chamar após salvar onboarding e antes de `navigate` (inclui fluxo do simulado). */
export function markIntegratedTourTriggerFromOnboarding(): void {
  try {
    window.sessionStorage.setItem(SESSION_FROM_ONBOARDING, '1')
  } catch {
    // ignore
  }
}

/** Em Configurações: ao voltar para a Home, o tour abre do início. */
export function requestIntegratedTourReplay(): void {
  try {
    window.sessionStorage.setItem(SESSION_REPLAY, '1')
  } catch {
    // ignore
  }
}

function readSessionFlag(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function clearSessionFlag(key: string): void {
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    // ignore
  }
}

/**
 * Limpa flags de sessão do tour disparadas por onboarding ou replay em Configurações.
 * Chame ao **fechar** o tour na Home (pular, concluir ou Esc) — não na montagem, para
 * compatibilidade com React Strict Mode (dupla montagem em dev).
 */
export function consumeIntegratedTourSessionTriggers(): void {
  clearSessionFlag(SESSION_FROM_ONBOARDING)
  clearSessionFlag(SESSION_REPLAY)
}

function clampStep(step: number): number {
  const max = Math.max(0, INTEGRATED_TOUR_SLIDES.length - 1)
  if (Number.isNaN(step)) return 0
  return Math.min(max, Math.max(0, step))
}

export interface IntegratedTourResolveOpen {
  open: boolean
  step: number
}

/**
 * Decide se a Home deve abrir o tour na montagem (primeira pintura da rota).
 * Prioridade: replay manual → pós-onboarding → retomar in_progress → migração (sem storage) → versão de conteúdo nova.
 */
export function resolveIntegratedTourOpenOnHomeMount(): IntegratedTourResolveOpen {
  if (!isIntegratedTourFeatureEnabled()) {
    if (readSessionFlag(SESSION_REPLAY)) clearSessionFlag(SESSION_REPLAY)
    if (readSessionFlag(SESSION_FROM_ONBOARDING)) clearSessionFlag(SESSION_FROM_ONBOARDING)
    return { open: false, step: 0 }
  }

  const replay = readSessionFlag(SESSION_REPLAY)
  const fromOnboarding = readSessionFlag(SESSION_FROM_ONBOARDING)
  const persist = readIntegratedTourPersist()

  if (replay) {
    return { open: true, step: 0 }
  }

  if (fromOnboarding) {
    const step =
      persist?.status === 'in_progress' ? clampStep(persist.step) : 0
    return { open: true, step }
  }

  if (!persist) {
    return { open: true, step: 0 }
  }

  if (persist.contentVersion !== INTEGRATED_TOUR_CONTENT_VERSION) {
    return { open: true, step: 0 }
  }

  if (persist.status === 'in_progress') {
    return { open: true, step: clampStep(persist.step) }
  }

  return { open: false, step: 0 }
}
