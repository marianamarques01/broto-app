import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import type { Material } from '@broto/shared'

async function triggerIndex(materialId: string, classId: string, onDone?: () => void) {
  try {
    const { error } = await supabase.functions.invoke('material-index', {
      body: { material_id: materialId, class_id: classId },
    })
    if (error) console.error('[material-index] Erro:', error)
  } catch (err) {
    console.error('[material-index] Falha ao chamar function:', err)
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
    fetchMaterials()
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
    triggerIndex(inserted.id, classId, fetchMaterials)
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
    triggerIndex(inserted.id, classId, fetchMaterials)
    await fetchMaterials()
    return { error: null }
  }

  async function deleteMaterial(materialId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('materials').delete().eq('id', materialId)

    if (error) return { error: 'Erro ao remover material' }
    await fetchMaterials()
    return { error: null }
  }

  return { materials, loading, uploadPDF, addURL, deleteMaterial, refetch: fetchMaterials }
}
