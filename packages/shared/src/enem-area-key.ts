/**
 * Slugs de área ENEM nos apps (`useQuestionsFilters`, `AREA_CONFIG`, Edge `answer-question`).
 */

/** Igual a `AREA_ROLLUP_PREFIX` em `supabase/functions/_shared/enem-topic-area.ts`. */
export const AREA_ROLLUP_TOPIC_PREFIX = '__area__:'

/** Tópico sintético quando há resposta com área mas sem `question_topic_mapping`. Não é um tópico de estudo. */
export function isAreaRollupTopicValue(value: string): boolean {
  return typeof value === 'string' && value.startsWith(AREA_ROLLUP_TOPIC_PREFIX)
}

const ENEM_AREA_KEYS = new Set([
  'linguagens',
  'ciencias-humanas',
  'ciencias-natureza',
  'matematica',
])

export type EnemAreaKey = 'linguagens' | 'ciencias-humanas' | 'ciencias-natureza' | 'matematica'

const ENEM_AREA_KEY_SET: ReadonlySet<string> = ENEM_AREA_KEYS

/** Aceita apenas slug canónico; evita enviar placeholders (`outros`) que a Edge ignora como `answer_area_key`. */
export function parseEnemAreaKey(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const t = raw.trim()
  return ENEM_AREA_KEY_SET.has(t) ? (t as EnemAreaKey) : undefined
}

/** Área contável em progresso e missões — exclui bucket interno `outros`. */
export function isCountablePracticeArea(areaKey: string): boolean {
  return areaKey !== 'outros' && ENEM_AREA_KEY_SET.has(areaKey)
}
