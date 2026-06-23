const KEY_PREFIX = 'broto:activeSession:'

export function readActiveBrotoSessionId(classId: string | undefined): string | null {
  if (!classId || typeof localStorage === 'undefined') return null
  const value = localStorage.getItem(`${KEY_PREFIX}${classId}`)
  return value?.trim() ? value.trim() : null
}

export function writeActiveBrotoSessionId(classId: string | undefined, sessionId: string): void {
  if (!classId || typeof localStorage === 'undefined') return
  localStorage.setItem(`${KEY_PREFIX}${classId}`, sessionId)
}
