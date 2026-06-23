import { MessageSquarePlus, MessagesSquare, Trash2 } from 'lucide-react'
import { formatSessionDate, type BrotoChatSessionItem } from '@/hooks/useBrotoChat'

type BrotoChatSidebarProps = {
  sessions: BrotoChatSessionItem[]
  activeSessionId: string
  loading: boolean
  deletingSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onNewChat: () => void
  onDeleteSession: (sessionId: string) => void
}

export function BrotoChatSidebar({
  sessions,
  activeSessionId,
  loading,
  deletingSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}: BrotoChatSidebarProps) {
  return (
    <aside className="broto-chat-sidebar" aria-label="Conversas com o Broto">
      <div className="broto-chat-sidebar__header">
        <h2 className="broto-chat-sidebar__title">Conversas</h2>
        <button
          type="button"
          className="broto-chat-sidebar__new"
          onClick={onNewChat}
          disabled={loading || deletingSessionId !== null}
        >
          <MessageSquarePlus size={16} aria-hidden />
          Nova conversa
        </button>
      </div>

      <div className="broto-chat-sidebar__list" aria-busy={loading}>
        {loading && sessions.length === 0 ? (
          <p className="broto-chat-sidebar__empty">Carregando conversas…</p>
        ) : sessions.length === 0 ? (
          <p className="broto-chat-sidebar__empty">
            Nenhuma conversa ainda. Envie a primeira mensagem ao Broto.
          </p>
        ) : (
          <ul className="broto-chat-sidebar__items">
            {sessions.map((session) => {
              const isActive = session.sessionId === activeSessionId
              const isDeleting = deletingSessionId === session.sessionId
              return (
                <li
                  key={session.sessionId}
                  className={`broto-chat-sidebar__row${isActive ? ' broto-chat-sidebar__row--active' : ''}`}
                >
                  <button
                    type="button"
                    className="broto-chat-sidebar__item"
                    onClick={() => onSelectSession(session.sessionId)}
                    aria-current={isActive ? 'true' : undefined}
                    disabled={isDeleting}
                  >
                    <span className="broto-chat-sidebar__item-icon" aria-hidden>
                      <MessagesSquare size={15} strokeWidth={2} />
                    </span>
                    <span className="broto-chat-sidebar__item-body">
                      <span className="broto-chat-sidebar__item-preview">{session.preview}</span>
                      <span className="broto-chat-sidebar__item-meta">
                        {formatSessionDate(session.lastMessageAt)}
                        {session.turnCount > 1 ? ` · ${session.turnCount} turnos` : ''}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="broto-chat-sidebar__delete"
                    onClick={() => onDeleteSession(session.sessionId)}
                    disabled={loading || deletingSessionId !== null}
                    aria-label={`Excluir conversa: ${session.preview}`}
                    title="Excluir conversa"
                  >
                    <Trash2 size={15} strokeWidth={2} aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}
