import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { BrotoChatModal } from '@/components/broto/BrotoChatModal'

/** Rota da página de chat em tela cheia — não mostrar FAB duplicado. */
const BROTO_FULL_CHAT_PATH = '/broto'

export function BrotoIaFab() {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  if (location.pathname === BROTO_FULL_CHAT_PATH) {
    return null
  }

  return (
    <>
      <div className="broto-fab-ia-wrap" role="presentation">
        <span className="broto-fab-ia-ring" aria-hidden />
        <span className="broto-fab-ia-glow" aria-hidden />
        <button
          type="button"
          className="broto-fab-ia"
          title="Conversar com o Broto (IA)"
          aria-label="Conversar com o Broto (IA)"
          aria-expanded={open}
          aria-controls="broto-chat-floating-panel"
          onClick={() => setOpen(true)}
        >
          {'\u{1F331}'}
        </button>
      </div>

      {open ? <BrotoChatModal onClose={() => setOpen(false)} /> : null}
    </>
  )
}
