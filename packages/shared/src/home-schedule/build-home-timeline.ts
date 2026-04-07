import type {
  BuildHomeTimelineParams,
  HomeTimelineEvent,
  HomeTimelineEventStatus,
  HomeTimelineFilter,
} from '../types/home-schedule'

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function missionStatus(
  done: boolean,
  locked: boolean,
  now: number,
  start: number,
  end: number,
): HomeTimelineEventStatus {
  if (done) return 'done'
  if (locked) return 'pending'
  if (now >= start && now < end) return 'in_progress'
  return 'pending'
}

function studyStatus(
  ehDescanso: boolean,
  questoesHoje: number,
  goal: number,
  now: number,
  start: number,
  end: number,
): HomeTimelineEventStatus {
  if (ehDescanso) return 'pending'
  if (questoesHoje >= goal) return 'done'
  if (now >= start && now < end) return 'in_progress'
  return 'pending'
}

/**
 * Monta a lista de eventos do dia para a timeline da Home.
 * Horários são sugestivos (planejamento), alinhados à rotina semanal e missões diárias.
 */
export function buildHomeTimelineEvents(p: BuildHomeTimelineParams): HomeTimelineEvent[] {
  const startDay = p.dayStartHour * 60
  let cursor = startDay

  const studyDur = Math.round(clamp(p.horasPorDia * 25, 30, 120))
  const gap = 15

  const events: HomeTimelineEvent[] = []

  const descanso = p.dia?.ehDescanso ?? false
  const area = p.dia?.areaLabel ?? null
  const duracao = p.dia?.duracaoMin ?? 0

  const studyStart = cursor
  const studyEnd = cursor + studyDur
  cursor = studyEnd + gap

  events.push({
    id: 'study-main',
    kind: 'study',
    iconEmoji: '\u{1F4DA}',
    title: descanso
      ? 'Dia de descanso'
      : area
        ? `Sessão: ${area}`
        : 'Sessão de estudo',
    subtitle: descanso
      ? 'Sem bloco principal hoje — relaxe e volte amanhã.'
      : `Plano de ~${duracao || studyDur} min na sua rotina`,
    startMinutes: studyStart,
    endMinutes: studyEnd,
    status: studyStatus(descanso, p.questoesHoje, p.dailyQuestionsGoal, p.nowMinutes, studyStart, studyEnd),
    areaSlug: p.dia?.areaSlug ?? undefined,
  })

  p.missions.forEach((m, i) => {
    const s = cursor
    const e = cursor + 30
    cursor = e + gap
    events.push({
      id: `mission-${i}`,
      kind: 'mission',
      iconEmoji: '\u{1F3AF}',
      title: m.title,
      subtitle: m.subtitle,
      startMinutes: s,
      endMinutes: e,
      status: missionStatus(m.done, m.locked, p.nowMinutes, s, e),
      areaSlug: m.areaSlug,
      xpTotal: m.xpTotal,
    })
  })

  const revStart = cursor
  const revEnd = cursor + 35
  cursor = revEnd + gap

  const reviewDone = false
  events.push({
    id: 'review-flash',
    kind: 'review',
    iconEmoji: '\u{1F504}',
    title: p.review.title,
    subtitle: p.review.subtitle,
    startMinutes: revStart,
    endMinutes: revEnd,
    status: reviewDone
      ? 'done'
      : p.nowMinutes >= revStart && p.nowMinutes < revEnd
        ? 'in_progress'
        : 'pending',
    areaSlug: p.review.areaSlug,
  })

  const petStart = 19 * 60
  const petEnd = petStart + 20
  const petNeedWater = p.pet.streak > 0 && p.questoesHoje < p.dailyQuestionsGoal
  events.push({
    id: 'pet-care',
    kind: 'pet',
    iconEmoji: '\u{1F331}',
    title: 'Cuidar do Broto',
    subtitle:
      p.pet.streak > 0
        ? `Fase ${p.pet.faseLabel} · sequência de ${p.pet.streak} dia(s)`
        : `Fase ${p.pet.faseLabel} — registre atividade hoje`,
    startMinutes: petStart,
    endMinutes: petEnd,
    status:
      p.questoesHoje >= p.dailyQuestionsGoal
        ? 'done'
        : petNeedWater && p.nowMinutes >= petStart && p.nowMinutes < petEnd
          ? 'in_progress'
          : p.questoesHoje > 0
            ? 'in_progress'
            : 'pending',
  })

  return events
}

export function filterHomeTimelineEvents(
  events: HomeTimelineEvent[],
  filter: HomeTimelineFilter,
): HomeTimelineEvent[] {
  if (filter === 'all') return events
  if (filter === 'study') return events.filter((e) => e.kind === 'study')
  if (filter === 'missions') return events.filter((e) => e.kind === 'mission')
  if (filter === 'review') return events.filter((e) => e.kind === 'review')
  return events
}
