interface MockExamSessionExitModalProps {
  open: boolean
  onClose: () => void
  onSaveAndExit: () => void
  onExitWithoutSave: () => void
  busyAction: 'save' | 'discard' | null
  isDiagnostic?: boolean
}

export function MockExamSessionExitModal({
  open,
  onClose,
  onSaveAndExit,
  onExitWithoutSave,
  busyAction,
  isDiagnostic = false,
}: MockExamSessionExitModalProps) {
  if (!open) return null

  return (
    <div
      className="broto-mock-exam-info-modal-backdrop"
      role="presentation"
      onClick={busyAction ? undefined : onClose}
    >
      <div
        className="broto-mock-exam-info-modal broto-mock-exam-session-exit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="broto-mock-exam-exit-modal-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !busyAction) onClose()
        }}
      >
        <h2
          id="broto-mock-exam-exit-modal-title"
          className="broto-mock-exam-session-exit-modal__title"
        >
          {isDiagnostic
            ? 'Tem certeza que quer sair?'
            : 'Você deseja salvar o progresso da sessão antes de sair?'}
        </h2>
        {isDiagnostic && (
          <p className="broto-mock-exam-session-exit-modal__diagnostic-warning">
            Esta é sua sessão diagnóstica. Se sair agora, o Broto não vai ter dados iniciais para
            personalizar seus estudos desde o começo.
          </p>
        )}
        <div className="broto-mock-exam-session-exit-modal__actions">
          <button
            type="button"
            className="broto-btn-secondary broto-btn-secondary--inline broto-mock-exam-session-exit-modal__btn"
            disabled={busyAction !== null}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="broto-mock-exam-session-exit-modal__btn-danger"
            disabled={busyAction !== null}
            onClick={onExitWithoutSave}
          >
            {busyAction === 'discard' ? 'Saindo…' : 'Sair sem salvar'}
          </button>
          <button
            type="button"
            className="broto-btn-primary broto-btn-primary--inline broto-mock-exam-session-exit-modal__btn-save"
            disabled={busyAction !== null}
            onClick={onSaveAndExit}
          >
            {busyAction === 'save' ? 'Salvando…' : 'Salvar e sair'}
          </button>
        </div>
      </div>
    </div>
  )
}
