import { getAreaColor } from '@/lib/area-config'
import { getSegundaDaSemana, datasDaSemana } from '@/lib/routine'

interface DiaRotina {
  idx: number
  labelCurto: string
  ehHoje: boolean
  ehPassado: boolean
  ehDescanso: boolean
  area: { value: string } | null
}

interface WeekStripProps {
  rotina: DiaRotina[]
}

export function WeekStrip({ rotina }: WeekStripProps) {
  const segunda = getSegundaDaSemana(new Date())
  const datas = datasDaSemana(segunda)

  return (
    <div className="broto-week-strip">
      {rotina.map((dia, i) => {
        const dayNum = datas[i].getDate()
        const dotColor = dia.ehDescanso || !dia.area
          ? 'var(--text-muted)'
          : getAreaColor(dia.area.value)

        return (
          <div key={dia.idx} className="broto-week-day">
            <div className={`broto-week-day__letter${dia.ehHoje ? ' broto-week-day__letter--today' : ''}`}>
              {dia.labelCurto}
            </div>
            <div className={`broto-week-day__num${dia.ehHoje ? ' broto-week-day__num--today' : dia.ehPassado ? ' broto-week-day__num--past' : ''}`}>
              {dayNum}
            </div>
            <div
              className="broto-week-day__dot"
              style={{
                background: dia.ehPassado ? `${dotColor}66` : dotColor,
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
