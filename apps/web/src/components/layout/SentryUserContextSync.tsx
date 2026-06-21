import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { syncSentryUserContext } from '@/lib/sentry'

/** Sincroniza user.id e org ativa no Sentry após login — sem PII. */
export function SentryUserContextSync() {
  const { user } = useAuth()
  const { effectiveActiveOrganizationId } = useOrganization()

  useEffect(() => {
    syncSentryUserContext(user?.id ?? null, effectiveActiveOrganizationId)
  }, [user?.id, effectiveActiveOrganizationId])

  return null
}
