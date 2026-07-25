import type { ClassAreaStat, ClassAtRiskData } from '../teacher/class-p-know-insights.ts'

/** Estado visual de engajamento do aluno no painel professor. */
export type StudentEngagementState = 'engaged' | 'at_risk' | 'missing'

export type StudentEngagementRow = {
  userId: string
  nome: string
  streak: number
  engagementState: StudentEngagementState
  lastActivityAt: string | null
}

export type WeakTopicSummary = {
  topicoValue: string
  areaKey: string | null
  avgPKnow: number
  studentCount: number
}

export type ClassEngagementSnapshot = {
  classId: string
  organizationId: string
  computedAt: string
  totalStudents: number
  active7dCount: number
  active7dPct: number
  streakBrokenCount: number
  missingCount: number
  missingDaysThreshold: number
  avgPKnowByArea: Record<string, number>
  weakTopics: WeakTopicSummary[]
  atRiskStudentIds: string[]
  students: StudentEngagementRow[]
  areaStats: ClassAreaStat[]
  atRisk: ClassAtRiskData
}

export type ClassRankingEntry = {
  classId: string
  className: string
  active7dPct: number
  totalStudents: number
  missingCount: number
}

export type OrgAtRiskAlert = {
  userId: string
  nome: string
  classId: string
  className: string
  engagementState: StudentEngagementState
  streak: number
  severity: number
}

export type OrgEngagementSnapshot = {
  organizationId: string
  computedAt: string
  totalClasses: number
  totalStudents: number
  active7dPct: number
  abandonmentRiskIndex: number
  classRankings: ClassRankingEntry[]
  atRiskAlerts: OrgAtRiskAlert[]
}

export type EngagementClassGetResponse = {
  snapshot: ClassEngagementSnapshot | null
  computedInline: boolean
  followUps: Array<{
    studentId: string
    note: string | null
    markedBy: string
    createdAt: string
  }>
}

export type StudentFollowUpSetRequest = {
  classId: string
  studentId: string
  action: 'mark' | 'resolve'
  note?: string
}

export type StudentFollowUpSetResponse = {
  success: true
  followUpId: string
  status: 'active' | 'resolved'
}

export type EngagementSnapshotRefreshResponse = {
  success: true
  organizationsProcessed: number
  classesProcessed: number
  computedAt: string
}

export type EngagementOrgGetResponse = {
  snapshot: OrgEngagementSnapshot | null
  computedInline: boolean
}

export type SchoolUnitRow = {
  organizationId: string
  displayName: string
  regionalLabel: string | null
  gradeLabel: string | null
  isDemo: boolean
}

export type NetworkSchoolEngagement = {
  organizationId: string
  schoolName: string
  regionalLabel: string | null
  gradeLabel: string | null
  isDemo: boolean
  active7dPct: number
  totalStudents: number
  totalClasses: number
  abandonmentRiskIndex: number
  missingCount: number
  computedAt: string
}

export type NetworkEngagementFilters = {
  regional?: string
  grade?: string
  periodDays?: number
}

export type NetworkEngagementView = {
  networkOrgId: string
  networkName: string
  hasDemoData: boolean
  computedAt: string | null
  totalSchools: number
  totalStudents: number
  avgActive7dPct: number
  avgAbandonmentRiskIndex: number
  schools: NetworkSchoolEngagement[]
  availableRegionals: string[]
  availableGrades: string[]
}

export type NetworkEngagementGetResponse = {
  view: NetworkEngagementView
  computedInline: boolean
}

export type OrgStudentsImportRow = {
  email: string
  nome: string
  turmaCodigo: string
}

export type OrgStudentsImportRequest = {
  organizationId: string
  rows: OrgStudentsImportRow[]
}

export type OrgStudentsImportResultRow = {
  line: number
  email: string
  success: boolean
  error?: string
  userId?: string
}

export type OrgStudentsImportResponse = {
  success: true
  imported: number
  failed: number
  results: OrgStudentsImportResultRow[]
}
