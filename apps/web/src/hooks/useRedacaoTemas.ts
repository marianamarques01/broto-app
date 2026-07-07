import { useEffect, useState } from 'react'
import {
  mapRedacaoTemaRow,
  type RedacaoEixoTematico,
  type RedacaoTema,
  type RedacaoTemaRowLike,
} from '@broto/shared'
import { supabase } from '@/lib/supabase'

export function useRedacaoTemas(eixoFilter?: RedacaoEixoTematico) {
  const [temas, setTemas] = useState<RedacaoTema[]>([])
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
          setTemas([])
          setError('Faça login para ver os temas.')
          setLoading(false)
        }
        return
      }

      let query = supabase.from('redacao_temas').select('*').eq('ativo', true).order('titulo')
      if (eixoFilter) {
        query = query.eq('eixo_tematico', eixoFilter)
      }

      const { data, error: fetchError } = await query
      if (cancelled) return

      if (fetchError) {
        console.error('[useRedacaoTemas]', fetchError.message)
        setTemas([])
        setError(
          fetchError.code === '42P01'
            ? 'Módulo de redação ainda não está no banco. Rode a migration REDA-01.'
            : 'Não foi possível carregar os temas.',
        )
      } else {
        setTemas((data as RedacaoTemaRowLike[]).map(mapRedacaoTemaRow))
        setError(null)
      }

      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [eixoFilter])

  return { temas, loading, error }
}

export function useRedacaoTema(temaId: string | undefined) {
  const [tema, setTema] = useState<RedacaoTema | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!temaId) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      setTema(undefined)

      const { data, error: fetchError } = await supabase
        .from('redacao_temas')
        .select('*')
        .eq('id', temaId)
        .eq('ativo', true)
        .maybeSingle()

      if (cancelled) return

      if (fetchError) {
        console.error('[useRedacaoTema]', fetchError.message)
        setTema(undefined)
        setError('Não foi possível carregar o tema.')
      } else if (data) {
        setTema(mapRedacaoTemaRow(data as RedacaoTemaRowLike))
        setError(null)
      } else {
        setTema(undefined)
        setError('Tema não encontrado.')
      }

      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [temaId])

  if (!temaId) {
    return { tema: undefined, loading: false, error: null }
  }

  return { tema, loading, error }
}
