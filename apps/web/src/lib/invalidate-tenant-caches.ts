import { refreshUser } from '@/hooks/useUser'
import { refreshPet } from '@/hooks/usePet'
import { refreshProgress } from '@/hooks/useProgress'

/** Chamado após troca de organização ativa para evitar dados do tenant anterior na UI. */
export function invalidateTenantScopedCaches(): void {
  refreshUser()
  refreshPet()
  refreshProgress()
}
