export interface UserProfile {
  id: string
  nome: string
  email: string
  image: string | null
  onboardingDone: boolean
  dataEnem: string | null
  horasDisponiveisPorDia: number
}
