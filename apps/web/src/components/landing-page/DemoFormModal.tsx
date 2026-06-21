import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import {
  LP_CTA_LABEL,
  LP_FORM_MICROCOPY,
  LP_FORM_PROFILES,
  LP_FORM_STUDENT_RANGES,
} from '@/lib/landing-page-content'

type DemoFormModalProps = {
  open: boolean
  onClose: () => void
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href]'

export function DemoFormModal({ open, onClose }: DemoFormModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    dialog?.querySelector<HTMLElement>('input, select')?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
  }, [])

  if (!open) return null

  return (
    <div
      className="blp-modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className="blp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blp-demo-title"
      >
        <button type="button" className="blp-modal__close" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>

        {submitted ? (
          <div className="blp-modal__success" role="status">
            <span className="blp-modal__success-icon">
              <CheckCircle2 size={28} />
            </span>
            <p className="blp-modal__success-title">Solicitação recebida</p>
            <p className="blp-modal__success-text">{LP_FORM_MICROCOPY}</p>
          </div>
        ) : (
          <>
            <h2 id="blp-demo-title" className="blp-modal__title">
              {LP_CTA_LABEL}
            </h2>
            <p className="blp-modal__desc">
              30 minutos, sem compromisso — de preferência com um material real da sua instituição.
            </p>
            <form className="blp-modal__form" onSubmit={handleSubmit}>
              <label className="blp-modal__field">
                <span>Nome</span>
                <input name="name" type="text" autoComplete="name" required />
              </label>
              <label className="blp-modal__field">
                <span>E-mail institucional</span>
                <input name="email" type="email" autoComplete="email" required />
              </label>
              <label className="blp-modal__field">
                <span>Instituição</span>
                <input name="organization" type="text" autoComplete="organization" required />
              </label>
              <label className="blp-modal__field">
                <span>Nº aproximado de alunos</span>
                <select name="students" defaultValue="" required>
                  <option value="" disabled>
                    Selecione
                  </option>
                  {LP_FORM_STUDENT_RANGES.map((range) => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
              </label>
              <label className="blp-modal__field">
                <span>Perfil</span>
                <select name="profile" defaultValue="" required>
                  <option value="" disabled>
                    Selecione
                  </option>
                  {LP_FORM_PROFILES.map((profile) => (
                    <option key={profile} value={profile}>
                      {profile}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="blp-btn blp-btn--primary blp-modal__submit">
                Confirmar agendamento
              </button>
              <p className="blp-modal__microcopy">{LP_FORM_MICROCOPY}</p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
