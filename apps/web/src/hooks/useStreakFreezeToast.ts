import { useEffect, useState } from 'react'

const STORAGE_PREFIX = 'broto-freeze-toast-seen:'

function readFreezeToastSeen(eventId: string): boolean {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${eventId}`) === '1'
  } catch {
    return false
  }
}

function writeFreezeToastSeen(eventId: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${eventId}`, '1')
  } catch {
    /* ignore quota / private mode */
  }
}

/** Toast único por evento de freeze consumido (próxima visita à Home). */
export function useStreakFreezeToast(
  latestFreezeEventId: string | null | undefined,
  loading: boolean,
): boolean {
  const eventKey = loading ? null : (latestFreezeEventId ?? null)
  const [dismissedKey, setDismissedKey] = useState<string | null>(null)

  const shouldShow =
    eventKey != null && !readFreezeToastSeen(eventKey) && dismissedKey !== eventKey

  useEffect(() => {
    if (!shouldShow || !eventKey) return
    writeFreezeToastSeen(eventKey)
    const timer = window.setTimeout(() => setDismissedKey(eventKey), 6000)
    return () => window.clearTimeout(timer)
  }, [shouldShow, eventKey])

  return shouldShow
}
