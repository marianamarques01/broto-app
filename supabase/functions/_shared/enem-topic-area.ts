/** topico_value (slug) → área ENEM (alinhado a user-progress e AREA_CONFIG do app). */
export const TOPICO_TO_AREA: Record<string, string> = {
  'interpretacao-texto': 'linguagens',
  literatura: 'linguagens',
  gramatica: 'linguagens',
  'generos-textuais': 'linguagens',
  'variacoes-linguisticas': 'linguagens',
  'historia-brasil': 'ciencias-humanas',
  'geografia-politica': 'ciencias-humanas',
  filosofia: 'ciencias-humanas',
  sociologia: 'ciencias-humanas',
  'geografia-fisica': 'ciencias-humanas',
  genetica: 'ciencias-natureza',
  ecologia: 'ciencias-natureza',
  'quimica-organica': 'ciencias-natureza',
  termodinamica: 'ciencias-natureza',
  citologia: 'ciencias-natureza',
  funcoes: 'matematica',
  'geometria-plana': 'matematica',
  probabilidade: 'matematica',
  porcentagem: 'matematica',
  combinatoria: 'matematica',
}

export function areaKeyFromTopico(topico: string | null | undefined): string {
  if (!topico) return 'outros'
  return TOPICO_TO_AREA[topico] ?? 'outros'
}
