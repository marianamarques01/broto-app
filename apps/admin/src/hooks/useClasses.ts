import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import type { Class } from '@broto/shared'
import { generateClassCode } from '@broto/shared'

export function useClasses() {
  const { admin } = useAdminAuth()
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClasses = useCallback(async () => {
    if (!admin) return
    setLoading(true)

    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('organization_id', admin.organization_id)
      .order('created_at', { ascending: false })

    if (error) console.error('fetchClasses error:', error)
    setClasses((data as Class[]) ?? [])
    setLoading(false)
  }, [admin])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  async function createClass(params: {
    name: string
    description?: string
  }): Promise<{ data: Class | null; error: string | null }> {
    if (!admin) return { data: null, error: 'Nao autenticado' }

    const access_code = generateClassCode()

    const { data, error } = await supabase
      .from('classes')
      .insert({
        organization_id: admin.organization_id,
        name: params.name,
        description: params.description,
        access_code,
        created_by: admin.id,
      })
      .select()
      .single()

    if (error) {
      console.error('createClass error:', error)
      return { data: null, error: `Erro ao criar turma: ${error.message}` }
    }

    await fetchClasses()
    return { data: data as Class, error: null }
  }

  async function updateClass(
    classId: string,
    params: { name?: string; description?: string; is_active?: boolean },
  ): Promise<{ error: string | null }> {
    const { error } = await supabase.from('classes').update(params).eq('id', classId)

    if (error) return { error: `Erro ao atualizar turma: ${error.message}` }
    await fetchClasses()
    return { error: null }
  }

  async function deleteClass(classId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('classes').delete().eq('id', classId)

    if (error) return { error: `Erro ao excluir turma: ${error.message}` }
    await fetchClasses()
    return { error: null }
  }

  async function toggleClassStatus(classId: string, isActive: boolean) {
    await updateClass(classId, { is_active: isActive })
  }

  return {
    classes,
    loading,
    createClass,
    updateClass,
    deleteClass,
    toggleClassStatus,
    refetch: fetchClasses,
  }
}
