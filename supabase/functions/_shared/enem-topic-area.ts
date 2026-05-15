/** Prefixo de `topic_performance.topico_value` quando não há linha em `question_topic_mapping` mas o cliente envia `areaKey`. */
export const AREA_ROLLUP_PREFIX = '__area__:'

/** Slugs de área ENEM válidos nos apps (fallback de agregação). */
export const ENEM_AREA_KEY_SET = new Set<string>([
  'linguagens',
  'ciencias-humanas',
  'ciencias-natureza',
  'matematica',
])

export function isEnemAreaKey(areaKey: string): boolean {
  return ENEM_AREA_KEY_SET.has(areaKey)
}

export function rollupTopicPerformanceSlug(areaKey: string): string {
  return `${AREA_ROLLUP_PREFIX}${areaKey}`
}

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
  if (topico.startsWith(AREA_ROLLUP_PREFIX)) {
    const slug = topico.slice(AREA_ROLLUP_PREFIX.length)
    return ENEM_AREA_KEY_SET.has(slug) ? slug : 'outros'
  }
  return TOPICO_TO_AREA[topico] ?? 'outros'
}

/** Área do dia / agregados: prioriza tópico do catálogo; senão `areaKey` persistido no insert. */
export function areaKeyForPracticeAnswer(attribution: {
  topicoSlug: string | null | undefined
  clientAreaKey: string | null | undefined
}): string {
  const topico =
    attribution.topicoSlug != null && String(attribution.topicoSlug).trim()
      ? String(attribution.topicoSlug).trim()
      : ''
  if (topico) return areaKeyFromTopico(topico)
  const areaKey =
    attribution.clientAreaKey != null && String(attribution.clientAreaKey).trim()
      ? String(attribution.clientAreaKey).trim()
      : ''
  if (areaKey && isEnemAreaKey(areaKey)) return areaKey
  return 'outros'
}
