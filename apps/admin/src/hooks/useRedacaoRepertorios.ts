import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import type {
  RedacaoCompetencia,
  RedacaoEixoTematico,
  RedacaoRepertorio,
  RedacaoRepertorioManageResponse,
  RedacaoRepertorioTipo,
} from '@broto/shared'

type CreateInput = {
  titulo: string
  conteudo: string
  tipo: RedacaoRepertorioTipo
  scope: 'org' | 'class'
  eixo_tematico?: RedacaoEixoTematico | null
  competencia_alvo?: RedacaoCompetencia | null
  tags?: string[]
}

type UpdateInput = {
  id: string
  titulo?: string
  conteudo?: string
  tipo?: RedacaoRepertorioTipo
  scope?: 'org' | 'class'
  eixo_tematico?: RedacaoEixoTematico | null
  competencia_alvo?: RedacaoCompetencia | null
  tags?: string[]
  ativo?: boolean
}

function parseManageError(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'error' in data) {
    const err = (data as { error?: unknown }).error
    if (typeof err === 'string') return err
  }
  return fallback
}

export function useRedacaoRepertorios(classId: string) {
  const { admin } = useAdminAuth()
  const [repertorios, setRepertorios] = useState<RedacaoRepertorio[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRepertorios = useCallback(async () => {
    if (!admin) {
      setRepertorios([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('redacao_repertorios')
      .select('*')
      .eq('organization_id', admin.organization_id)
      .or(`class_id.eq.${classId},class_id.is.null`)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[useRedacaoRepertorios] fetch:', error.message)
      setRepertorios([])
    } else {
      setRepertorios((data as RedacaoRepertorio[]) ?? [])
    }
    setLoading(false)
  }, [admin, classId])

  useEffect(() => {
    async function load() {
      await fetchRepertorios()
    }

    void load()
  }, [fetchRepertorios])

  async function createRepertorio(input: CreateInput): Promise<{ error: string | null }> {
    if (!admin) return { error: 'Nao autenticado' }

    const { data, error } = await supabase.functions.invoke('redacao-repertorio-manage', {
      method: 'POST',
      body: {
        class_id: input.scope === 'class' ? classId : null,
        tipo: input.tipo,
        titulo: input.titulo,
        conteudo: input.conteudo,
        eixo_tematico: input.eixo_tematico ?? null,
        competencia_alvo: input.competencia_alvo ?? null,
        tags: input.tags ?? [],
      },
    })

    if (error) return { error: error.message }
    const body = data as RedacaoRepertorioManageResponse | { error?: string } | null
    if (!body || !('ok' in body) || !body.ok) {
      return { error: parseManageError(body, 'Erro ao criar repertório') }
    }

    await fetchRepertorios()
    return { error: null }
  }

  async function updateRepertorio(input: UpdateInput): Promise<{ error: string | null }> {
    if (!admin) return { error: 'Nao autenticado' }

    const patch: Record<string, unknown> = { id: input.id }
    if (input.titulo !== undefined) patch.titulo = input.titulo
    if (input.conteudo !== undefined) patch.conteudo = input.conteudo
    if (input.tipo !== undefined) patch.tipo = input.tipo
    if (input.eixo_tematico !== undefined) patch.eixo_tematico = input.eixo_tematico
    if (input.competencia_alvo !== undefined) patch.competencia_alvo = input.competencia_alvo
    if (input.tags !== undefined) patch.tags = input.tags
    if (input.ativo !== undefined) patch.ativo = input.ativo
    if (input.scope !== undefined) {
      patch.class_id = input.scope === 'class' ? classId : null
    }

    const { data, error } = await supabase.functions.invoke('redacao-repertorio-manage', {
      method: 'PATCH',
      body: patch,
    })

    if (error) return { error: error.message }
    const body = data as RedacaoRepertorioManageResponse | { error?: string } | null
    if (!body || !('ok' in body) || !body.ok) {
      return { error: parseManageError(body, 'Erro ao atualizar repertório') }
    }

    await fetchRepertorios()
    return { error: null }
  }

  async function deactivateRepertorio(id: string): Promise<{ error: string | null }> {
    if (!admin) return { error: 'Nao autenticado' }

    const { data, error } = await supabase.functions.invoke('redacao-repertorio-manage', {
      method: 'DELETE',
      body: { id },
    })

    if (error) return { error: error.message }
    const body = data as RedacaoRepertorioManageResponse | { error?: string } | null
    if (!body || !('ok' in body) || !body.ok) {
      return { error: parseManageError(body, 'Erro ao desativar repertório') }
    }

    await fetchRepertorios()
    return { error: null }
  }

  return {
    repertorios,
    loading,
    createRepertorio,
    updateRepertorio,
    deactivateRepertorio,
    refetch: fetchRepertorios,
  }
}
