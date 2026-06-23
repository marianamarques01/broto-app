export type ChatLogListRow = {
  session_id: string
  question: string
  created_at: string
  turn_index: number
  class_id: string | null
}

export type BrotoChatSessionSummary = {
  sessionId: string
  preview: string
  lastMessageAt: string
  turnCount: number
  classId: string | null
}

export type ChatLogTurnRow = {
  question: string
  answer: string
  turn_index: number
}

export type BrotoChatHistoryMessage = {
  role: 'user' | 'assistant'
  content: string
}

function truncatePreview(question: string): string {
  const trimmed = question.trim()
  if (trimmed.length <= 80) return trimmed
  return `${trimmed.slice(0, 77)}…`
}

/** Agrupa linhas de chat_logs (ordem desc por created_at) em sessões para listagem. */
export function groupChatLogSessions(
  rows: ChatLogListRow[],
  limit: number,
): BrotoChatSessionSummary[] {
  const map = new Map<string, BrotoChatSessionSummary & { minTurnIndex: number }>()

  for (const row of rows) {
    const existing = map.get(row.session_id)
    if (!existing) {
      map.set(row.session_id, {
        sessionId: row.session_id,
        preview: truncatePreview(row.question),
        lastMessageAt: row.created_at,
        turnCount: 1,
        classId: row.class_id,
        minTurnIndex: row.turn_index,
      })
      continue
    }

    existing.turnCount += 1
    if (row.turn_index < existing.minTurnIndex) {
      existing.minTurnIndex = row.turn_index
      existing.preview = truncatePreview(row.question)
    }
    if (row.created_at > existing.lastMessageAt) {
      existing.lastMessageAt = row.created_at
    }
  }

  return [...map.values()]
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
    .slice(0, limit)
    .map(({ minTurnIndex: _minTurnIndex, ...session }) => session)
}

/** Converte turnos persistidos em mensagens alternadas user/assistant. */
export function chatLogTurnsToMessages(rows: ChatLogTurnRow[]): BrotoChatHistoryMessage[] {
  const sorted = [...rows].sort((a, b) => a.turn_index - b.turn_index)
  const messages: BrotoChatHistoryMessage[] = []
  for (const row of sorted) {
    messages.push({ role: 'user', content: row.question })
    messages.push({ role: 'assistant', content: row.answer })
  }
  return messages
}
