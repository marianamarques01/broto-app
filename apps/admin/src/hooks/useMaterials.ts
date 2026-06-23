import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import type { Material } from '@broto/shared'

async function triggerIndex(
  materialId: string,
  classId: string,
  onDone?: () => void,
): Promise<{ ok: boolean; error?: string; indexed?: number; warning?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('material-index', {
      body: { material_id: materialId, class_id: classId },
    })
    if (error) {
      console.error('[material-index] Erro:', error)
      return { ok: false, error: error.message }
    }
    const body = data as {
      error?: string
      detail?: string
      indexed?: number
      partial?: boolean
      warning?: string
    } | null
    if (body?.error) {
      console.error('[material-index] Resposta de erro:', body.error, body.detail ?? '')
      return { ok: false, error: body.detail ? `${body.error}: ${body.detail}` : body.error }
    }
    if (body?.partial && body.warning) {
      console.warn('[material-index] indexação parcial:', body.warning)
    }
    if (body?.indexed != null) {
      console.info('[material-index] RAG OK, chunks:', body.indexed)
    }
    return { ok: true, indexed: body?.indexed, warning: body?.warning }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[material-index] Falha ao chamar function:', err)
    return { ok: false, error: message }
  } finally {
    onDone?.()
  }
}

export function useMaterials(classId: string) {
  const { admin } = useAdminAuth()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMaterials = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('materials')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false })

    setMaterials((data as Material[]) ?? [])
    setLoading(false)
  }, [classId])

  useEffect(() => {
    async function load() {
      await fetchMaterials()
    }

    void load()
  }, [fetchMaterials])

  async function uploadPDF(file: File, title: string): Promise<{ error: string | null }> {
    if (!admin) return { error: 'Nao autenticado' }

    const safeName = file.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileName = `${classId}/${Date.now()}_${safeName}`
    const { error: storageError } = await supabase.storage
      .from('materials')
      .upload(fileName, file, { contentType: 'application/pdf' })

    if (storageError) {
      console.error('Storage upload error:', storageError.message, storageError)
      return { error: `Erro ao fazer upload: ${storageError.message}` }
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('materials').getPublicUrl(fileName)

    const { data: inserted, error: dbError } = await supabase
      .from('materials')
      .insert({
        class_id: classId,
        organization_id: admin.organization_id,
        title,
        type: 'pdf',
        source_url: publicUrl,
        index_status: 'pending',
        uploaded_by: admin.id,
      })
      .select()
      .single()

    if (dbError || !inserted) return { error: 'Erro ao registrar material' }

    // Disparar indexação em background (atualiza lista ao concluir)
    void triggerIndex(inserted.id, classId, fetchMaterials)
    await fetchMaterials()
    return { error: null }
  }

  async function addURL(
    url: string,
    title: string,
    type: 'url' | 'youtube',
  ): Promise<{ error: string | null }> {
    if (!admin) return { error: 'Nao autenticado' }

    const { data: inserted, error: dbError } = await supabase
      .from('materials')
      .insert({
        class_id: classId,
        organization_id: admin.organization_id,
        title,
        type,
        source_url: url,
        index_status: 'pending',
        uploaded_by: admin.id,
      })
      .select()
      .single()

    if (dbError || !inserted) return { error: 'Erro ao registrar material' }

    // Disparar indexação em background (atualiza lista ao concluir)
    void triggerIndex(inserted.id, classId, fetchMaterials)
    await fetchMaterials()
    return { error: null }
  }

  async function deleteMaterial(materialId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('materials').delete().eq('id', materialId)

    if (error) return { error: 'Erro ao remover material' }
    await fetchMaterials()
    return { error: null }
  }

  async function reindexAllMaterials(): Promise<{
    error: string | null
    indexed: number
    failed: number
    warnings: string[]
  }> {
    if (!materials.length) return { error: null, indexed: 0, failed: 0, warnings: [] }

    let indexed = 0
    let failed = 0
    const warnings: string[] = []

    for (const material of materials) {
      await supabase.from('materials').update({ index_status: 'pending' }).eq('id', material.id)
      const result = await triggerIndex(material.id, classId)
      if (result.ok) {
        indexed++
        if (result.warning) warnings.push(`${material.title}: ${result.warning}`)
      } else failed++
    }

    await fetchMaterials()
    if (failed > 0) {
      return {
        error: `${failed} material(is) falharam na indexação RAG`,
        indexed,
        failed,
        warnings,
      }
    }
    return { error: null, indexed, failed: 0, warnings }
  }

  return {
    materials,
    loading,
    uploadPDF,
    addURL,
    deleteMaterial,
    reindexAllMaterials,
    refetch: fetchMaterials,
  }
}
