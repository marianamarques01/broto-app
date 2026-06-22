/** Campos persistidos pelo fluxo de onboarding (edge `user-onboarding`). */
export interface OnboardingProfilePersisted {
  faculdade: string
  curso: string
  metaNota: number
  niveis: Record<string, string | null>
  horarios: string[]
}

export interface UserProfile {
  id: string
  nome: string
  email: string
  image: string | null
  onboardingDone: boolean
  dataEnem: string | null
  horasDisponiveisPorDia: number
  onboardingProfile?: OnboardingProfilePersisted | null
  /** Horas/dia estruturadas pós-onboarding (espelha `hours_per_day`). */
  hoursPerDay?: number
  examDate?: string | null
  targetScore?: number | null
  strongAreas?: string[]
  weakAreas?: string[]
  onboardingRoutineBannerShown?: boolean
  onboardingCompletedAt?: string | null
}
