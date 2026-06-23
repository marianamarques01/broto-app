/** Motor de decisão do banco (web em QuestionBankView). O mobile pode reutilizar esta função pura com o mesmo catálogo + erros recentes. */
import { parseQuestionId } from '../mock-exam/parse-question-id'
import { getQuestionId } from '../types/question'
import type { AreaStat, TopicoStat } from '../types/dashboard-progress'
import type { QuestionBankRow } from '../types/question-bank-row'
import type { RecentMistakeItem } from '../types/recent-mistakes'
import {
  MISTAKE_PRIORITY_MULTIPLIER,
} from '../ai/student-model/mistake-classifier'
import { areaKeyFromTopico } from '../lib/topico-to-area'
import {
  Q_BANK_RECENT_MISTAKE_DAYS,
  Q_BANK_TRACK_ROW_LIMIT,
  Q_BANK_WEAK_ACCURACY_PCT_MAX,
  Q_BANK_WEAK_QUESTIONS_PER_TOPIC,
  Q_BANK_WEAK_TOPIC_CAP,
  Q_BANK_WEAK_TOPIC_MIN_ANSWERS,
} from './priority-config'

export type QuestionBankSuggestionReason =
  | { kind: 'mistake'; createdAt: string }
  | { kind: 'weak'; topicoLabel: string; accuracyPct: number; pKnow?: number }
  | { kind: 'new'; topicoLabel: string }
  | { kind: 'cold'; topicoLabel: string }

export type QuestionBankSuggestedRow = QuestionBankRow & {
  reason: QuestionBankSuggestionReason
}

export type QuestionBankTrackId = 'mistakes' | 'weak' | 'newTopics' | 'freeExplore'

export interface QuestionBankPracticeTrack {
  id: QuestionBankTrackId
  title: string
  description: string
  rows: QuestionBankSuggestedRow[]
  emptyHint: string
}

export interface QuestionBankPrimaryAction {
  headline: string
  subline: string
  trustLine: string
  trackId: QuestionBankTrackId
  /** Primeira questão da fila sugerida (para CTA “Começar”). */
  targetRow: QuestionBankSuggestedRow | null
}

export interface QuestionBankPriorityResult {
  primary: QuestionBankPrimaryAction | null
  tracks: QuestionBankPracticeTrack[]
}

function rowKey(r: Pick<QuestionBankRow, 'year' | 'index' | 'language'>): string {
  return getQuestionId(r)
}

function findRowForQuestionId(
  allInArea: QuestionBankRow[],
  questionId: string,
): QuestionBankRow | null {
  const parsed = parseQuestionId(questionId)
  if (!parsed) return null
  const found = allInArea.find(
    (r) =>
      r.year === parsed.year &&
      r.index === parsed.index &&
      (r.language ?? null) === (parsed.language ?? null),
  )
  return found ?? null
}

function cutoffIso(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString()
}

function dedupeMistakesByQuestion(
  mistakes: RecentMistakeItem[],
  cutoff: string,
): RecentMistakeItem[] {
  const seen = new Set<string>()
  const out: RecentMistakeItem[] = []
  for (const m of mistakes) {
    if (m.createdAt < cutoff) continue
    if (seen.has(m.questionId)) continue
    seen.add(m.questionId)
    out.push(m)
  }
  return out
}

function topicoStatsByValue(area: AreaStat | undefined): Map<string, TopicoStat> {
  const m = new Map<string, TopicoStat>()
  if (!area?.topicos) return m
  for (const t of area.topicos) {
    m.set(t.value, t)
  }
  return m
}

function distinctTopicValuesInCatalog(allInArea: QuestionBankRow[]): string[] {
  const s = new Set<string>()
  for (const r of allInArea) {
    if (r.topicoValue) s.add(r.topicoValue)
  }
  return [...s]
}

/** Limiar BKT alinhado a Q_BANK_WEAK_ACCURACY_PCT_MAX (62% → 0.62). */
const Q_BANK_WEAK_P_KNOW_MAX = Q_BANK_WEAK_ACCURACY_PCT_MAX / 100

function hasFinitePKnow(t: TopicoStat): t is TopicoStat & { pKnow: number } {
  return typeof t.pKnow === 'number' && Number.isFinite(t.pKnow)
}

/** Critério primário: menor pKnow; fallback accuracyPct normalizada em [0, 1]. */
function weakTopicSortScore(t: TopicoStat, mistakes: RecentMistakeItem[]): number {
  const base = hasFinitePKnow(t) ? t.pKnow : t.accuracyPct / 100
  const multiplier = mistakePriorityMultiplierForTopic(t.value, mistakes)
  // Menor score = mais fraco = ordenado primeiro; stuck aumenta urgência (divide o score).
  return base / multiplier
}

const RECENT_MISTAKES_PER_TOPIC = 5

function mistakePriorityMultiplierForTopic(
  topicoValue: string,
  mistakes: RecentMistakeItem[],
): number {
  const recent = mistakes.filter((m) => m.topicoValue === topicoValue).slice(0, RECENT_MISTAKES_PER_TOPIC)
  if (recent.some((m) => m.mistakeType === 'stuck')) {
    return MISTAKE_PRIORITY_MULTIPLIER.stuck
  }
  return 1.0
}

function mistakeUrgency(m: RecentMistakeItem): number {
  const type = m.mistakeType ?? 'normal'
  return MISTAKE_PRIORITY_MULTIPLIER[type]
}

function isWeakTopicCandidate(t: TopicoStat): boolean {
  if (t.totalAnswered < Q_BANK_WEAK_TOPIC_MIN_ANSWERS) return false
  if (hasFinitePKnow(t)) return t.pKnow <= Q_BANK_WEAK_P_KNOW_MAX
  return t.accuracyPct <= Q_BANK_WEAK_ACCURACY_PCT_MAX
}

export function buildQuestionBankPriority(params: {
  areaKey: string
  allInArea: QuestionBankRow[]
  areaStat: AreaStat | undefined
  mistakes: RecentMistakeItem[]
  /** Rótulo da área para copy (ex.: Linguagens). */
  areaLabel: string
}): QuestionBankPriorityResult {
  const { areaKey, allInArea, areaStat, mistakes, areaLabel } = params
  const cutoff = cutoffIso(Q_BANK_RECENT_MISTAKE_DAYS)

  const inAreaMistakes = mistakes.filter((m) => {
    if (m.topicoValue) return areaKeyFromTopico(m.topicoValue) === areaKey
    return findRowForQuestionId(allInArea, m.questionId) != null
  })

  const recentDeduped = dedupeMistakesByQuestion(inAreaMistakes, cutoff).sort(
    (a, b) => mistakeUrgency(b) - mistakeUrgency(a) || b.createdAt.localeCompare(a.createdAt),
  )

  const mistakeRows: QuestionBankSuggestedRow[] = []
  for (const m of recentDeduped) {
    if (mistakeRows.length >= Q_BANK_TRACK_ROW_LIMIT) break
    const base = findRowForQuestionId(allInArea, m.questionId)
    if (!base) continue
    mistakeRows.push({
      ...base,
      reason: { kind: 'mistake', createdAt: m.createdAt },
    })
  }

  const usedKeys = new Set(mistakeRows.map((r) => rowKey(r)))
  const topicoStats = topicoStatsByValue(areaStat)

  const weakTopicCandidates = [...(areaStat?.topicos ?? [])]
    .filter(isWeakTopicCandidate)
    .sort((a, b) => weakTopicSortScore(a, recentDeduped) - weakTopicSortScore(b, recentDeduped))
    .slice(0, Q_BANK_WEAK_TOPIC_CAP)

  const weakRows: QuestionBankSuggestedRow[] = []
  for (const t of weakTopicCandidates) {
    const pool = allInArea.filter((r) => r.topicoValue === t.value && !usedKeys.has(rowKey(r)))
    const slice = pool.slice(0, Q_BANK_WEAK_QUESTIONS_PER_TOPIC)
    for (const base of slice) {
      if (weakRows.length >= Q_BANK_TRACK_ROW_LIMIT) break
      usedKeys.add(rowKey(base))
      weakRows.push({
        ...base,
        reason: {
          kind: 'weak',
          topicoLabel: t.label,
          accuracyPct: t.accuracyPct,
          ...(hasFinitePKnow(t) ? { pKnow: t.pKnow } : {}),
        },
      })
    }
    if (weakRows.length >= Q_BANK_TRACK_ROW_LIMIT) break
  }

  const catalogTopicos = distinctTopicValuesInCatalog(allInArea)
  const newTopicValues = catalogTopicos.filter((v) => {
    const st = topicoStats.get(v)
    return !st || st.totalAnswered === 0
  })

  const newRows: QuestionBankSuggestedRow[] = []
  for (const tv of newTopicValues) {
    if (newRows.length >= Q_BANK_TRACK_ROW_LIMIT) break
    const label = allInArea.find((r) => r.topicoValue === tv)?.topicoLabel ?? tv.replace(/-/g, ' ')
    const pool = allInArea
      .filter((r) => r.topicoValue === tv && !usedKeys.has(rowKey(r)))
      .sort((a, b) => b.year - a.year || a.index - b.index)
    const base = pool[0]
    if (!base) continue
    usedKeys.add(rowKey(base))
    newRows.push({
      ...base,
      reason: { kind: 'new', topicoLabel: label },
    })
  }

  let coldRows: QuestionBankSuggestedRow[] = []
  if (
    mistakeRows.length === 0 &&
    weakRows.length === 0 &&
    newRows.length === 0 &&
    allInArea.length > 0
  ) {
    const pool = [...allInArea]
      .filter((r) => !usedKeys.has(rowKey(r)))
      .sort((a, b) => b.year - a.year || a.index - b.index)
    const take = pool.slice(0, Q_BANK_TRACK_ROW_LIMIT)
    coldRows = take.map((base) => ({
      ...base,
      reason: { kind: 'cold', topicoLabel: base.topicoLabel },
    }))
  }

  const mistakesTrack: QuestionBankPracticeTrack = {
    id: 'mistakes',
    title: 'Erros recentes',
    description: 'Rever falhas dos últimos dias.',
    rows: mistakeRows,
    emptyHint: 'Sem erros por rever.',
  }

  const weakTrack: QuestionBankPracticeTrack = {
    id: 'weak',
    title: 'Tópicos fracos',
    description: 'Reforço onde acertas menos.',
    rows: weakRows,
    emptyHint: 'Pratique mais para surgirem sugestões.',
  }

  const newTrack: QuestionBankPracticeTrack = {
    id: 'newTopics',
    title: 'Novos temas',
    description: 'Pouco ou nada praticados nesta área.',
    rows: newRows.length > 0 ? newRows : coldRows,
    emptyHint: 'Já cobriste tudo — usa Explorar.',
  }

  const freeTrack: QuestionBankPracticeTrack = {
    id: 'freeExplore',
    title: 'Catálogo',
    description: 'Ano, tópico e dificuldade — secção abaixo.',
    rows: [],
    emptyHint: '',
  }

  const tracks = [mistakesTrack, weakTrack, newTrack, freeTrack]

  let primary: QuestionBankPrimaryAction | null = null

  if (mistakeRows.length > 0) {
    const first = mistakeRows[0]!
    const n = mistakeRows.length
    primary = {
      headline: n === 1 ? 'Rever 1 erro recente' : `Rever ${n} erros recentes`,
      subline: `${n} questão(ões) para rever nesta área.`,
      trustLine: 'Sugestão com base nas tuas respostas no Broto.',
      trackId: 'mistakes',
      targetRow: first,
    }
  } else if (weakRows.length > 0) {
    const r = weakRows[0]!
    const weakReason = r.reason.kind === 'weak' ? r.reason : null
    primary = {
      headline: weakReason ? `Reforço: ${weakReason.topicoLabel}` : 'Reforço no tópico mais fraco',
      subline: weakReason
        ? weakReason.pKnow != null
          ? `Segurança ~${Math.round(weakReason.pKnow * 100)}% neste tópico (BKT).`
          : `Acerto ~${Math.round(weakReason.accuracyPct)}% neste tópico.`
        : 'Prioridade nos tópicos com menos segurança.',
      trustLine: 'Calculado a partir do histórico por tópico.',
      trackId: 'weak',
      targetRow: r,
    }
  } else if (newRows.length > 0) {
    const r = newRows[0]!
    const nr = r.reason.kind === 'new' ? r.reason : null
    primary = {
      headline: nr ? `Novo: ${nr.topicoLabel}` : 'Explorar um tópico novo',
      subline: `Sem prática registada neste tema em ${areaLabel}.`,
      trustLine: 'Comparado com o teu progresso nos outros tópicos.',
      trackId: 'newTopics',
      targetRow: r,
    }
  } else if (coldRows.length > 0) {
    const r = coldRows[0]!
    primary = {
      headline: `Começar em ${r.topicoLabel}`,
      subline: 'Pouco histórico ainda — sugestão com questões recentes.',
      trustLine: 'As próximas sugestões ajustam-se às tuas respostas.',
      trackId: 'newTopics',
      targetRow: r,
    }
  }

  return { primary, tracks }
}
