import type { AreaStat, DiaRotina, UserProfile } from '@broto/shared'
import {
  buildColdStartAreas,
  generateOnboardingRoutine,
  type OnboardingRoutineInput,
} from '@broto/shared'

const ROUTINE_STORAGE_KEY = 'broto.generatedRoutine.v1'

interface StoredRoutine {
  generatedAt: string
  horasPorDia: number
  dias: DiaRotina[]
}

export function buildOnboardingRoutineInput(
  body: {
    horasPorDia: number
    metaNota: number
    niveis: Record<string, string | null>
  },
  examDate?: string | null,
): OnboardingRoutineInput {
  return {
    horasPorDia: body.horasPorDia,
    examDate: examDate ?? null,
    niveis: body.niveis as OnboardingRoutineInput['niveis'],
  }
}

export function saveGeneratedRoutine(routine: DiaRotina[], horasPorDia: number): void {
  try {
    const payload: StoredRoutine = {
      generatedAt: new Date().toISOString(),
      horasPorDia,
      dias: routine,
    }
    window.localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // storage cheio ou indisponível — rotina será recalculada do perfil
  }
}

export function loadGeneratedRoutine(): StoredRoutine | null {
  try {
    const raw = window.localStorage.getItem(ROUTINE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredRoutine
    if (!Array.isArray(parsed.dias) || parsed.dias.length !== 7) return null
    return parsed
  } catch {
    return null
  }
}

export function generateAndSaveOnboardingRoutine(input: OnboardingRoutineInput): DiaRotina[] {
  const routine = generateOnboardingRoutine(input)
  saveGeneratedRoutine(routine, input.horasPorDia)
  return routine
}

export function resolveRoutineAreasForUser(
  progressAreas: AreaStat[] | undefined,
  totalAnswered: number,
  user: UserProfile | null | undefined,
  fallbackAreas: AreaStat[],
): AreaStat[] {
  if (totalAnswered > 0 && progressAreas?.length) {
    return progressAreas
  }

  if (user?.strongAreas?.length || user?.weakAreas?.length || user?.onboardingProfile?.niveis) {
    return buildColdStartAreas({
      horasPorDia: user.hoursPerDay ?? user.horasDisponiveisPorDia ?? 2,
      examDate: user.examDate ?? user.dataEnem ?? null,
      niveis: user.onboardingProfile?.niveis as OnboardingRoutineInput['niveis'],
      strongAreas: user.strongAreas,
      weakAreas: user.weakAreas,
    })
  }

  return progressAreas?.length ? progressAreas : fallbackAreas
}
