import type { OnboardingProfilePersisted, UserProfile } from './user-profile'
import type { PetData } from './pet'
import type { ProgressData } from './dashboard-progress'
import type { PerformancePeriod, PerformanceSeriesResponse } from './performance-series'
import type { RecentMistakesResponse } from './recent-mistakes'
import type {
  PracticeSessionKind,
  PracticeSessionProgressState,
  PracticeSessionSummary,
  StudentMockExamConfig,
} from '../mock-exam/types'
import type { PracticeSessionAnswerSnapshot } from '../mock-exam/parse-session-state'
import type { SubmitAnswerPayload } from './submit-answer'
import type { EnemAreaKey } from '../enem-area-key'
import type {
  RedacaoCompetencia,
  RedacaoCorrecao,
  RedacaoEixoTematico,
  RedacaoModo,
  RedacaoRepertorio,
  RedacaoRepertorioTipo,
  RedacaoRevisaoHumana,
  RedacaoStatus,
  RedacaoTema,
  Redacao,
} from './redacao'
import type {
  CalibracaoComparacaoCompetencia,
  CalibracaoMetricasCompetencia,
  RedacaoCorrecaoBlind,
} from '../redacao/calibracao'
import type { RedacaoEvolucaoSerie, RedacaoRoutineHint } from '../redacao/evolucao'

/** Corpo de erro padrão das edge functions. */
export interface EdgeFunctionErrorBody {
  error: string
  details?: string
  retryAfter?: number
}

export interface AnswerQuestionResponse {
  success: true
  xpGained: number
  missionBonusXp: number
  missionCompletedIndexes: number[]
  newLevel: number
}

export type AnswerQuestionRequest = SubmitAnswerPayload

export interface AuthSignupRequest {
  email: string
  password: string
  nome: string
  telefone?: string
  cpf?: string
  cidade?: string
  estado?: string
}

export interface AuthSignupResponse {
  userId: string
}

export interface BrotoChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface BrotoChatRequest {
  messages: BrotoChatMessage[]
  sessionId: string
  turnIndex?: number
  classId?: string
}

export interface BrotoChatResponse {
  message: string
}

export interface BrotoChatSessionSummary {
  sessionId: string
  preview: string
  lastMessageAt: string
  turnCount: number
  classId: string | null
}

export interface BrotoChatSessionsListRequest {
  classId?: string
  limit?: number
}

export interface BrotoChatSessionsListResponse {
  sessions: BrotoChatSessionSummary[]
}

export interface BrotoChatSessionGetRequest {
  sessionId: string
}

export interface BrotoChatSessionGetResponse {
  sessionId: string
  messages: BrotoChatMessage[]
  turnCount: number
}

export interface BrotoChatSessionDeleteRequest {
  sessionId: string
}

export interface BrotoChatSessionDeleteResponse {
  ok: true
}

export interface ClassJoinRequest {
  access_code: string
}

export interface JoinedClassRow {
  id: string
  name: string
  organization_id: string
  is_active: boolean
}

export interface ClassJoinResponse {
  success: true
  class: JoinedClassRow
}

export interface MaterialIndexRequest {
  material_id: string
  class_id: string
}

export interface MaterialIndexSuccessResponse {
  success: true
  /** Presente quando a turma usa RAG (rag_enabled). */
  indexed?: number
}

export interface MaterialIndexPendingResponse {
  success: false
  error: string
}

export interface MaterialChunkMetadata {
  page_number?: number
  section_title?: string
  file_name?: string
}

export interface MaterialEmbedChunk {
  text: string
  tokens?: number
  metadata?: MaterialChunkMetadata
}

export interface MaterialEmbedRequest {
  material_id: string
  class_id: string
  chunks: MaterialEmbedChunk[]
}

export interface MaterialEmbedResponse {
  indexed: number
  material_id: string
  cost_estimate_usd: number
}

export interface SemanticSearchRequest {
  query: string
  class_id: string
  limit?: number
  similarity_threshold?: number
}

export interface SemanticSearchChunk {
  id: string
  chunk_text: string
  similarity: number
  metadata: Record<string, unknown>
  material_id: string
}

export interface SemanticSearchResponse {
  chunks: SemanticSearchChunk[]
  class_id: string
  query: string
}

export type PetMeResponse = PetData

export interface PetMePatchRequest {
  nome?: string
  brotoNome?: string
}

export interface PetMePatchResponse {
  ok: true
  nome: string
}

export interface PracticeSessionAbandonRequest {
  sessionId: string
}

export interface PracticeSessionOkResponse {
  ok: true
}

export interface PracticeSessionCompleteRequest {
  sessionId: string
  summary?: PracticeSessionSummary | null
}

export interface PracticeSessionCompleteResponse {
  success: true
}

export interface PracticeSessionCreateRequest {
  questionIds: string[]
  config?: StudentMockExamConfig | Record<string, unknown>
  kind?: PracticeSessionKind
}

export interface PracticeSessionCreateResponse {
  sessionId: string
  questionIds: string[]
}

export type PracticeSessionDeleteRequest =
  | { sessionId: string; deleteAll?: never }
  | { deleteAll: true; sessionId?: never }

export interface PracticeSessionDeleteOneResponse {
  ok: true
}

export interface PracticeSessionDeleteAllResponse {
  ok: true
  deletedCount: number
}

export interface PracticeSessionGetRequest {
  sessionId: string
}

export interface PracticeSessionGetResponse {
  sessionId: string
  createdAt: string
  completedAt: string | null
  kind: string
  config: StudentMockExamConfig | Record<string, unknown> | null
  questionIds: string[]
  summary: PracticeSessionSummary | null
  progress: PracticeSessionProgressState | null
  sessionAnswers: PracticeSessionAnswerSnapshot[]
}

export interface PracticeSessionListRequest {
  limit?: number
}

export interface PracticeSessionListItem {
  sessionId: string
  createdAt: string
  completedAt: string | null
  summary: PracticeSessionSummary | null
  config: StudentMockExamConfig | Record<string, unknown> | null
  questionCount: number
}

export interface PracticeSessionListResponse {
  sessions: PracticeSessionListItem[]
}

export interface PracticeSessionProgressRequest {
  sessionId: string
  progress: PracticeSessionProgressState
}

export interface PracticeSessionProgressResponse {
  ok: true
  progress: PracticeSessionProgressState
}

export type UserMeResponse = UserProfile

export interface UserOnboardingRequest {
  faculdade?: string
  curso?: string
  metaNota?: number
  horasPorDia?: number
  niveis?: Record<string, 'iniciante' | 'intermediario' | 'avancado' | null>
  horarios?: Array<'manha' | 'tarde' | 'noite'>
  brotoNome?: string
}

export interface UserOnboardingResponse {
  ok: true
  onboardingProfile: OnboardingProfilePersisted
  brotoNome: string
}

export interface UserPerformanceSeriesRequest {
  period?: PerformancePeriod
}

export type UserPerformanceSeriesResponse = PerformanceSeriesResponse

export type UserProgressResponse = ProgressData

export type UserRecentMistakesResponse = RecentMistakesResponse

export interface UserResetPracticeResponse {
  ok: true
}

/** Re-export útil para contratos que referenciam área ENEM. */
export type { EnemAreaKey }

// ---- Redação — temas (REDA-04 parcial) ----

export interface RedacaoTemaListRequest {
  eixo_tematico?: RedacaoEixoTematico
}

export interface RedacaoTemaListResponse {
  temas: RedacaoTema[]
}

// ---- Redação — repertórios (REDA-06) ----

export interface RedacaoRepertorioListRequest {
  eixo_tematico?: RedacaoEixoTematico
  competencia_alvo?: RedacaoCompetencia
  class_id?: string
}

export interface RedacaoRepertorioListResponse {
  repertorios: RedacaoRepertorio[]
}

export interface RedacaoRepertorioCreateRequest {
  class_id?: string | null
  tipo: RedacaoRepertorioTipo
  titulo: string
  conteudo: string
  eixo_tematico?: RedacaoEixoTematico | null
  competencia_alvo?: RedacaoCompetencia | null
  tags?: string[]
}

export interface RedacaoRepertorioUpdateRequest {
  id: string
  class_id?: string | null
  tipo?: RedacaoRepertorioTipo
  titulo?: string
  conteudo?: string
  eixo_tematico?: RedacaoEixoTematico | null
  competencia_alvo?: RedacaoCompetencia | null
  tags?: string[]
  ativo?: boolean
}

export interface RedacaoRepertorioDeleteRequest {
  id: string
}

export interface RedacaoRepertorioManageResponse {
  ok: true
  repertorio: RedacaoRepertorio
}

// ---- Redação — motor de correção (REDA-03) ----

export interface RedacaoCorrectRequest {
  redacao_id: string
}

export interface RedacaoCorrectResponse {
  ok: true
  correcao: RedacaoCorrecao
  skipped_llm: boolean
}

// ---- Redação — submit + get (REDA-04 completo) ----

export interface RedacaoSubmitRequest {
  tema_id: string
  texto: string
  modo?: RedacaoModo
  tempo_segundos?: number | null
  redacao_id?: string | null
  class_id?: string | null
}

export interface RedacaoSubmitResponse {
  ok: true
  redacao: Redacao
  correcao: RedacaoCorrecao
  status: RedacaoStatus
}

export interface RedacaoGetRequest {
  redacao_id: string
}

export interface RedacaoGetResponse {
  redacao: Redacao
  tema: RedacaoTema
  correcao: RedacaoCorrecao | null
}

/** Item da fila de calibração — sem notas da IA. */
export interface RedacaoCalibracaoListItem {
  correcao_id: string
  redacao_id: string
  corrigida_em: string
  linha_count: number
  tema_titulo: string
  eixo_tematico: string
  revisado: boolean
  revisado_por_mim: boolean
}

export interface RedacaoCalibracaoListResponse {
  items: RedacaoCalibracaoListItem[]
}

export interface RedacaoCalibracaoGetResponse {
  redacao: Redacao
  tema: RedacaoTema
  correcao: RedacaoCorrecaoBlind
  revisao: RedacaoRevisaoHumana | null
  ia_revelada: boolean
  comparacao?: CalibracaoComparacaoCompetencia[]
  correcao_ia?: RedacaoCorrecao
}

export interface RedacaoCalibracaoSubmitRequest {
  action?: 'submit'
  correcao_id: string
  nota_humana_i: number
  nota_humana_ii: number
  nota_humana_iii: number
  nota_humana_iv: number
  nota_humana_v: number
  comentario?: string | null
}

export interface RedacaoCalibracaoSubmitResponse {
  ok: true
  revisao: RedacaoRevisaoHumana
  comparacao: CalibracaoComparacaoCompetencia[]
  correcao_ia: RedacaoCorrecao
}

export interface RedacaoCalibracaoMetricsResponse {
  total_revisoes: number
  por_competencia: CalibracaoMetricasCompetencia[]
}

// ---- Redação — evolução + rotina (REDA-08) ----

export type {
  RedacaoEvolucaoPoint,
  RedacaoEvolucaoSerie,
  RedacaoRoutineHint,
} from '../redacao/evolucao'

export type RedacaoHistoryItem = {
  redacao_id: string
  tema_titulo: string
  eixo_tematico: RedacaoEixoTematico
  nota_total: number
  created_at: string
  notas: Record<RedacaoCompetencia, number>
}

export interface RedacaoHistoryResponse {
  total_redacoes: number
  meta_redacao: number | null
  nivel_redacao: string | null
  series: RedacaoEvolucaoSerie[]
  weak_competences: RedacaoCompetencia[]
  historico: RedacaoHistoryItem[]
  recomendacoes: RedacaoRoutineHint[]
}

export type {
  ClassEngagementSnapshot,
  EngagementClassGetResponse,
  EngagementOrgGetResponse,
  EngagementSnapshotRefreshResponse,
  OrgEngagementSnapshot,
  OrgStudentsImportRequest,
  OrgStudentsImportResponse,
  StudentEngagementState,
  StudentFollowUpSetRequest,
  StudentFollowUpSetResponse,
} from './engagement'
export type {
  InstitutionType,
  OrgOnboardCreateRequest,
  OrgOnboardCreateResponse,
  OrgStudentsCsvPreviewRow,
  OrgTeacherJoinRequest,
  OrgTeacherJoinResponse,
} from './institutional-onboarding'
