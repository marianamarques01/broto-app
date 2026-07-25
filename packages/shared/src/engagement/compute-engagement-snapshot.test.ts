import { describe, expect, it } from 'vitest'
import { buildActiveStudentSets, computeStudentEngagementState } from './student-engagement-state'
import { computeAbandonmentRiskIndex, pct } from './compute-org-engagement-index'
import {
  computeClassEngagementSnapshot,
  computeOrgEngagementSnapshot,
} from './compute-engagement-snapshot'

const NOW = Date.parse('2026-07-07T12:00:00.000Z')

describe('computeStudentEngagementState', () => {
  it('engajado: ativo 7d e streak > 0', () => {
    expect(
      computeStudentEngagementState({
        streak: 5,
        lastActivityAt: '2026-07-06T00:00:00Z',
        activeInLast7d: true,
        activeInLast14d: true,
      }),
    ).toBe('engaged')
  })

  it('em risco: ativo 7d mas streak zero', () => {
    expect(
      computeStudentEngagementState({
        streak: 0,
        lastActivityAt: '2026-07-06T00:00:00Z',
        activeInLast7d: true,
        activeInLast14d: true,
      }),
    ).toBe('at_risk')
  })

  it('em risco: inativo 7d mas ativo 14d', () => {
    expect(
      computeStudentEngagementState({
        streak: 0,
        lastActivityAt: '2026-07-01T00:00:00Z',
        activeInLast7d: false,
        activeInLast14d: true,
      }),
    ).toBe('at_risk')
  })

  it('sumido: sem atividade em 14d', () => {
    expect(
      computeStudentEngagementState({
        streak: 0,
        lastActivityAt: '2026-06-01T00:00:00Z',
        activeInLast7d: false,
        activeInLast14d: false,
      }),
    ).toBe('missing')
  })
})

describe('buildActiveStudentSets', () => {
  it('classifica atividade recente', () => {
    const map = new Map<string, readonly string[]>([
      ['a', ['2026-07-06T00:00:00Z']],
      ['b', ['2026-06-28T00:00:00Z']],
      ['c', ['2026-06-01T00:00:00Z']],
    ])
    const { active7d, active14d } = buildActiveStudentSets({
      studentIds: ['a', 'b', 'c'],
      activityTimestampsByUser: map,
      nowMs: NOW,
    })
    expect(active7d.has('a')).toBe(true)
    expect(active7d.has('b')).toBe(false)
    expect(active14d.has('b')).toBe(true)
    expect(active14d.has('c')).toBe(false)
  })
})

describe('computeClassEngagementSnapshot', () => {
  it('turma vazia não quebra', () => {
    const snap = computeClassEngagementSnapshot({
      classId: 'c1',
      organizationId: 'o1',
      className: 'Turma',
      studentIds: [],
      studentNames: new Map(),
      studentStreaks: new Map(),
      activityTimestampsByUser: new Map(),
      performance: [],
    })
    expect(snap.totalStudents).toBe(0)
    expect(snap.active7dPct).toBe(0)
    expect(snap.students).toHaveLength(0)
  })

  it('dado esparso: um aluno sumido', () => {
    const snap = computeClassEngagementSnapshot({
      classId: 'c1',
      organizationId: 'o1',
      className: 'Turma',
      studentIds: ['s1'],
      studentNames: new Map([['s1', 'Ana']]),
      studentStreaks: new Map([['s1', 0]]),
      activityTimestampsByUser: new Map(),
      performance: [],
      computedAt: '2026-07-07T12:00:00Z',
    })
    expect(snap.students[0]?.engagementState).toBe('missing')
    expect(snap.missingCount).toBe(1)
  })
})

describe('computeAbandonmentRiskIndex', () => {
  it('retorna valor entre 0 e 100', () => {
    const idx = computeAbandonmentRiskIndex({
      active7dPct: 50,
      missingPct: 30,
      streakBrokenPct: 20,
    })
    expect(idx).toBeGreaterThanOrEqual(0)
    expect(idx).toBeLessThanOrEqual(100)
  })
})

describe('computeOrgEngagementSnapshot', () => {
  it('agrega turmas', () => {
    const org = computeOrgEngagementSnapshot({
      organizationId: 'o1',
      classSnapshots: [
        {
          ...computeClassEngagementSnapshot({
            classId: 'c1',
            organizationId: 'o1',
            className: 'A',
            studentIds: ['s1', 's2'],
            studentNames: new Map([
              ['s1', 'A'],
              ['s2', 'B'],
            ]),
            studentStreaks: new Map([
              ['s1', 3],
              ['s2', 0],
            ]),
            activityTimestampsByUser: new Map([['s1', ['2026-07-06T00:00:00Z']]]),
            performance: [],
          }),
          className: 'A',
        },
      ],
    })
    expect(org.totalClasses).toBe(1)
    expect(org.totalStudents).toBe(2)
    expect(org.classRankings).toHaveLength(1)
  })

  it('org vazia retorna zeros', () => {
    const org = computeOrgEngagementSnapshot({
      organizationId: 'o1',
      classSnapshots: [],
    })
    expect(org.totalClasses).toBe(0)
    expect(org.totalStudents).toBe(0)
    expect(org.classRankings).toEqual([])
    expect(org.atRiskAlerts).toEqual([])
  })

  it('alertas ordenados por severidade', () => {
    const org = computeOrgEngagementSnapshot({
      organizationId: 'o1',
      classSnapshots: [
        {
          ...computeClassEngagementSnapshot({
            classId: 'c1',
            organizationId: 'o1',
            className: 'A',
            studentIds: ['s1', 's2'],
            studentNames: new Map([
              ['s1', 'Risco'],
              ['s2', 'Sumido'],
            ]),
            studentStreaks: new Map([
              ['s1', 0],
              ['s2', 0],
            ]),
            activityTimestampsByUser: new Map([
              ['s1', ['2026-07-01T00:00:00Z']],
              ['s2', ['2026-06-01T00:00:00Z']],
            ]),
            performance: [],
          }),
          className: 'A',
        },
      ],
    })
    expect(org.atRiskAlerts[0]?.engagementState).toBe('missing')
    expect(org.atRiskAlerts[0]?.severity).toBe(100)
  })
})

describe('pct', () => {
  it('zero total retorna 0', () => {
    expect(pct(1, 0)).toBe(0)
  })
})
