import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  buildEvolucaoSeries,
  buildRoutineHints,
  computeWeakCompetences,
  type RedacaoEvolucaoSerie,
  type RedacaoRoutineHint,
} from '@broto/shared/redacao/evolucao.ts'
import type { RedacaoCompetencia, RedacaoCompetenceSnapshot } from '@broto/shared/types/redacao.ts'
import type { RedacaoCompetenceSnapshotsRow } from '../../database.types.ts'

export type RedacaoHistoryItem = {
  redacao_id: string
  tema_titulo: string
  eixo_tematico: string
  nota_total: number
  created_at: string
  notas: Record<RedacaoCompetencia, number>
}

export type RedacaoEvolucaoPayload = {
  total_redacoes: number
  meta_redacao: number | null
  nivel_redacao: string | null
  series: RedacaoEvolucaoSerie[]
  weak_competences: RedacaoCompetencia[]
  historico: RedacaoHistoryItem[]
  recomendacoes: RedacaoRoutineHint[]
}

function mapSnapshotRow(row: RedacaoCompetenceSnapshotsRow): RedacaoCompetenceSnapshot {
  return {
    id: row.id,
    user_id: row.user_id,
    competencia: row.competencia as RedacaoCompetencia,
    nota: row.nota,
    redacao_id: row.redacao_id,
    created_at: row.created_at,
  }
}

export async function fetchRedacaoSnapshots(
  admin: SupabaseClient,
  userId: string,
  limit = 150,
): Promise<RedacaoCompetenceSnapshot[]> {
  const { data, error } = await admin
    .from('redacao_competence_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Erro ao carregar snapshots: ${error.message}`)
  }

  return ((data ?? []) as RedacaoCompetenceSnapshotsRow[]).map(mapSnapshotRow)
}

export async function fetchRedacaoWeakCompetences(
  admin: SupabaseClient,
  userId: string,
): Promise<RedacaoCompetencia[]> {
  const snapshots = await fetchRedacaoSnapshots(admin, userId)
  return computeWeakCompetences(snapshots)
}

type CorrecaoHistoryRow = {
  redacao_id: string
  nota_total: number
  nota_competencia_i: number
  nota_competencia_ii: number
  nota_competencia_iii: number
  nota_competencia_iv: number
  nota_competencia_v: number
  created_at: string
  redacoes:
    | {
        id: string
        created_at: string
        redacao_temas:
          | { titulo: string; eixo_tematico: string }
          | { titulo: string; eixo_tematico: string }[]
          | null
      }
    | {
        id: string
        created_at: string
        redacao_temas:
          | { titulo: string; eixo_tematico: string }
          | { titulo: string; eixo_tematico: string }[]
          | null
      }[]
    | null
}

function extractTema(
  temaRaw:
    | { titulo: string; eixo_tematico: string }
    | { titulo: string; eixo_tematico: string }[]
    | null
    | undefined,
): { titulo: string; eixo_tematico: string } | null {
  if (!temaRaw) return null
  if (Array.isArray(temaRaw)) return temaRaw[0] ?? null
  return temaRaw
}

function mapHistoricoRow(row: CorrecaoHistoryRow): RedacaoHistoryItem | null {
  const redacaoRaw = row.redacoes
  const redacao = Array.isArray(redacaoRaw) ? redacaoRaw[0] : redacaoRaw
  if (!redacao) return null

  const tema = extractTema(redacao.redacao_temas)
  if (!tema) return null

  return {
    redacao_id: row.redacao_id,
    tema_titulo: tema.titulo,
    eixo_tematico: tema.eixo_tematico,
    nota_total: row.nota_total,
    created_at: redacao.created_at,
    notas: {
      I: row.nota_competencia_i,
      II: row.nota_competencia_ii,
      III: row.nota_competencia_iii,
      IV: row.nota_competencia_iv,
      V: row.nota_competencia_v,
    },
  }
}

export async function buildRedacaoEvolucaoPayload(
  admin: SupabaseClient,
  userId: string,
  profile: { meta_redacao: number | null; nivel_redacao: string | null } | null,
): Promise<RedacaoEvolucaoPayload> {
  const snapshots = await fetchRedacaoSnapshots(admin, userId)
  const series = buildEvolucaoSeries(snapshots)
  const weakCompetences = computeWeakCompetences(snapshots)
  const recomendacoes = buildRoutineHints(weakCompetences)

  const { data: correcoesRows, error: historicoError } = await admin
    .from('redacao_correcoes')
    .select(
      `
      redacao_id,
      nota_total,
      nota_competencia_i,
      nota_competencia_ii,
      nota_competencia_iii,
      nota_competencia_iv,
      nota_competencia_v,
      created_at,
      redacoes!inner (
        id,
        created_at,
        user_id,
        status,
        redacao_temas ( titulo, eixo_tematico )
      )
    `,
    )
    .eq('redacoes.user_id', userId)
    .eq('redacoes.status', 'corrigida')
    .order('created_at', { ascending: false })
    .limit(20)

  if (historicoError) {
    throw new Error(`Erro ao carregar histórico: ${historicoError.message}`)
  }

  const historico = ((correcoesRows ?? []) as CorrecaoHistoryRow[])
    .map(mapHistoricoRow)
    .filter((item): item is RedacaoHistoryItem => item != null)

  return {
    total_redacoes: historico.length,
    meta_redacao: profile?.meta_redacao ?? null,
    nivel_redacao: profile?.nivel_redacao ?? null,
    series,
    weak_competences: weakCompetences,
    historico,
    recomendacoes,
  }
}
