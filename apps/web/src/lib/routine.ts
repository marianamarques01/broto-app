export const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const

export { gerarRotina, hojeIdx, type DiaRotina, type DiaRotinaTopicoDestaque } from '@broto/shared'

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
