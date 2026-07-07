import { useCallback, useEffect, useRef, useState } from 'react'
import { countLinhasRedacao, type RedacaoModo } from '@broto/shared'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useClass } from '@/hooks/useClass'

type DraftState = {
  id: string
  texto: string
  linha_count: number
  tempo_segundos: number | null
  modo: RedacaoModo
}

type SaveDraftInput = {
  texto: string
  modo: RedacaoModo
  tempoSegundos: number | null
}

export function useRedacaoDraft(temaId: string | undefined) {
  const { effectiveActiveOrganizationId } = useOrganization()
  const { currentClass } = useClass()
  const classId = currentClass?.id ?? null
  const [draft, setDraft] = useState<DraftState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const draftIdRef = useRef<string | null>(null)

  useEffect(() => {
    draftIdRef.current = draft?.id ?? null
  }, [draft?.id])

  useEffect(() => {
    if (!temaId) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (!cancelled) {
          setDraft(null)
          setLoading(false)
        }
        return
      }

      const { data, error: fetchError } = await supabase
        .from('redacoes')
        .select('id, texto, linha_count, tempo_segundos, modo')
        .eq('user_id', user.id)
        .eq('tema_id', temaId)
        .eq('status', 'rascunho')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cancelled) return

      if (fetchError) {
        console.error('[useRedacaoDraft] load:', fetchError.message)
        setError('Não foi possível carregar o rascunho.')
        setDraft(null)
      } else if (data) {
        setDraft(data as DraftState)
      } else {
        setDraft(null)
      }

      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [temaId])

  const saveDraft = useCallback(
    async (input: SaveDraftInput): Promise<boolean> => {
      if (!temaId || !effectiveActiveOrganizationId) {
        setError('Organização não configurada.')
        return false
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('Faça login para salvar.')
        return false
      }

      setSaving(true)
      setError(null)

      const linha_count = countLinhasRedacao(input.texto)
      const payload = {
        texto: input.texto,
        linha_count,
        tempo_segundos: input.tempoSegundos,
        modo: input.modo,
        status: 'rascunho' as const,
        organization_id: effectiveActiveOrganizationId,
        class_id: classId,
        user_id: user.id,
        tema_id: temaId,
      }

      const existingId = draftIdRef.current
      const result = existingId
        ? await supabase
            .from('redacoes')
            .update(payload)
            .eq('id', existingId)
            .select('id, texto, linha_count, tempo_segundos, modo')
            .single()
        : await supabase
            .from('redacoes')
            .insert(payload)
            .select('id, texto, linha_count, tempo_segundos, modo')
            .single()

      setSaving(false)

      if (result.error) {
        console.error('[useRedacaoDraft] save:', result.error.message)
        setError('Não foi possível salvar o rascunho.')
        return false
      }

      setDraft(result.data as DraftState)
      setLastSavedAt(new Date())
      return true
    },
    [classId, effectiveActiveOrganizationId, temaId],
  )

  return {
    draft: temaId ? draft : null,
    loading: temaId ? loading : false,
    saving,
    error,
    lastSavedAt,
    saveDraft,
  }
}
