import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

/** Chave estável yyyy-m-d no calendário local (month 0–11 no segmento do meio). */
export function localDayKey(y: number, monthIndex: number, day: number): string {
  return `${y}-${monthIndex}-${day}`
}

function parseLocalDayKey(key: string): { y: number; m: number; d: number } {
  const [ys, ms, ds] = key.split('-')
  return { y: Number(ys), m: Number(ms), d: Number(ds) }
}

/**
 * Dias do mês em que o aluno registrou ao menos uma resposta (`user_question_answers`).
 * Quando houver tabelas `study_sessions` / `mission_completions`, este hook pode unir fontes.
 */
export function useStudyActivityDays(year: number, monthIndex: number): {
  keys: Set<string>
  loading: boolean
} {
  const [keys, setKeys] = useState<Set<string>>(() => new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) {
        if (!cancelled) setLoading(false)
        return
      }

      const start = new Date(year, monthIndex, 1)
      const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999)
      const fetchFrom = new Date(start)
      fetchFrom.setDate(fetchFrom.getDate() - 2)
      const fetchTo = new Date(end)
      fetchTo.setDate(fetchTo.getDate() + 2)

      const { data, error } = await supabase
        .from('user_question_answers')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', fetchFrom.toISOString())
        .lte('created_at', fetchTo.toISOString())

      if (cancelled) return

      if (error) {
        console.error('[useStudyActivityDays]', error.message)
        setKeys(new Set())
        setLoading(false)
        return
      }

      const set = new Set<string>()
      for (const row of data ?? []) {
        const d = new Date(row.created_at as string)
        const k = localDayKey(d.getFullYear(), d.getMonth(), d.getDate())
        const { y, m } = parseLocalDayKey(k)
        if (y === year && m === monthIndex) set.add(k)
      }
      setKeys(set)
      setLoading(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [year, monthIndex])

  return { keys, loading }
}
