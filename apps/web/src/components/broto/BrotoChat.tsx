import { useState, useRef, useEffect, type FormEvent } from 'react'
import { api, ApiError } from '@/lib/api-client'
import { Send } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function BrotoChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Oi! Sou o Broto, seu assistente de estudos. Como posso te ajudar?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const resp = await api.post<{ message: string }>('/api/broto/chat', {
        messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
      })
      setMessages((prev) => [...prev, { role: 'assistant', content: resp.message }])
    } catch (err) {
      const detail = err instanceof ApiError ? err.message : ''
      const errorMsg = detail || 'Desculpe, tive um problema. Tente novamente.'
      console.error('[BrotoChat]', err)
      setMessages((prev) => [...prev, { role: 'assistant', content: errorMsg }])
    } finally {
      setLoading(false)
    }
  }

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

      <form className="broto-chat__form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="broto-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte algo ao Broto..."
          disabled={loading}
        />
        <button
          type="submit"
          className="broto-chat__send"
          disabled={loading || !input.trim()}
          aria-label="Enviar mensagem"
        >
          <Send size={16} aria-hidden />
        </button>
      </form>
    </div>
  )
}
