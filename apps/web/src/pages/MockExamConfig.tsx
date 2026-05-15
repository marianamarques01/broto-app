import { useSearchParams } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { MockExamConfigurator } from '@/components/mock-exam/MockExamConfigurator'

export function MockExamConfig() {
  const [searchParams] = useSearchParams()
  const area = searchParams.get('area')
  const topico = searchParams.get('topico')

  return (
    <div className="broto-page broto-page--study">
      <TopBar
        title="Sessão ENEM"
        subtitle="Bloco tipo simulado — você define quantidade e tempo"
        variant="study"
      />
      <div className="broto-main-inner broto-main-inner--mock-exam">
        <MockExamConfigurator variant="page" presetArea={area} presetTopicoValue={topico} />
      </div>
    </div>
  )
}
