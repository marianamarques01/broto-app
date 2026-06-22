import { useCallback } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { refreshUser } from '@/hooks/useUser'

type RoutineOnboardingBannerProps = {
  userId: string
  onDismissed: () => void
}

export function RoutineOnboardingBanner({ userId, onDismissed }: RoutineOnboardingBannerProps) {
  const dismiss = useCallback(async () => {
    onDismissed()
    const { error } = await supabase
      .from('users')
      .update({ onboarding_routine_banner_shown: true })
      .eq('id', userId)
    if (error) {
      console.error('[routine] falha ao marcar banner', error)
      return
    }
    void refreshUser()
  }, [onDismissed, userId])

  return (
    <div className="broto-routine-onboarding-banner" role="status">
      <p className="broto-routine-onboarding-banner__text">
        Sua rotina foi criada com base no seu perfil. Ela fica mais precisa conforme você estuda —
        seu progresso alimenta o algoritmo.
      </p>
      <button
        type="button"
        className="broto-routine-onboarding-banner__close"
        onClick={() => void dismiss()}
        aria-label="Fechar aviso"
      >
        <X size={18} aria-hidden />
      </button>
    </div>
  )
}

export function shouldShowRoutineOnboardingBanner(
  totalAnswered: number,
  user: {
    onboardingRoutineBannerShown?: boolean
    onboardingCompletedAt?: string | null
  } | null,
): boolean {
  if (!user || user.onboardingRoutineBannerShown || totalAnswered > 0) return false
  if (!user.onboardingCompletedAt) return true
  const completedAt = new Date(user.onboardingCompletedAt).getTime()
  if (Number.isNaN(completedAt)) return true
  const dayMs = 24 * 60 * 60 * 1000
  return Date.now() - completedAt < dayMs
}
