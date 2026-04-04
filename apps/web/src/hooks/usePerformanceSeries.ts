import { useMemo, useState, useEffect } from 'react'
import {
  getPerformanceBuckets,
  subscribePerformanceHistory,
  type PerformancePeriod,
} from '@/lib/performance-history'

export function usePerformanceSeries(period: PerformancePeriod) {
  const [tick, setTick] = useState(0)

  useEffect(() => subscribePerformanceHistory(() => setTick((t) => t + 1)), [])

  return useMemo(() => getPerformanceBuckets(period), [period, tick])
}
