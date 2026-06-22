import { describe, expect, it } from 'vitest'
import { isClassAiChatReady, type Class } from './class'

const baseClass: Class = {
  id: 'c1',
  organization_id: 'o1',
  name: 'Turma',
  access_code: 'ABC123',
  is_active: true,
  notebook_status: 'not_configured',
  created_by: 'u1',
  created_at: '2026-01-01T00:00:00Z',
}

describe('isClassAiChatReady', () => {
  it('returns false when class is null', () => {
    expect(isClassAiChatReady(null)).toBe(false)
  })

  it('returns true only when notebook_status is ready', () => {
    expect(isClassAiChatReady({ ...baseClass, notebook_status: 'ready' })).toBe(true)
    expect(isClassAiChatReady({ ...baseClass, notebook_status: 'not_configured' })).toBe(false)
    expect(isClassAiChatReady({ ...baseClass, notebook_status: 'indexing' })).toBe(false)
    expect(isClassAiChatReady({ ...baseClass, notebook_status: 'error' })).toBe(false)
  })
})
