export type Class = {
  id: string
  organization_id: string
  name: string
  description?: string
  access_code: string
  is_active: boolean
  notebook_id?: string
  notebook_status: 'not_configured' | 'indexing' | 'ready' | 'error'
  rag_enabled?: boolean
  created_by: string
  created_at: string
}

/** Chat IA disponível quando materiais indexados (NotebookLM ou RAG opt-in). */
export function isClassAiChatReady(
  classRow: Pick<Class, 'notebook_status' | 'rag_enabled'> | null | undefined,
): boolean {
  if (!classRow) return false
  if (classRow.rag_enabled === true) return true
  return classRow.notebook_status === 'ready'
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
