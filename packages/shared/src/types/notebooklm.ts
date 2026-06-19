/**
 * Contratos HTTP do serviço FastAPI NotebookLM (`supabase/services/notebooklm/main.py`).
 * Consumido pela edge `broto-chat` e futuros proxies admin.
 */

export type NotebookLmSourceType = 'url' | 'text' | 'file'

export interface NotebookLmCreateNotebookRequest {
  class_id: string
  class_name: string
}

export interface NotebookLmCreateNotebookResponse {
  notebook_id: string
  class_id: string
  message: string
}

export interface NotebookLmAddSourceRequest {
  class_id: string
  source_type?: NotebookLmSourceType
  url?: string
  text?: string
  file_data?: string
  file_name?: string
  title?: string
}

export interface NotebookLmAddSourceResponse {
  success: boolean
  message: string
}

export interface NotebookLmChatRequest {
  class_id: string
  question: string
  user_id?: string
}

export interface NotebookLmChatResponse {
  answer: string
  class_id: string
}

/** Desempenho por área enviado ao prompt de rotina IA. */
export interface NotebookLmAreaPerformance {
  accuracy?: number
  weak_topics?: string[]
}

export interface NotebookLmRoutineRequest {
  class_id: string
  user_id: string
  hours_per_day: number
  exam_date: string
  performance?: Record<string, NotebookLmAreaPerformance>
}

export interface NotebookLmRoutineDay {
  day: string
  area: string
  topics: string[]
  hours: number
  tip: string
}

export interface NotebookLmRoutineData {
  week: NotebookLmRoutineDay[]
  summary: string
  /** Presente quando a IA não retornou JSON válido. */
  raw_response?: string
}

export interface NotebookLmRoutineResponse {
  routine: NotebookLmRoutineData
  message: string
}

export interface NotebookLmHealthResponse {
  status: 'ok' | 'degraded'
  authenticated: boolean
  notebooks_mapped: number
}
