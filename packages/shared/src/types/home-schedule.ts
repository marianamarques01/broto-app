/** Eventos agregados na timeline da Home (web / mobile). */
export type HomeTimelineFilter = 'all' | 'study' | 'missions' | 'review'

export type HomeTimelineEventKind = 'study' | 'mission' | 'review' | 'pet'

export type HomeTimelineEventStatus = 'pending' | 'in_progress' | 'done'

export interface HomeTimelineEvent {
  id: string
  kind: HomeTimelineEventKind
  iconEmoji: string
  title: string
  subtitle: string
  /** Minutos desde 00:00 no fuso local (início do slot). */
  startMinutes: number
  /** Minutos desde 00:00 no fuso local (fim exclusivo ou inclusivo — ver utilitário de layout). */
  endMinutes: number
  status: HomeTimelineEventStatus
  /** Missões futuras dependentes de uma missão anterior não devem parecer acionáveis. */
  locked?: boolean
  /** Slug da área associada (ex.: 'linguagens', 'matematica'). Usado para cor/ícone na timeline. */
  areaSlug?: string
  /** XP total da missão ao concluir (badge raio + valor). */
  xpTotal?: number
}

export interface BuildHomeTimelineParams {
  /** Hora base do primeiro bloco (ex.: 8 = 08:00). */
  dayStartHour: number
  horasPorDia: number
  questoesHoje: number
  dailyQuestionsGoal: number
  dia: {
    ehDescanso: boolean
    areaLabel: string | null
    areaSlug: string | null
    duracaoMin: number
  } | null
  missions: Array<{
    title: string
    subtitle: string
    done: boolean
    locked: boolean
    areaSlug?: string
    xpTotal?: number
  }>
  review: {
    title: string
    subtitle: string
    areaSlug?: string
  }
  pet: {
    faseLabel: string
    streak: number
  }
  nowMinutes: number
}
