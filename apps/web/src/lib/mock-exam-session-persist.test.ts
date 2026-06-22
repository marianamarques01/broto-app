import { describe, expect, it, vi } from 'vitest'
import { patchWithOneRetry } from './mock-exam-session-persist'

describe('patchWithOneRetry', () => {
  it('retorna no primeiro sucesso', async () => {
    const request = vi.fn().mockResolvedValue('ok')

    await expect(patchWithOneRetry(request)).resolves.toBe('ok')
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('repete uma vez e retorna no segundo sucesso', async () => {
    const request = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce('ok')

    await expect(patchWithOneRetry(request)).resolves.toBe('ok')
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('propaga erro após duas falhas', async () => {
    const err = new Error('persist failed')
    const request = vi.fn().mockRejectedValue(err)

    await expect(patchWithOneRetry(request)).rejects.toThrow('persist failed')
    expect(request).toHaveBeenCalledTimes(2)
  })
})
