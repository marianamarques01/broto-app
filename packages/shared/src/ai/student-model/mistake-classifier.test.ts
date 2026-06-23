import { describe, it, expect } from 'vitest'
import {
  classifyMistake,
  FAST_THRESHOLD_MS,
  SLOW_THRESHOLD_MS,
} from './mistake-classifier'

const slowSec = SLOW_THRESHOLD_MS / 1000 + 1
const fastSec = FAST_THRESHOLD_MS / 1000 - 1
const midSec = (SLOW_THRESHOLD_MS + FAST_THRESHOLD_MS) / 2000

describe('classifyMistake', () => {
  it('acerto qualquer: null', () => {
    expect(classifyMistake(true, 120)).toBeNull()
    expect(classifyMistake(true, null)).toBeNull()
  })

  it('erro sem tempo: normal', () => {
    expect(classifyMistake(false, null)).toBe('normal')
    expect(classifyMistake(false, undefined)).toBe('normal')
  })

  it('erro com tempo = 0: normal', () => {
    expect(classifyMistake(false, 0)).toBe('normal')
  })

  it('erro com tempo acima de SLOW: stuck', () => {
    expect(classifyMistake(false, slowSec)).toBe('stuck')
  })

  it('erro com tempo abaixo de FAST: guessed', () => {
    expect(classifyMistake(false, fastSec)).toBe('guessed')
  })

  it('erro com tempo no meio: normal', () => {
    expect(classifyMistake(false, midSec)).toBe('normal')
  })
})
