/** @deprecated Sem consumidores — removido de build-home-timeline em 2026-06. */
import type { HomeTimelineEvent, HomeTimelineFilter } from '../types/home-schedule'

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
