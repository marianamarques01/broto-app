import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Tipos locais adaptados ao schema real (public.users + public.pets + public.topic_performance)
type StudentIndicator = {
  student_id: string
  nome: string
  image: string | null
  total_questions: number
  correct_answers: number
  accuracy_rate: number
  streak: number
  xp: number
  nivel: number
  weak_topics: string[]
}

export type ClassIndicatorsData = {
  class_id: string
  total_students: number
  active_students: number
  avg_accuracy_rate: number
  avg_streak: number
  students: StudentIndicator[]
}

export function useClassIndicators(classId: string) {
  const [indicators, setIndicators] = useState<ClassIndicatorsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)

      // 1. Buscar alunos matriculados com dados de users
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('class_id', classId)
        .eq('status', 'active')

      if (!enrollments || enrollments.length === 0) {
        setIndicators({
          class_id: classId,
          total_students: 0,
          active_students: 0,
          avg_accuracy_rate: 0,
          avg_streak: 0,
          students: [],
        })
        setLoading(false)
        return
      }

      const studentIds = enrollments.map(e => e.student_id)

      // 2. Buscar dados dos users
      const { data: users } = await supabase
        .from('users')
        .select('id, nome, image, streak')
        .in('id', studentIds)

      // 3. Buscar pets (xp, nivel)
      const { data: pets } = await supabase
        .from('pets')
        .select('user_id, xp, nivel')
        .in('user_id', studentIds)

      // 4. Buscar topic_performance
      const { data: topicPerf } = await supabase
        .from('topic_performance')
        .select('user_id, topico_value, total_answered, total_correct, accuracy_pct')
        .in('user_id', studentIds)

      // 5. Buscar atividade recente (ultimos 7 dias) via user_question_answers
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: recentAnswers } = await supabase
        .from('user_question_answers')
        .select('user_id')
        .in('user_id', studentIds)
        .gte('created_at', sevenDaysAgo)

      const activeStudentIds = new Set(recentAnswers?.map(a => a.user_id) ?? [])

      // Indexar por student_id
      const usersMap = new Map((users ?? []).map(u => [u.id, u]))
      const petsMap = new Map((pets ?? []).map(p => [p.user_id, p]))
      const perfByStudent = new Map<string, typeof topicPerf>()
      for (const tp of topicPerf ?? []) {
        const list = perfByStudent.get(tp.user_id) ?? []
        list.push(tp)
        perfByStudent.set(tp.user_id, list)
      }

      // 6. Montar indicadores por aluno
      const students: StudentIndicator[] = studentIds.map(sid => {
        const user = usersMap.get(sid)
        const pet = petsMap.get(sid)
        const perfs = perfByStudent.get(sid) ?? []

        const totalQuestions = perfs.reduce((s, t) => s + (t.total_answered ?? 0), 0)
        const correctAnswers = perfs.reduce((s, t) => s + (t.total_correct ?? 0), 0)
        const accuracyRate = totalQuestions > 0 ? correctAnswers / totalQuestions : 0

        const weakTopics = perfs
          .filter(t => (t.total_answered ?? 0) >= 3)
          .sort((a, b) => {
            const aRate = (a.total_answered ?? 0) > 0 ? (a.total_correct ?? 0) / a.total_answered! : 0
            const bRate = (b.total_answered ?? 0) > 0 ? (b.total_correct ?? 0) / b.total_answered! : 0
            return aRate - bRate
          })
          .slice(0, 3)
          .map(t => t.topico_value)

        return {
          student_id: sid,
          nome: user?.nome ?? 'Aluno',
          image: user?.image ?? null,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          accuracy_rate: accuracyRate,
          streak: user?.streak ?? 0,
          xp: pet?.xp ?? 0,
          nivel: pet?.nivel ?? 1,
          weak_topics: weakTopics,
        }
      })

      const totalStudents = students.length
      const activeStudents = studentIds.filter(id => activeStudentIds.has(id)).length
      const avgAccuracy = totalStudents > 0
        ? students.reduce((s, st) => s + st.accuracy_rate, 0) / totalStudents
        : 0
      const avgStreak = totalStudents > 0
        ? students.reduce((s, st) => s + st.streak, 0) / totalStudents
        : 0

      setIndicators({
        class_id: classId,
        total_students: totalStudents,
        active_students: activeStudents,
        avg_accuracy_rate: avgAccuracy,
        avg_streak: avgStreak,
        students,
      })

      setLoading(false)
    }

    load()
  }, [classId])

  return { indicators, loading }
}
