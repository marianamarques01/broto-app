/** Tipo de instituição no cadastro onboarding (equipe Broto). */
export type InstitutionType = 'escola_privada' | 'cursinho' | 'outro'

export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  escola_privada: 'Escola privada',
  cursinho: 'Cursinho',
  outro: 'Outro',
}

export type OrgOnboardCreateRequest = {
  name: string
  institutionType: InstitutionType
  /** E-mail do coordenador; recebe membership org_admin na nova org. */
  coordinatorEmail?: string
  /** Cria turma "Turma 1" com código de acesso gerado. */
  createDefaultClass?: boolean
}

export type OrgOnboardCreateResponse = {
  success: true
  organizationId: string
  organizationName: string
  slug: string
  teacherInviteCode: string
  defaultClassAccessCode?: string
}

export type OrgTeacherJoinRequest = {
  inviteCode: string
}

export type OrgTeacherJoinResponse = {
  success: true
  organizationId: string
  organizationName: string
}

export type OrgStudentsCsvPreviewRow = {
  line: number
  email: string
  nome: string
  turmaCodigo: string
  valid: boolean
  error?: string
}
