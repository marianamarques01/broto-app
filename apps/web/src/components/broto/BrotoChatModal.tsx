import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ChevronDown,
  GraduationCap,
  Maximize2,
  PenLine,
  Search,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import { useBrotoChat, BROTO_WELCOME_TEXT } from '@/components/broto/BrotoChat'

type BrotoChatModalProps = {
  onClose: () => void
}

const SUGGESTIONS: { icon: typeof Search; label: string; prompt: string; badge?: string }[] = [
  {
    icon: Search,
    label: 'Tirar dúvidas de qualquer matéria',
    prompt: 'Explique como resolver questões de interpretação de texto no ENEM.',
  },
  {
    icon: Sparkles,
    label: 'Montar um plano de estudos',
    prompt: 'Monte um plano de revisão de uma semana focado no ENEM.',
    badge: 'Novo',
  },
  {
    icon: BookOpen,
    label: 'Resumir um tema',
    prompt: 'Faça um resumo dos principais conceitos de funções matemáticas para o ENEM.',
    badge: 'Novo',
  },
  {
    icon: GraduationCap,
    label: 'Dicas de redação',
    prompt: 'Quais critérios mais importantes da redação do ENEM e como treinar?',
    badge: 'Novo',
  },
]

export function BrotoChatModal({ onClose }: BrotoChatModalProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    messages,
    input,
    setInput,
    loading,
    endRef,
    handleSubmit,
    sendUserText,
    resetConversation,
  } = useBrotoChat()

  const showWelcomeShell =
    messages.length === 1 &&
    messages[0].role === 'assistant' &&
    messages[0].content === BROTO_WELCOME_TEXT &&
    !loading

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleOpenFullPage() {
    onClose()
    navigate('/broto')
  }

  return (
    <div className="broto-chat-modal-root" aria-live="polite">
      <div
        id="broto-chat-floating-panel"
        className="broto-chat-modal"
        role="dialog"
        aria-modal="false"
        aria-labelledby="broto-chat-modal-title"
      >
        <header className="broto-chat-modal__header">
          <div className="broto-chat-modal__title-row">
            <h2 id="broto-chat-modal-title" className="broto-chat-modal__title">
              Broto IA
            </h2>
            <span className="broto-chat-modal__title-chevron" aria-hidden>
              <ChevronDown size={16} strokeWidth={2.2} />
            </span>
          </div>
          <div className="broto-chat-modal__header-actions">
            <button
              type="button"
              className="broto-chat-modal__icon-btn"
              onClick={resetConversation}
              title="Nova conversa"
              aria-label="Nova conversa"
            >
              <PenLine size={18} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="broto-chat-modal__icon-btn"
              onClick={handleOpenFullPage}
              title="Abrir em tela cheia"
              aria-label="Abrir chat em tela cheia"
            >
              <Maximize2 size={18} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="broto-chat-modal__icon-btn broto-chat-modal__icon-btn--close"
              onClick={onClose}
              title="Fechar"
              aria-label="Fechar chat"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </header>

        <div className="broto-chat-modal__body">
          {showWelcomeShell ? (
            <div className="broto-chat-modal__welcome">
              <div className="broto-chat-modal__avatar" aria-hidden>
                {'\u{1F331}'}
              </div>
              <h3 className="broto-chat-modal__welcome-title">Seu Broto IA</h3>
              <p className="broto-chat-modal__welcome-sub">
                Algumas ideias do que posso fazer — ou pergunte o que quiser!
              </p>
              <ul className="broto-chat-modal__suggestions">
                {SUGGESTIONS.map(({ icon: Icon, label, prompt, badge }) => (
                  <li key={label}>
                    <button
                      type="button"
                      className="broto-chat-modal__suggestion"
                      onClick={() => sendUserText(prompt)}
                      disabled={loading}
                    >
                      <span className="broto-chat-modal__suggestion-icon" aria-hidden>
                        <Icon size={18} strokeWidth={2} />
                      </span>
                      <span className="broto-chat-modal__suggestion-label">{label}</span>
                      {badge ? (
                        <span className="broto-chat-modal__suggestion-badge">{badge}</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="broto-chat-modal__thread">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`broto-chat__bubble broto-chat-modal__bubble ${msg.role === 'user' ? 'broto-chat__bubble--user' : 'broto-chat__bubble--assistant'}`}
                >
                  {msg.role === 'assistant' && (
                    <span className="broto-chat-modal__bubble-kicker">
                      {'\u{1F331}'} Broto
                    </span>
                  )}
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div className="broto-chat__typing broto-chat-modal__typing">
                  <span className="broto-chat-modal__bubble-kicker">
                    {'\u{1F331}'} Broto
                  </span>
                  Pensando...
                </div>
              )}
            </div>
          )}
          <div ref={endRef} className="broto-chat-modal__scroll-anchor" aria-hidden />
        </div>

        <div className="broto-chat-modal__composer-wrap">
          <form className="broto-chat-modal__composer" onSubmit={handleSubmit}>
            <label className="broto-sr-only" htmlFor="broto-chat-modal-input">
              Mensagem para o Broto
            </label>
            <input
              id="broto-chat-modal-input"
              ref={inputRef}
              type="text"
              className="broto-chat-modal__input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte, busque ideias ou peça um plano…"
              disabled={loading}
              autoComplete="off"
            />
            <div className="broto-chat-modal__composer-footer">
              <button
                type="submit"
                className={`broto-chat-modal__send ${input.trim() && !loading ? 'broto-chat-modal__send--active' : ''}`}
                disabled={loading || !input.trim()}
                aria-label="Enviar mensagem"
              >
                <Send size={17} strokeWidth={2.2} aria-hidden />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
