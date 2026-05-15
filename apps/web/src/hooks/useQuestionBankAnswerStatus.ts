import { useEffect, useMemo, useState } from 'react'
import type { QuestionBankRow } from '@/hooks/useQuestionBank'
import { getQuestionId } from '@broto/shared'
import { supabase } from '@/lib/supabase'

export type QuestionAnswerOutcome = 'correct' | 'wrong'

const IN_CHUNK = 220

/**
 * Último resultado por questão (`question_id`) na lista atual do banco (mais recente em `created_at`).
 */
export function useQuestionBankAnswerStatus(
  rows: QuestionBankRow[],
  bumpVersion: number,
): { statusByQuestionId: ReadonlyMap<string, QuestionAnswerOutcome>; loading: boolean } {
  const [statusByQuestionId, setStatusByQuestionId] = useState<
    ReadonlyMap<string, QuestionAnswerOutcome>
  >(() => new Map())
  const [loading, setLoading] = useState(true)

  const idsKey = useMemo(() => rows.map((r) => getQuestionId(r)).sort().join('|'), [rows])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (rows.length === 0) {
        setStatusByQuestionId(new Map())
        setLoading(false)
        return
      }

      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || cancelled) {
        setStatusByQuestionId(new Map())
        setLoading(false)
        return
      }

      const merged = new Map<string, { at: string; ok: boolean }>()
      const allIds = [...new Set(rows.map((r) => getQuestionId(r)))]

      for (let i = 0; i < allIds.length; i += IN_CHUNK) {
        const slice = allIds.slice(i, i + IN_CHUNK)
        const { data, error } = await supabase
          .from('user_question_answers')
          .select('question_id, acertou, created_at')
          .eq('user_id', user.id)
          .in('question_id', slice)

        if (error) {
          console.error('[useQuestionBankAnswerStatus]', error.message)
          continue
        }

        for (const row of data ?? []) {
          const qid = row.question_id as string
          const at = String(row.created_at ?? '')
          const ok = row.acertou === true
          const prev = merged.get(qid)
          if (!prev || at > prev.at) merged.set(qid, { at, ok })
        }
      }

      if (cancelled) return

      const next = new Map<string, QuestionAnswerOutcome>()
      for (const [qid, v] of merged) {
        next.set(qid, v.ok ? 'correct' : 'wrong')
      }
      setStatusByQuestionId(next)
      setLoading(false)
    }

    void run()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- idsKey cobre o conteúdo de `rows`
  }, [idsKey, bumpVersion])

  return { statusByQuestionId, loading }
}
