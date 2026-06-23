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
