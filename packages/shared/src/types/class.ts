export type Class = {
  id: string
  organization_id: string
  name: string
  description?: string
  access_code: string
  is_active: boolean
  notebook_id?: string
  notebook_status: 'not_configured' | 'indexing' | 'ready' | 'error'
  created_by: string
  created_at: string
}

/** Chat IA disponível quando materiais da turma foram indexados no NotebookLM. */
export function isClassAiChatReady(
  classRow: Pick<Class, 'notebook_status'> | null | undefined,
): boolean {
  return classRow?.notebook_status === 'ready'
}

export type Enrollment = {
  id: string
  class_id: string
  student_id: string
  enrolled_at: string
  status: 'active' | 'inactive'
}

export type Material = {
  id: string
  class_id: string
  organization_id: string
  title: string
  type: 'pdf' | 'url' | 'youtube' | 'text'
  source_url: string
  index_status: 'pending' | 'indexing' | 'indexed' | 'failed'
  uploaded_by: string
  created_at: string
}
