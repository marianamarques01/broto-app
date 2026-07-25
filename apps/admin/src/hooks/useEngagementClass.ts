import { useCallback, useEffect, useState } from 'react'
import type {
  EngagementClassGetResponse,
  StudentFollowUpSetRequest,
  StudentFollowUpSetResponse,
} from '@broto/shared'
import { api } from '@/lib/api-client'

export function useEngagementClass(classId: string | undefined) {
  const [data, setData] = useState<EngagementClassGetResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!classId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.getWithParams<EngagementClassGetResponse>('engagement-class-get', {
        classId,
      })
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar engajamento')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [classId])

  useEffect(() => {
    if (!classId) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await api.getWithParams<EngagementClassGetResponse>('engagement-class-get', {
          classId,
        })
        if (!cancelled) setData(res)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erro ao carregar engajamento')
          setData(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [classId])

  const setFollowUp = useCallback(
    async (payload: StudentFollowUpSetRequest) => {
      await api.post<StudentFollowUpSetResponse>('student-follow-up-set', { ...payload })
      await reload()
    },
    [reload],
  )

  return { data, loading, error, reload, setFollowUp }
}
