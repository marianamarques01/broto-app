import { useState, useEffect } from 'react'
import { getDailyMissionsState, subscribeDailyMissions } from '@/lib/daily-missions'

export function useDailyMissionsState() {
  const [daily, setDaily] = useState(getDailyMissionsState)

  useEffect(() => {
    setDaily(getDailyMissionsState())
    return subscribeDailyMissions(() => setDaily(getDailyMissionsState()))
  }, [])

  return daily
}
