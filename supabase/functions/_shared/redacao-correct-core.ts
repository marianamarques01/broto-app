import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validateCorrectionJson } from '@broto/shared/redacao/validate-correction.ts'
import type { CompetenciaCorrecaoInput } from '@broto/shared/redacao/validate-correction.ts'
import type { MarcacaoInput } from '@broto/shared/redacao/normalize-marcacoes.ts'
import type { FatoresZeroLlmInput } from '@broto/shared/redacao/check-fatores-zero.ts'
import {
  REDACAO_COMPETENCIAS,
  type RedacaoCompetencia,
  type RedacaoCorrecao,
} from '@broto/shared/types/redacao.ts'
import type { EnemCompetencia } from './enem-reference-chunking.ts'
import {
  formatEnemReferenceContext,
  searchEnemReferenceChunks,
  type EnemReferenceSearchChunk,
  type SearchEnemReferenceChunksParams,
} from './enem-reference-search.ts'
import {
  createChatCompletion,
  type ChatCompletionMessage,
  type ChatCompletionOptions,
} from './openai-chat.ts'
import {
  buildCompetenciaSystemPrompt,
  buildFatoresZeroSystemPrompt,
  buildRagQueryForCompetencia,
  buildRagQueryForFatoresZero,
  buildRedacaoUserPrompt,
  REDACAO_CORRECT_TEMPERATURE,
  REDACAO_PROMPT_VERSION,
} from './redacao-prompts.ts'
import { mapTemaRow, type MappedTema } from './redacao-tema-map.ts'
import { mapCorrecaoRow } from './redacao-map.ts'
import type { RedacaoCorrecoesRow, RedacaoTemasRow, RedacoesRow } from '../../database.types.ts'

export type RagChunkAuditEntry = {
  id: string
  similarity: number
  step: 'fatores_zero' | EnemCompetencia
  section?: string
  competencia?: string
}

export type ChatCompleter = (
  messages: ChatCompletionMessage[],
  options?: ChatCompletionOptions,
) => Promise<{ content: string; model: string }>

export type RedacaoCorrectResult = {
  correcao: RedacaoCorrecao
  skipped_llm: boolean
}

type RedacaoWithTema = RedacoesRow & {
  redacao_temas: RedacaoTemasRow | RedacaoTemasRow[] | null
}

const COMPETENCIAS_ORDER: EnemCompetencia[] = ['I', 'II', 'III', 'IV', 'V']

function resolveTema(row: RedacaoWithTema): MappedTema | null {
  const raw = row.redacao_temas
  if (!raw) return null
  const temaRow = Array.isArray(raw) ? raw[0] : raw
  if (!temaRow) return null
  return mapTemaRow(temaRow)
}

function parseJsonObject<T>(content: string, label: string): T {
  try {
    return JSON.parse(content) as T
  } catch {
    throw new Error(`JSON inválido em ${label}`)
  }
}

function toMarcacaoInputs(raw: unknown, competencia: RedacaoCompetencia): MarcacaoInput[] {
  if (!Array.isArray(raw)) return []

  const out: MarcacaoInput[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const m = item as Record<string, unknown>
    const trecho = typeof m.trecho === 'string' ? m.trecho : ''
    const tipo_problema = typeof m.tipo_problema === 'string' ? m.tipo_problema : 'observacao'
    const comentario = typeof m.comentario === 'string' ? m.comentario : ''
    const start_offset = typeof m.start_offset === 'number' ? m.start_offset : 0
    const end_offset = typeof m.end_offset === 'number' ? m.end_offset : 0
    if (!trecho.trim()) continue

    out.push({
      start_offset,
      end_offset,
      trecho,
      tipo_problema,
      comentario,
      competencia,
    })
  }
  return out
}

function auditChunk(
  chunk: EnemReferenceSearchChunk,
  step: RagChunkAuditEntry['step'],
): RagChunkAuditEntry {
  const section = typeof chunk.metadata.section === 'string' ? chunk.metadata.section : undefined
  const competencia =
    typeof chunk.metadata.competencia === 'string' ? chunk.metadata.competencia : undefined

  return {
    id: chunk.id,
    similarity: chunk.similarity,
    step,
    section,
    competencia,
  }
}

async function callLlmJson<T>(
  completer: ChatCompleter,
  system: string,
  user: string,
  label: string,
  maxTokens = 1200,
): Promise<{ parsed: T; model: string }> {
  const { content, model } = await completer(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    {
      temperature: REDACAO_CORRECT_TEMPERATURE,
      responseFormat: 'json_object',
      maxTokens,
    },
  )

  return { parsed: parseJsonObject<T>(content, label), model }
}

type FatoresZeroLlmResponse = FatoresZeroLlmInput & {
  evidencias?: Array<{ trecho?: string; start_offset?: number; end_offset?: number }>
}

type CompetenciaLlmResponse = {
  competencia?: string
  nota?: number
  justificativa?: string
  marcacoes?: unknown
}

export type EnemReferenceSearcher = (
  adminClient: SupabaseClient,
  params: SearchEnemReferenceChunksParams,
) => Promise<EnemReferenceSearchChunk[]>

export async function runRedacaoCorrect(params: {
  adminClient: SupabaseClient
  openAiKey: string
  redacaoId: string
  chatCompleter?: ChatCompleter
  searchChunks?: EnemReferenceSearcher
}): Promise<RedacaoCorrectResult> {
  const completer: ChatCompleter =
    params.chatCompleter ??
    ((messages, options) => createChatCompletion(messages, params.openAiKey, options))
  const searchChunks = params.searchChunks ?? searchEnemReferenceChunks
  const ragAudit: RagChunkAuditEntry[] = []
  let modeloUsado = ''

  const { data: redacaoRow, error: fetchError } = await params.adminClient
    .from('redacoes')
    .select('*, redacao_temas(*)')
    .eq('id', params.redacaoId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(`Erro ao carregar redação: ${fetchError.message}`)
  }
  if (!redacaoRow) {
    throw new Error('Redação não encontrada')
  }

  const redacao = redacaoRow as RedacaoWithTema
  const tema = resolveTema(redacao)
  if (!tema) {
    throw new Error('Tema da redação não encontrado')
  }

  await params.adminClient
    .from('redacoes')
    .update({ status: 'corrigindo' })
    .eq('id', params.redacaoId)

  const userPrompt = buildRedacaoUserPrompt({
    temaTitulo: tema.titulo,
    eixoTematico: tema.eixo_tematico,
    motivadores: tema.textos_motivadores,
    texto: redacao.texto,
    linhaCount: redacao.linha_count,
  })

  let fatoresZeroLlm: FatoresZeroLlmInput | null = null
  const marcacoesExtra: MarcacaoInput[] = []
  const competenciaInputs: CompetenciaCorrecaoInput[] = []
  let skippedLlm = false

  if (redacao.linha_count < 7) {
    skippedLlm = true
  } else {
    const zeroChunks = await searchChunks(params.adminClient, {
      query: buildRagQueryForFatoresZero(tema.titulo, redacao.texto),
      openAiKey: params.openAiKey,
      match_section: 'fatores_zero',
      match_competence: null,
    })
    ragAudit.push(...zeroChunks.map((c) => auditChunk(c, 'fatores_zero')))

    const zeroRag = formatEnemReferenceContext(zeroChunks)
    const zeroResult = await callLlmJson<FatoresZeroLlmResponse>(
      completer,
      buildFatoresZeroSystemPrompt(zeroRag),
      userPrompt,
      'fatores_zero',
      900,
    )
    modeloUsado = zeroResult.model
    fatoresZeroLlm = zeroResult.parsed

    for (const ev of zeroResult.parsed.evidencias ?? []) {
      if (!ev?.trecho || typeof ev.trecho !== 'string') continue
      marcacoesExtra.push({
        start_offset: typeof ev.start_offset === 'number' ? ev.start_offset : 0,
        end_offset: typeof ev.end_offset === 'number' ? ev.end_offset : 0,
        trecho: ev.trecho,
        tipo_problema: 'fator_zero',
        comentario: 'Evidência de fator de anulação.',
        competencia: 'II',
      })
    }

    const preCheck = validateCorrectionJson({
      texto: redacao.texto,
      linha_count: redacao.linha_count,
      competencias: [],
      fatores_zero: fatoresZeroLlm,
      marcacoes_extra: marcacoesExtra,
    })

    if (preCheck.fatores_zero.detectado) {
      return await persistCorrecao({
        adminClient: params.adminClient,
        redacao,
        validated: preCheck,
        ragAudit,
        modeloUsado,
        skippedLlm,
      })
    }

    for (const competencia of COMPETENCIAS_ORDER) {
      const compChunks = await searchChunks(params.adminClient, {
        query: buildRagQueryForCompetencia(competencia, tema.titulo, redacao.texto),
        openAiKey: params.openAiKey,
        match_competence: competencia,
        match_section: null,
      })
      ragAudit.push(...compChunks.map((c) => auditChunk(c, competencia)))

      const compRag = formatEnemReferenceContext(compChunks)
      const compResult = await callLlmJson<CompetenciaLlmResponse>(
        completer,
        buildCompetenciaSystemPrompt(competencia, compRag),
        userPrompt,
        `competencia_${competencia}`,
        1400,
      )
      modeloUsado = compResult.model

      competenciaInputs.push({
        competencia,
        nota: typeof compResult.parsed.nota === 'number' ? compResult.parsed.nota : 0,
        justificativa:
          typeof compResult.parsed.justificativa === 'string'
            ? compResult.parsed.justificativa
            : '',
        marcacoes: toMarcacaoInputs(compResult.parsed.marcacoes, competencia),
      })
    }
  }

  const validated = validateCorrectionJson({
    texto: redacao.texto,
    linha_count: redacao.linha_count,
    competencias: competenciaInputs,
    fatores_zero: fatoresZeroLlm,
    marcacoes_extra: marcacoesExtra,
  })

  return await persistCorrecao({
    adminClient: params.adminClient,
    redacao,
    validated,
    ragAudit,
    modeloUsado,
    skippedLlm,
  })
}

async function persistCorrecao(params: {
  adminClient: SupabaseClient
  redacao: RedacoesRow
  validated: ReturnType<typeof validateCorrectionJson>
  ragAudit: RagChunkAuditEntry[]
  modeloUsado: string
  skippedLlm: boolean
}): Promise<RedacaoCorrectResult> {
  const { validated, redacao, ragAudit, modeloUsado, skippedLlm } = params
  const now = new Date().toISOString()

  const insertRow = {
    redacao_id: redacao.id,
    nota_competencia_i: validated.notas.I,
    nota_competencia_ii: validated.notas.II,
    nota_competencia_iii: validated.notas.III,
    nota_competencia_iv: validated.notas.IV,
    nota_competencia_v: validated.notas.V,
    nota_total: validated.nota_total,
    justificativa_i: validated.justificativas.I,
    justificativa_ii: validated.justificativas.II,
    justificativa_iii: validated.justificativas.III,
    justificativa_iv: validated.justificativas.IV,
    justificativa_v: validated.justificativas.V,
    marcacoes_inline: validated.marcacoes_inline,
    fatores_zero: validated.fatores_zero,
    prompt_version: REDACAO_PROMPT_VERSION,
    modelo_usado: modeloUsado || 'n/a',
    rag_chunks_used: ragAudit,
    created_at: now,
  }

  const { data: saved, error: saveError } = await params.adminClient
    .from('redacao_correcoes')
    .upsert(insertRow, { onConflict: 'redacao_id' })
    .select('*')
    .single()

  if (saveError || !saved) {
    throw new Error(`Erro ao persistir correção: ${saveError?.message ?? 'sem dados'}`)
  }

  const snapshotRows = REDACAO_COMPETENCIAS.map((competencia) => ({
    user_id: redacao.user_id,
    competencia,
    nota: validated.notas[competencia],
    redacao_id: redacao.id,
    created_at: now,
  }))

  const { error: snapshotError } = await params.adminClient
    .from('redacao_competence_snapshots')
    .insert(snapshotRows)

  if (snapshotError) {
    console.warn('[redacao-correct] snapshots:', snapshotError.message)
  }

  const status = 'corrigida'
  const { error: statusError } = await params.adminClient
    .from('redacoes')
    .update({ status })
    .eq('id', redacao.id)

  if (statusError) {
    throw new Error(`Erro ao atualizar status: ${statusError.message}`)
  }

  return {
    correcao: mapCorrecaoRow(saved as RedacaoCorrecoesRow),
    skipped_llm: skippedLlm,
  }
}
