import type { BrotoChatMessage } from './edge-api-types.ts'
import type { ChatCompletionMessage } from './openai-chat.ts'
import type { SemanticSearchChunk } from './semantic-search-core.ts'

export const RAG_NO_CONTEXT_REPLY =
  'Não encontrei informações sobre isso nos materiais da sua turma. Tente reformular a pergunta ou peça ao professor para adicionar o conteúdo.'

export function shouldUseRagChat(ragEnabled: boolean | null | undefined): boolean {
  return ragEnabled === true
}

function formatChunkMetadata(metadata: Record<string, unknown>): string {
  const parts: string[] = []
  const page = metadata.page_number
  if (typeof page === 'number' && Number.isFinite(page)) {
    parts.push(`p.${page}`)
  }
  const section = metadata.section_title
  if (typeof section === 'string' && section.trim()) {
    parts.push(section.trim())
  }
  const fileName = metadata.file_name
  if (typeof fileName === 'string' && fileName.trim()) {
    parts.push(fileName.trim())
  }
  return parts.length > 0 ? `[${parts.join(' · ')}] ` : ''
}

/** Formata trechos recuperados para injeção no prompt. Retorna null se vazio. */
export function formatRagContext(chunks: SemanticSearchChunk[]): string | null {
  if (chunks.length === 0) return null

  const lines = chunks.map((chunk, index) => {
    const header = formatChunkMetadata(chunk.metadata)
    const score = typeof chunk.similarity === 'number' ? chunk.similarity.toFixed(2) : undefined
    const prefix = score ? `Trecho ${index + 1} (relevância ${score}): ` : `Trecho ${index + 1}: `
    return `${prefix}${header}${chunk.chunk_text.trim()}`
  })

  return lines.join('\n\n')
}

export function buildRagSystemPrompt(contextBlock: string): string {
  return [
    'Você é o Broto, assistente de estudos para alunos do ENEM.',
    'Responda em português do Brasil, de forma clara e didática.',
    'Use APENAS os trechos abaixo dos materiais da turma como fonte.',
    'Se a resposta não estiver nos trechos, diga honestamente que não encontrou no material da turma.',
    'Se os trechos tiverem baixa relevância à pergunta, também diga que não encontrou no material.',
    'Não invente fatos nem cite fontes externas.',
    '',
    '--- Materiais da turma ---',
    contextBlock,
    '--- Fim dos materiais ---',
  ].join('\n')
}

const MAX_HISTORY_MESSAGES = 8

export function buildRagChatMessages(params: {
  contextBlock: string
  conversationHistory: BrotoChatMessage[]
  question: string
}): ChatCompletionMessage[] {
  const system: ChatCompletionMessage = {
    role: 'system',
    content: buildRagSystemPrompt(params.contextBlock),
  }

  const recent = params.conversationHistory.slice(-MAX_HISTORY_MESSAGES)
  const history: ChatCompletionMessage[] = recent.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  return [system, ...history, { role: 'user', content: params.question.trim() }]
}
