import type { AreaStat } from '../types/dashboard-progress'

const LABELS_DIA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
const LABELS_DIA_CURTO = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

export function hojeIdx(): number {
  const d = new Date().getDay()
  return d === 0 ? 6 : d - 1
}

export interface DiaRotinaTopicoDestaque {
  value: string
  label: string
  accuracyPct: number
}

export interface DiaRotina {
  idx: number
  label: string
  labelCurto: string
  area: AreaStat | null
  topicosDestaque: DiaRotinaTopicoDestaque[]
  duracaoMin: number
  ehDescanso: boolean
  ehHoje: boolean
  ehPassado: boolean
}

export function gerarRotina(areas: AreaStat[], horasPorDia: number): DiaRotina[] {
  const ordered = [...areas].sort((a, b) => {
    if (a.totalAnswered === 0 && b.totalAnswered === 0) return 0
    if (a.totalAnswered === 0) return 1
    if (b.totalAnswered === 0) return -1
    return a.accuracyPct - b.accuracyPct
  })
  const PATTERN = [0, 1, 2, 3, 0, 1, -1]
  const hoje = hojeIdx()

  return PATTERN.map((areaIdx, dayIdx) => {
    const area = areaIdx >= 0 && ordered.length > 0 ? ordered[areaIdx % ordered.length] : null
    const topicosDestaque = area
      ? area.topicos
          .filter((t) => t.totalAnswered > 0)
          .sort((a, b) => a.accuracyPct - b.accuracyPct)
          .slice(0, 3)
          .map((t) => ({ value: t.value, label: t.label, accuracyPct: t.accuracyPct }))
      : []

    return {
      idx: dayIdx,
      label: LABELS_DIA[dayIdx]!,
      labelCurto: LABELS_DIA_CURTO[dayIdx]!,
      area,
      topicosDestaque,
      duracaoMin: areaIdx >= 0 ? horasPorDia * 60 : 0,
      ehDescanso: areaIdx < 0,
      ehHoje: dayIdx === hoje,
      ehPassado: dayIdx < hoje,
    }
  })
}
