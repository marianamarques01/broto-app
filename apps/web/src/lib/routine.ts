import type { AreaStat } from '@/hooks/useProgress'

const LABELS_DIA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
const LABELS_DIA_CURTO = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

export function hojeIdx(): number {
  const d = new Date().getDay()
  return d === 0 ? 6 : d - 1
}

export function getSegundaDaSemana(d: Date): Date {
  const copy = new Date(d)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function datasDaSemana(segunda: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(segunda)
    d.setDate(segunda.getDate() + i)
    return d
  })
}

export function formatarSemana(segunda: Date): string {
  const domingo = new Date(segunda)
  domingo.setDate(segunda.getDate() + 6)
  return `${segunda.getDate()} - ${domingo.getDate()} de ${MESES[segunda.getMonth()]}`
}

export interface DiaRotina {
  idx: number
  label: string
  labelCurto: string
  area: AreaStat | null
  topicosDestaque: { value: string; label: string; accuracyPct: number }[]
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
          .filter(t => t.totalAnswered > 0)
          .sort((a, b) => a.accuracyPct - b.accuracyPct)
          .slice(0, 3)
          .map(t => ({ value: t.value, label: t.label, accuracyPct: t.accuracyPct }))
      : []

    return {
      idx: dayIdx,
      label: LABELS_DIA[dayIdx],
      labelCurto: LABELS_DIA_CURTO[dayIdx],
      area,
      topicosDestaque,
      duracaoMin: areaIdx >= 0 ? horasPorDia * 60 : 0,
      ehDescanso: areaIdx < 0,
      ehHoje: dayIdx === hoje,
      ehPassado: dayIdx < hoje,
    }
  })
}
