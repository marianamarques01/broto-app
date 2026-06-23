import { useState, type FormEvent } from 'react'
import { isClassAiChatReady } from '@broto/shared'
import { useClass } from '@/hooks/useClass'
import { Send } from 'lucide-react'
import { useBrotoChat, BROTO_WELCOME_TEXT, BROTO_CHAT_ERROR_TEXT } from '@/hooks/useBrotoChat'
import { BrotoChatSidebar } from '@/components/broto/BrotoChatSidebar'

export type { BrotoChatMessage } from '@/hooks/useBrotoChat'
export { BROTO_WELCOME_TEXT, BROTO_CHAT_ERROR_TEXT }

export function BrotoChatUnavailableState(props: { className?: string }) {
  const cls = props.className ?? 'broto-chat__unavailable'
  return (
    <div className={cls} role="status">
      <span className="broto-chat__unavailable-icon" aria-hidden>
        {'\u{1F4DA}'}
      </span>
      <p className="broto-chat__unavailable-title">Chat disponível em breve</p>
      <p className="broto-chat__unavailable-sub">
        Será ativado quando seu professor adicionar materiais da turma.
      </p>
    </div>
  )
}

type BrotoChatProps = {
  /** Página cheia com sidebar de conversas; modal usa layout compacto. */
  layout?: 'page' | 'compact'
}

function BrotoChatThread(props: {
  messages: ReturnType<typeof useBrotoChat>['messages']
  loading: boolean
  endRef: ReturnType<typeof useBrotoChat>['endRef']
}) {
  const { messages, loading, endRef } = props
  return (
    <>
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
    </>
  )
}

function BrotoChatComposer(props: {
  input: string
  setInput: (value: string) => void
  loading: boolean
  historyLoading: boolean
  onSubmit: (e: FormEvent) => void
}) {
  const { input, setInput, loading, historyLoading, onSubmit } = props
  const busy = loading || historyLoading

  return (
    <div className="broto-chat__composer-wrap">
      <form
        className={`broto-chat__composer${busy ? ' broto-chat__composer--busy' : ''}`}
        onSubmit={onSubmit}
        aria-busy={busy}
      >
        <input
          type="text"
          className="broto-input broto-chat__composer-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte algo ao Broto..."
          disabled={busy}
        />
        <button
          type="submit"
          className={`broto-chat__send ${input.trim() && !busy ? 'broto-chat__send--active' : ''}`}
          disabled={busy || !input.trim()}
          aria-label="Enviar mensagem"
        >
          <Send size={16} aria-hidden />
        </button>
      </form>
    </div>
  )
}

function BrotoChatSession({ layout }: { layout: 'page' | 'compact' }) {
  const [mobilePanel, setMobilePanel] = useState<'list' | 'chat'>('chat')

  const {
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
    resetConversation,
    selectSession,
    deleteSession,
    deletingSessionId,
  } = useBrotoChat()

  function handleNewChat() {
    resetConversation()
    if (layout === 'page') setMobilePanel('chat')
  }

  function handleSelectSession(id: string) {
    selectSession(id)
    if (layout === 'page') setMobilePanel('chat')
  }

  const sidebar = (
    <BrotoChatSidebar
      sessions={sessions}
      activeSessionId={sessionId}
      loading={sessionsLoading || historyLoading}
      deletingSessionId={deletingSessionId}
      onSelectSession={handleSelectSession}
      onNewChat={handleNewChat}
      onDeleteSession={(id) => void deleteSession(id)}
    />
  )

  if (layout === 'compact') {
    return (
      <div className="broto-chat broto-chat--compact">
        <div className="broto-chat__scroll">
          <BrotoChatThread messages={messages} loading={loading} endRef={endRef} />
        </div>
        <BrotoChatComposer
          input={input}
          setInput={setInput}
          loading={loading}
          historyLoading={historyLoading}
          onSubmit={handleSubmit}
        />
      </div>
    )
  }

  return (
    <div className="broto-chat broto-chat--with-sidebar">
      <div className="broto-chat__mobile-tabs" role="tablist" aria-label="Painéis do chat">
        <button
          type="button"
          role="tab"
          aria-selected={mobilePanel === 'list'}
          className={`broto-chat__mobile-tab${mobilePanel === 'list' ? ' broto-chat__mobile-tab--active' : ''}`}
          onClick={() => setMobilePanel('list')}
        >
          Conversas
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobilePanel === 'chat'}
          className={`broto-chat__mobile-tab${mobilePanel === 'chat' ? ' broto-chat__mobile-tab--active' : ''}`}
          onClick={() => setMobilePanel('chat')}
        >
          Chat
        </button>
      </div>

      <div
        className={`broto-chat__sidebar-panel${mobilePanel === 'list' ? ' broto-chat__sidebar-panel--visible' : ''}`}
      >
        {sidebar}
      </div>

      <div
        className={`broto-chat__main-panel${mobilePanel === 'chat' ? ' broto-chat__main-panel--visible' : ''}`}
      >
        <div className="broto-chat__scroll">
          {historyLoading && messages.length <= 1 ? (
            <p className="broto-chat__history-loading" role="status">
              Carregando conversa…
            </p>
          ) : (
            <BrotoChatThread messages={messages} loading={loading} endRef={endRef} />
          )}
        </div>
        <BrotoChatComposer
          input={input}
          setInput={setInput}
          loading={loading}
          historyLoading={historyLoading}
          onSubmit={handleSubmit}
        />
      </div>

      <div className="broto-chat__desktop-sidebar">{sidebar}</div>
    </div>
  )
}

export function BrotoChat({ layout = 'page' }: BrotoChatProps) {
  const { currentClass, loading: classLoading } = useClass()
  const chatReady = isClassAiChatReady(currentClass)

  if (classLoading) {
    return <div className="broto-chat broto-chat--loading" aria-busy="true" />
  }

  if (!chatReady) {
    return (
      <div className="broto-chat">
        <BrotoChatUnavailableState />
      </div>
    )
  }

  return <BrotoChatSession key={currentClass!.id} layout={layout} />
}
