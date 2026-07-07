import {
  REDACAO_COMPETENCIAS,
  type RedacaoCompetencia,
  type RedacaoCompetenceSnapshot,
} from '../types/redacao.ts'
import { REDACAO_COMPETENCIA_SHORT } from './competencia-labels.ts'
import type { EnemAreaKey } from '../enem-area-key.ts'

/** Média abaixo deste limiar nas últimas N redações → competência fraca (REDA-08). */
export const REDACAO_EVOLUCAO_WEAK_THRESHOLD = 120

/** Janela de redações para detectar competência consistentemente fraca. */
export const REDACAO_EVOLUCAO_WEAK_WINDOW = 3

export type RedacaoEvolucaoPoint = {
  redacao_id: string
  created_at: string
  nota: number
}

export type RedacaoEvolucaoSerie = {
  competencia: RedacaoCompetencia
  points: RedacaoEvolucaoPoint[]
  media: number | null
  delta: number | null
}

export type RedacaoRoutineHint = {
  competencia: RedacaoCompetencia
  area: EnemAreaKey
  topic: string
  label: string
}

/** Mapeamento competência fraca → conteúdo sugerido na rotina (domínio paralelo ao BKT). */
export const REDACAO_COMPETENCIA_ROUTINE_HINTS: Record<
  RedacaoCompetencia,
  Omit<RedacaoRoutineHint, 'competencia'>
> = {
  I: {
    area: 'linguagens',
    topic: 'ortografia_concordancia',
    label: 'Ortografia, concordância e regência',
  },
  II: {
    area: 'ciencias-humanas',
    topic: 'repertorio_atualidades',
    label: 'Repertório sociocultural e atualidades',
  },
  III: {
    area: 'ciencias-humanas',
    topic: 'argumentacao_tese',
    label: 'Tese, argumentos e contra-argumentos',
  },
  IV: {
    area: 'linguagens',
    topic: 'conectivos_coesao',
    label: 'Conectivos e articulação textual',
  },
  V: {
    area: 'ciencias-humanas',
    topic: 'proposta_intervencao',
    label: 'Estrutura de proposta de intervenção',
  },
}

function latestSnapshotPerRedacao(
  snapshots: RedacaoCompetenceSnapshot[],
  competencia: RedacaoCompetencia,
): RedacaoCompetenceSnapshot[] {
  const byRedacao = new Map<string, RedacaoCompetenceSnapshot>()

  for (const snapshot of snapshots) {
    if (snapshot.competencia !== competencia) continue
    const existing = byRedacao.get(snapshot.redacao_id)
    if (!existing || snapshot.created_at > existing.created_at) {
      byRedacao.set(snapshot.redacao_id, snapshot)
    }
  }

  return [...byRedacao.values()].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
}

/** Últimas N notas distintas por redação, mais recentes primeiro. */
export function getLastNotasForCompetencia(
  snapshots: RedacaoCompetenceSnapshot[],
  competencia: RedacaoCompetencia,
  window = REDACAO_EVOLUCAO_WEAK_WINDOW,
): number[] {
  const ordered = [...latestSnapshotPerRedacao(snapshots, competencia)].reverse()
  return ordered.slice(0, window).map((s) => s.nota)
}

export function computeWeakCompetences(
  snapshots: RedacaoCompetenceSnapshot[],
  options?: { threshold?: number; window?: number },
): RedacaoCompetencia[] {
  const threshold = options?.threshold ?? REDACAO_EVOLUCAO_WEAK_THRESHOLD
  const window = options?.window ?? REDACAO_EVOLUCAO_WEAK_WINDOW
  const weak: RedacaoCompetencia[] = []

  for (const competencia of REDACAO_COMPETENCIAS) {
    const lastNotas = getLastNotasForCompetencia(snapshots, competencia, window)
    if (lastNotas.length < window) continue

    const media = lastNotas.reduce((sum, nota) => sum + nota, 0) / lastNotas.length
    if (media < threshold) {
      weak.push(competencia)
    }
  }

  return weak
}

export function buildEvolucaoSeries(
  snapshots: RedacaoCompetenceSnapshot[],
): RedacaoEvolucaoSerie[] {
  return REDACAO_COMPETENCIAS.map((competencia) => {
    const points = latestSnapshotPerRedacao(snapshots, competencia).map((snapshot) => ({
      redacao_id: snapshot.redacao_id,
      created_at: snapshot.created_at,
      nota: snapshot.nota,
    }))

    const media =
      points.length > 0
        ? Math.round(points.reduce((sum, point) => sum + point.nota, 0) / points.length)
        : null

    const delta =
      points.length >= 2 ? points[points.length - 1]!.nota - points[0]!.nota : null

    return { competencia, points, media, delta }
  })
}

export function buildRoutineHints(
  weakCompetences: RedacaoCompetencia[],
): RedacaoRoutineHint[] {
  return weakCompetences.map((competencia) => ({
    competencia,
    ...REDACAO_COMPETENCIA_ROUTINE_HINTS[competencia],
    label: `${REDACAO_COMPETENCIA_SHORT[competencia]}: ${REDACAO_COMPETENCIA_ROUTINE_HINTS[competencia].label}`,
  }))
}

/** Progresso em relação à meta de nota total (0–1000). */
export function computeMetaProgress(
  metaRedacao: number | null | undefined,
  notaTotalAtual: number | null,
): { meta: number | null; progressPct: number | null; faltam: number | null } {
  if (metaRedacao == null || metaRedacao <= 0 || notaTotalAtual == null) {
    return { meta: metaRedacao ?? null, progressPct: null, faltam: null }
  }

  const progressPct = Math.min(100, Math.round((notaTotalAtual / metaRedacao) * 100))
  const faltam = Math.max(0, metaRedacao - notaTotalAtual)

  return { meta: metaRedacao, progressPct, faltam }
}
