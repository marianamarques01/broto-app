import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react'
import type {
  BrotoChatMessage,
  BrotoChatSessionDeleteResponse,
  BrotoChatSessionGetResponse,
  BrotoChatSessionsListResponse,
} from '@broto/shared'
import { api, ApiError } from '@/lib/api-client'
import { readActiveBrotoSessionId, writeActiveBrotoSessionId } from '@/lib/broto-chat-storage'
import { useClass } from '@/hooks/useClass'

export type { BrotoChatMessage }

export const BROTO_WELCOME_TEXT =
  'Oi! Sou o Broto, seu assistente de estudos. Como posso te ajudar?'

export const BROTO_CHAT_ERROR_TEXT = 'Não consegui responder agora. Tente de novo.'

export type BrotoChatSessionItem = BrotoChatSessionsListResponse['sessions'][number]

function welcomeMessages(): BrotoChatMessage[] {
  return [{ role: 'assistant', content: BROTO_WELCOME_TEXT }]
}

function formatSessionDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export { formatSessionDate }

type UseBrotoChatOptions = {
  /** Carrega histórico persistido ao montar (padrão: true). */
  persistHistory?: boolean
}

export function useBrotoChat(options: UseBrotoChatOptions = {}) {
  const { persistHistory = true } = options
  const { currentClass } = useClass()
  const classId = currentClass?.id

  const [messages, setMessages] = useState<BrotoChatMessage[]>(welcomeMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [sessions, setSessions] = useState<BrotoChatSessionItem[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID())
  const [turnIndex, setTurnIndex] = useState(0)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const refreshSessions = useCallback(async () => {
    if (!classId) {
      setSessions([])
      return
    }
    setSessionsLoading(true)
    try {
      const resp = await api.post<BrotoChatSessionsListResponse>('/api/broto/chat/sessions', {
        classId,
      })
      setSessions(resp.sessions)
    } catch (err) {
      if (!(err instanceof ApiError)) {
        console.error('[useBrotoChat] falha ao listar conversas', err)
      }
    } finally {
      setSessionsLoading(false)
    }
  }, [classId])

  const loadSession = useCallback(
    async (targetSessionId: string) => {
      setHistoryLoading(true)
      try {
        const resp = await api.post<BrotoChatSessionGetResponse>('/api/broto/chat/session/get', {
          sessionId: targetSessionId,
        })
        setSessionId(resp.sessionId)
        setTurnIndex(resp.turnCount)
        setMessages(resp.messages.length > 0 ? resp.messages : welcomeMessages())
        if (classId) writeActiveBrotoSessionId(classId, resp.sessionId)
      } catch (err) {
        if (!(err instanceof ApiError)) {
          console.error('[useBrotoChat] falha ao carregar conversa', err)
        }
      } finally {
        setHistoryLoading(false)
      }
    },
    [classId],
  )

  useEffect(() => {
    if (!persistHistory || !classId) return

    let cancelled = false

    async function bootstrapHistory() {
      setHistoryLoading(true)
      try {
        const listResp = await api.post<BrotoChatSessionsListResponse>('/api/broto/chat/sessions', {
          classId,
        })
        if (cancelled) return
        setSessions(listResp.sessions)

        const storedSessionId = readActiveBrotoSessionId(classId)
        const sessionToLoad =
          storedSessionId &&
          listResp.sessions.some((session) => session.sessionId === storedSessionId)
            ? storedSessionId
            : listResp.sessions[0]?.sessionId

        if (sessionToLoad) {
          const sessionResp = await api.post<BrotoChatSessionGetResponse>(
            '/api/broto/chat/session/get',
            { sessionId: sessionToLoad },
          )
          if (cancelled) return
          setSessionId(sessionResp.sessionId)
          setTurnIndex(sessionResp.turnCount)
          setMessages(sessionResp.messages.length > 0 ? sessionResp.messages : welcomeMessages())
          writeActiveBrotoSessionId(classId, sessionResp.sessionId)
        }
      } catch (err) {
        if (!(err instanceof ApiError)) {
          console.error('[useBrotoChat] falha ao restaurar histórico', err)
        }
      } finally {
        if (!cancelled) setHistoryLoading(false)
      }
    }

    void bootstrapHistory()

    return () => {
      cancelled = true
    }
  }, [classId, persistHistory])

  const resetConversation = useCallback(() => {
    const nextSessionId = crypto.randomUUID()
    setMessages(welcomeMessages())
    setInput('')
    setSessionId(nextSessionId)
    setTurnIndex(0)
    if (classId) writeActiveBrotoSessionId(classId, nextSessionId)
  }, [classId])

  const selectSession = useCallback(
    (targetSessionId: string) => {
      if (targetSessionId === sessionId && messages.length > 1) return
      void loadSession(targetSessionId)
    },
    [loadSession, messages.length, sessionId],
  )

  const deleteSession = useCallback(
    async (targetSessionId: string) => {
      if (deletingSessionId) return
      if (!window.confirm('Excluir esta conversa? Esta ação não pode ser desfeita.')) {
        return
      }

      setDeletingSessionId(targetSessionId)
      try {
        await api.post<BrotoChatSessionDeleteResponse>('/api/broto/chat/session/delete', {
          sessionId: targetSessionId,
        })
        setSessions((prev) => prev.filter((session) => session.sessionId !== targetSessionId))

        if (targetSessionId === sessionId) {
          resetConversation()
        }
      } catch (err) {
        if (!(err instanceof ApiError)) {
          console.error('[useBrotoChat] falha ao excluir conversa', err)
        }
      } finally {
        setDeletingSessionId(null)
      }
    },
    [deletingSessionId, resetConversation, sessionId],
  )

  const runAssistant = useCallback(
    async (history: BrotoChatMessage[], currentTurnIndex: number, activeSessionId: string) => {
      setLoading(true)
      try {
        const resp = await api.post<{ message: string }>('/api/broto/chat', {
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          sessionId: activeSessionId,
          turnIndex: currentTurnIndex,
          classId,
        })
        setMessages((prev) => [...prev, { role: 'assistant', content: resp.message }])
        setTurnIndex((t) => t + 1)
        void refreshSessions()
      } catch (err) {
        if (!(err instanceof ApiError)) {
          console.error('[useBrotoChat] request failed (non-ApiError)', err)
        }
        setMessages((prev) => [...prev, { role: 'assistant', content: BROTO_CHAT_ERROR_TEXT }])
      } finally {
        setLoading(false)
      }
    },
    [classId, refreshSessions],
  )

  const sendUserText = useCallback(
    (raw: string) => {
      const trimmed = raw.trim()
      if (!trimmed || loading || historyLoading) return

      const userMsg: BrotoChatMessage = { role: 'user', content: trimmed }
      const currentTurnIndex = turnIndex
      const activeSessionId = sessionId

      if (classId) writeActiveBrotoSessionId(classId, activeSessionId)

      setMessages((prev) => {
        const history = [...prev, userMsg]
        void runAssistant(history, currentTurnIndex, activeSessionId)
        return history
      })
      setInput('')
    },
    [classId, historyLoading, loading, runAssistant, sessionId, turnIndex],
  )

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    sendUserText(input)
  }

  const isWelcomeOnly =
    messages.length === 1 &&
    messages[0]?.role === 'assistant' &&
    messages[0]?.content === BROTO_WELCOME_TEXT

  return {
    messages,
    input,
    setInput,
    loading,
    historyLoading,
    sessions,
    sessionsLoading,
    sessionId,
    endRef,
    handleSubmit,
    sendUserText,
    resetConversation,
    selectSession,
    deleteSession,
    deletingSessionId,
    refreshSessions,
    isWelcomeOnly,
  }
}
