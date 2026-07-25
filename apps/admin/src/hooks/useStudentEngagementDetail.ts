import { useCallback, useEffect, useState } from 'react'
import { isPracticeSessionSummary } from '@broto/shared'
import type { StudentEngagementRow } from '@broto/shared'
import { supabase } from '@/lib/supabase'
import { useEngagementClass } from '@/hooks/useEngagementClass'

export type RecentSessionRow = {
  id: string
  createdAt: string
  completedAt: string | null
  kind: string
  totalQuestions: number
  totalCorrect: number
  percentCorrect: number
}

export type StudentActivityStats = {
  answers7d: number
  correct7d: number
  incorrect7d: number
  lastActivityAt: string | null
}

export function useStudentEngagementDetail(classId: string | undefined, studentId: string | undefined) {
  const { data: engagement, loading: engagementLoading, setFollowUp } = useEngagementClass(classId)
  const [sessions, setSessions] = useState<RecentSessionRow[]>([])
  const [activity, setActivity] = useState<StudentActivityStats | null>(null)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const studentRow: StudentEngagementRow | null =
    engagement?.snapshot?.students.find((s) => s.userId === studentId) ?? null

  const inFollowUp =
    engagement?.followUps.some((f) => f.studentId === studentId) ?? false

  const loadSessionsAndActivity = useCallback(async () => {
    if (!studentId) return
    setSessionsLoading(true)
    setError(null)

    const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString()

    const [sessionsRes, answersRes, lastAnswerRes] = await Promise.all([
      supabase
        .from('practice_sessions')
        .select('id, created_at, completed_at, kind, summary')
        .eq('user_id', studentId)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('user_question_answers')
        .select('is_correct')
        .eq('user_id', studentId)
        .gte('created_at', since7d),
      supabase
        .from('user_question_answers')
        .select('created_at')
        .eq('user_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (sessionsRes.error || answersRes.error || lastAnswerRes.error) {
      setError(
        sessionsRes.error?.message ??
          answersRes.error?.message ??
          lastAnswerRes.error?.message ??
          'Erro ao carregar atividade',
      )
      setSessionsLoading(false)
      return
    }

    const mappedSessions: RecentSessionRow[] = (sessionsRes.data ?? []).map((row) => {
      const summary = row.summary
      const parsed = isPracticeSessionSummary(summary) ? summary : null
      const totalQuestions = parsed?.totalQuestoes ?? 0
      const totalCorrect = parsed?.totalCorretas ?? 0
      const percentCorrect =
        totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

      return {
        id: row.id as string,
        createdAt: row.created_at as string,
        completedAt: (row.completed_at as string | null) ?? null,
        kind: row.kind as string,
        totalQuestions,
        totalCorrect,
        percentCorrect,
      }
    })

    const answers = answersRes.data ?? []
    const correct7d = answers.filter((a) => a.is_correct === true).length
    const incorrect7d = answers.filter((a) => a.is_correct === false).length

    setSessions(mappedSessions)
    setActivity({
      answers7d: answers.length,
      correct7d,
      incorrect7d,
      lastActivityAt: (lastAnswerRes.data?.created_at as string | null) ?? null,
    })
    setSessionsLoading(false)
  }, [studentId])

  useEffect(() => {
    if (!studentId) return

    let cancelled = false

    async function load() {
      setSessionsLoading(true)
      setError(null)

      const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString()

      const [sessionsRes, answersRes, lastAnswerRes] = await Promise.all([
        supabase
          .from('practice_sessions')
          .select('id, created_at, completed_at, kind, summary')
          .eq('user_id', studentId)
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('user_question_answers')
          .select('is_correct')
          .eq('user_id', studentId)
          .gte('created_at', since7d),
        supabase
          .from('user_question_answers')
          .select('created_at')
          .eq('user_id', studentId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      if (cancelled) return

      if (sessionsRes.error || answersRes.error || lastAnswerRes.error) {
        setError(
          sessionsRes.error?.message ??
            answersRes.error?.message ??
            lastAnswerRes.error?.message ??
            'Erro ao carregar atividade',
        )
        setSessionsLoading(false)
        return
      }

      const mappedSessions: RecentSessionRow[] = (sessionsRes.data ?? []).map((row) => {
        const summary = row.summary
        const parsed = isPracticeSessionSummary(summary) ? summary : null
        const totalQuestions = parsed?.totalQuestoes ?? 0
        const totalCorrect = parsed?.totalCorretas ?? 0
        const percentCorrect =
          totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

        return {
          id: row.id as string,
          createdAt: row.created_at as string,
          completedAt: (row.completed_at as string | null) ?? null,
          kind: row.kind as string,
          totalQuestions,
          totalCorrect,
          percentCorrect,
        }
      })

      const answers = answersRes.data ?? []
      const correct7d = answers.filter((a) => a.is_correct === true).length
      const incorrect7d = answers.filter((a) => a.is_correct === false).length

      setSessions(mappedSessions)
      setActivity({
        answers7d: answers.length,
        correct7d,
        incorrect7d,
        lastActivityAt: (lastAnswerRes.data?.created_at as string | null) ?? null,
      })
      setSessionsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [studentId])

  return {
    studentRow,
    sessions,
    activity,
    inFollowUp,
    loading: engagementLoading || sessionsLoading,
    error,
    setFollowUp,
    reload: loadSessionsAndActivity,
  }
}
