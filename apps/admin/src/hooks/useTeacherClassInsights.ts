import { useEffect, useState } from 'react'
import {
  computeClassAreaStats,
  computeClassAtRisk,
  type ClassAreaStat,
  type ClassAtRiskData,
  type TopicPerformanceInsightRow,
} from '@broto/shared'
import { supabase } from '@/lib/supabase'

const INACTIVE_DAYS = 7

export type TeacherClassInsights = {
  classId: string
  studentCount: number
  areaStats: ClassAreaStat[]
  atRisk: ClassAtRiskData
}

export function useTeacherClassInsights(classId: string) {
  const [insights, setInsights] = useState<TeacherClassInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const { data: enrollments, error: enrollErr } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('class_id', classId)
        .eq('status', 'active')

      if (enrollErr) {
        if (!cancelled) {
          setError(enrollErr.message)
          setLoading(false)
        }
        return
      }

      const studentIds = enrollments?.map((e) => e.student_id) ?? []

      if (studentIds.length === 0) {
        if (!cancelled) {
          setInsights({
            classId,
            studentCount: 0,
            areaStats: [],
            atRisk: { inactive: [], struggling: [] },
          })
          setLoading(false)
        }
        return
      }

      const since = new Date(Date.now() - INACTIVE_DAYS * 86_400_000).toISOString()

      const [usersRes, perfRes, recentRes] = await Promise.all([
        supabase.from('users').select('id, nome, streak').in('id', studentIds),
        supabase
          .from('topic_performance')
          .select('user_id, area_key, topico_value, p_know, last_practiced')
          .in('user_id', studentIds),
        supabase
          .from('user_question_answers')
          .select('user_id')
          .in('user_id', studentIds)
          .gte('created_at', since),
      ])

      if (usersRes.error || perfRes.error || recentRes.error) {
        const msg =
          usersRes.error?.message ?? perfRes.error?.message ?? recentRes.error?.message ?? 'Erro'
        if (!cancelled) {
          setError(msg)
          setLoading(false)
        }
        return
      }

      const performance = (perfRes.data ?? []) as TopicPerformanceInsightRow[]
      const studentNames = new Map((usersRes.data ?? []).map((u) => [u.id, u.nome ?? 'Aluno']))
      const studentStreaks = new Map((usersRes.data ?? []).map((u) => [u.id, u.streak ?? 0]))
      const activeStudentIds = new Set((recentRes.data ?? []).map((a) => a.user_id))

      const areaStats = computeClassAreaStats(performance)
      const atRisk = computeClassAtRisk({
        studentIds,
        studentNames,
        studentStreaks,
        activeStudentIds,
        performance,
      })

      if (!cancelled) {
        setInsights({
          classId,
          studentCount: studentIds.length,
          areaStats,
          atRisk,
        })
        setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [classId])

  return { insights, loading, error }
}
