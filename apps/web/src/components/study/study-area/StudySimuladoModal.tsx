import { MockExamConfigurator } from '@/components/mock-exam/MockExamConfigurator'
import type { StudyPackage } from '@/lib/study-area-mock'

export function StudySimuladoModal({ pkg, onClose }: { pkg: StudyPackage; onClose: () => void }) {
  return (
    <div role="presentation" className="broto-study-simulado-modal-backdrop" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="study-simulado-modal-title"
        className="broto-study-simulado-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="study-simulado-modal-title" className="broto-sr-only">
          Configurar sessão ENEM (estilo simulado)
        </h2>
        <MockExamConfigurator
          variant="modal"
          presetArea={pkg.areaKey}
          presetTopicoValue={pkg.topicoValue}
          presetTopicoLabelHint={pkg.topicoLabel}
          onClose={onClose}
        />
      </div>
    </div>
  )
}
