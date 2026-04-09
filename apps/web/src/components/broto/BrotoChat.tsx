import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react'
import { api, ApiError } from '@/lib/api-client'
import { Send } from 'lucide-react'

export interface BrotoChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export const BROTO_WELCOME_TEXT =
  'Oi! Sou o Broto, seu assistente de estudos. Como posso te ajudar?'

export function useBrotoChat() {
  const [messages, setMessages] = useState<BrotoChatMessage[]>([
    { role: 'assistant', content: BROTO_WELCOME_TEXT },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const resetConversation = useCallback(() => {
    setMessages([{ role: 'assistant', content: BROTO_WELCOME_TEXT }])
    setInput('')
  }, [])

  const runAssistant = useCallback(async (history: BrotoChatMessage[]) => {
    setLoading(true)
    try {
      const resp = await api.post<{ message: string }>('/api/broto/chat', {
        messages: history.map((m) => ({ role: m.role, content: m.content })),
      })
      setMessages((prev) => [...prev, { role: 'assistant', content: resp.message }])
    } catch (err) {
      if (!(err instanceof ApiError)) {
        console.error('[BrotoChat] request failed (non-ApiError)', err)
      }
      const detail = err instanceof ApiError ? err.message : ''
      const errorMsg = detail || 'Desculpe, tive um problema. Tente novamente.'
      setMessages((prev) => [...prev, { role: 'assistant', content: errorMsg }])
    } finally {
      setLoading(false)
    }
  }, [])

  const sendUserText = useCallback(
    (raw: string) => {
      const trimmed = raw.trim()
      if (!trimmed || loading) return

      const userMsg: BrotoChatMessage = { role: 'user', content: trimmed }

      setMessages((prev) => {
        const history = [...prev, userMsg]
        void runAssistant(history)
        return history
      })
      setInput('')
    },
    [loading, runAssistant],
  )

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    sendUserText(input)
  }

  return {
    messages,
    input,
    setInput,
    loading,
    endRef,
    handleSubmit,
    sendUserText,
    resetConversation,
  }
}

export function BrotoChat() {
  const { messages, input, setInput, loading, endRef, handleSubmit } = useBrotoChat()

  return (
    <div className="broto-chat">
      <div className="broto-chat__scroll">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`broto-chat__bubble ${msg.role === 'user' ? 'broto-chat__bubble--user' : 'broto-chat__bubble--assistant'}`}
          >
            {msg.role === 'assistant' && (
              <span
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--green-400)',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                {'\u{1F331}'} Broto
              </span>
            )}
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="broto-chat__typing">
            <span
              style={{
                fontSize: '0.65rem',
                color: 'var(--green-400)',
                fontWeight: 600,
                display: 'block',
                marginBottom: 4,
              }}
            >
              {'\u{1F331}'} Broto
            </span>
            Pensando...
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="broto-chat__composer-wrap">
        <form
          className={`broto-chat__composer${loading ? ' broto-chat__composer--busy' : ''}`}
          onSubmit={handleSubmit}
          aria-busy={loading}
        >
          <input
            type="text"
            className="broto-input broto-chat__composer-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte algo ao Broto..."
            disabled={loading}
          />
          <button
            type="submit"
            className={`broto-chat__send ${input.trim() && !loading ? 'broto-chat__send--active' : ''}`}
            disabled={loading || !input.trim()}
            aria-label="Enviar mensagem"
          >
            <Send size={16} aria-hidden />
          </button>
        </form>
      </div>
    </div>
  )
}
