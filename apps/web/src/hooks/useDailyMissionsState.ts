import { useState, useEffect } from 'react'
import type { DailyMissionsState } from '@broto/shared'
import { getDailyMissionsState, subscribeDailyMissions } from '@/lib/daily-missions'

const emptyDaily = (): DailyMissionsState => ({ date: '', byArea: {} })

export function useDailyMissionsState(): {
  daily: DailyMissionsState
  error: string | null
} {
  const [daily, setDaily] = useState<DailyMissionsState>(emptyDaily)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    getDailyMissionsState()
      .then((s) => {
        if (alive) {
          setDaily(s)
          setError(null)
        }
      })
      .catch((e) => {
        if (alive) {
          setError(e instanceof Error ? e.message : 'Erro ao carregar missões do dia')
          setDaily(emptyDaily())
        }
      })
    const unsub = subscribeDailyMissions(() => {
      getDailyMissionsState()
        .then((s) => {
          if (alive) {
            setDaily(s)
            setError(null)
          }
        })
        .catch((e) => {
          if (alive) {
            setError(e instanceof Error ? e.message : 'Erro ao carregar missões do dia')
          }
        })
    })
    return () => {
      alive = false
      unsub()
    }
  }, [])

  return { daily, error }
}
