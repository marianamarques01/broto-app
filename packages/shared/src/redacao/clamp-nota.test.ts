import { describe, expect, it } from 'vitest'
import { clampNota, isValidNota } from './clamp-nota'

describe('clampNota', () => {
  it('mantém notas válidas', () => {
    expect(clampNota(120)).toBe(120)
    expect(clampNota(0)).toBe(0)
    expect(clampNota(200)).toBe(200)
  })

  it('arredonda para múltiplos de 40', () => {
    expect(clampNota(85)).toBe(80)
    expect(clampNota(95)).toBe(80)
    expect(clampNota(100)).toBe(120)
    expect(clampNota(101)).toBe(120)
    expect(clampNota(150)).toBe(160)
  })

  it('limita ao intervalo 0–200', () => {
    expect(clampNota(-10)).toBe(0)
    expect(clampNota(250)).toBe(200)
  })

  it('retorna 0 para valores não finitos', () => {
    expect(clampNota(Number.NaN)).toBe(0)
    expect(clampNota(Number.POSITIVE_INFINITY)).toBe(0)
  })
})

describe('isValidNota', () => {
  it('aceita apenas múltiplos de 40 até 200', () => {
    expect(isValidNota(80)).toBe(true)
    expect(isValidNota(85)).toBe(false)
  })
})
