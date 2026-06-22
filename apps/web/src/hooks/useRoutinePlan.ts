import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import {
  applySessionPriorityToAreas,
  gerarRotina,
  type AreaStat,
  type DiaRotina,
  type RoutineGenerateResponse,
} from '@broto/shared'

export type RoutinePlanSource = 'fastapi' | 'edge_fallback' | 'local_fallback'

export function useRoutinePlan(
  areas: AreaStat[],
  horasPorDia: number,
  enabled: boolean,
): { rotina: DiaRotina[]; source: RoutinePlanSource; loading: boolean } {
  const [rotina, setRotina] = useState<DiaRotina[]>([])
  const [source, setSource] = useState<RoutinePlanSource>('local_fallback')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    void (async () => {
      setLoading(true)
      try {
        const data = await api.post<RoutineGenerateResponse>('/api/routine/generate')
        if (cancelled) return

        const sessions = Array.isArray(data.sessions) ? data.sessions : []
        const reordered = sessions.length > 0 ? applySessionPriorityToAreas(areas, sessions) : areas
        setRotina(gerarRotina(reordered, horasPorDia))
        setSource(data._source === 'fastapi' ? 'fastapi' : 'edge_fallback')
      } catch {
        if (cancelled) return
        setRotina(gerarRotina(areas, horasPorDia))
        setSource('local_fallback')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [areas, horasPorDia, enabled])

  return {
    rotina: enabled ? rotina : [],
    source: enabled ? source : 'local_fallback',
    loading: !enabled || loading,
  }
}
