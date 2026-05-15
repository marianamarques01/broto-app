import type { StudyJourneyTab } from '@broto/shared'

const STORAGE_VERSION = 1 as const
const KEY_PREFIX = 'broto-study-package-session'

export type StudyPackageSessionDraft = {
  version: typeof STORAGE_VERSION
  completed: Record<StudyJourneyTab, boolean>
  activeTab: StudyJourneyTab
}

function storageKey(areaKey: string, topicoValue: string) {
  return `${KEY_PREFIX}:${encodeURIComponent(areaKey)}:${encodeURIComponent(topicoValue)}`
}

export function loadStudyPackageSessionDraft(
  areaKey: string,
  topicoValue: string,
): StudyPackageSessionDraft | null {
  try {
    const raw = localStorage.getItem(storageKey(areaKey, topicoValue))
    if (!raw) return null
    const parsed = JSON.parse(raw) as StudyPackageSessionDraft
    if (parsed?.version !== STORAGE_VERSION || !parsed.completed || !parsed.activeTab) return null
    return parsed
  } catch {
    return null
  }
}

export function saveStudyPackageSessionDraft(
  areaKey: string,
  topicoValue: string,
  draft: Pick<StudyPackageSessionDraft, 'completed' | 'activeTab'>,
) {
  try {
    const payload: StudyPackageSessionDraft = {
      version: STORAGE_VERSION,
      completed: draft.completed,
      activeTab: draft.activeTab,
    }
    localStorage.setItem(storageKey(areaKey, topicoValue), JSON.stringify(payload))
  } catch {
    // quota / private mode
  }
}

export function clearStudyPackageSessionDraft(areaKey: string, topicoValue: string) {
  try {
    localStorage.removeItem(storageKey(areaKey, topicoValue))
  } catch {
    // ignore
  }
}
