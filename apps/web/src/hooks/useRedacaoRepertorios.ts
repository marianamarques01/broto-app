import { useEffect, useState } from 'react'
import {
  mapRedacaoRepertorioRow,
  type RedacaoCompetencia,
  type RedacaoEixoTematico,
  type RedacaoRepertorio,
  type RedacaoRepertorioRowLike,
} from '@broto/shared'
import { supabase } from '@/lib/supabase'
import { useClass } from '@/hooks/useClass'

type UseRedacaoRepertoriosOptions = {
  eixoTematico?: RedacaoEixoTematico | null
  competenciaAlvo?: RedacaoCompetencia | null
}

export function useRedacaoRepertorios(options: UseRedacaoRepertoriosOptions = {}) {
  const { currentClass } = useClass()
  const classId = currentClass?.id
  const eixoTematico = options.eixoTematico
  const competenciaAlvo = options.competenciaAlvo
  const [repertorios, setRepertorios] = useState<RedacaoRepertorio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (!cancelled) {
          setRepertorios([])
          setError('Faça login para ver repertórios.')
          setLoading(false)
        }
        return
      }

      let query = supabase
        .from('redacao_repertorios')
        .select('*')
        .eq('ativo', true)
        .order('updated_at', { ascending: false })

      if (classId) {
        query = query.or(`class_id.is.null,class_id.eq.${classId}`)
      } else {
        query = query.is('class_id', null)
      }

      if (eixoTematico) {
        query = query.or(`eixo_tematico.is.null,eixo_tematico.eq.${eixoTematico}`)
      }

      if (competenciaAlvo) {
        query = query.or(`competencia_alvo.is.null,competencia_alvo.eq.${competenciaAlvo}`)
      }

      const { data, error: fetchError } = await query
      if (cancelled) return

      if (fetchError) {
        console.error('[useRedacaoRepertorios]', fetchError.message)
        setRepertorios([])
        setError(
          fetchError.code === '42P01'
            ? 'Módulo de redação ainda não está no banco. Rode a migration REDA-01.'
            : 'Não foi possível carregar repertórios.',
        )
      } else {
        setRepertorios((data as RedacaoRepertorioRowLike[]).map(mapRedacaoRepertorioRow))
        setError(null)
      }

      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [classId, competenciaAlvo, eixoTematico])

  return { repertorios, loading, error }
}
