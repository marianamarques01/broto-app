import { describe, expect, it } from 'vitest'
import {
  assertNetworkViewHasNoStudentNames,
  buildNetworkEngagementView,
} from './build-network-engagement-view'
import type { OrgEngagementSnapshot } from '../types/engagement'

const baseSnapshot = (
  orgId: string,
  overrides: Partial<OrgEngagementSnapshot> = {},
): OrgEngagementSnapshot => ({
  organizationId: orgId,
  computedAt: '2026-07-08T12:00:00.000Z',
  totalClasses: 2,
  totalStudents: 40,
  active7dPct: 65,
  abandonmentRiskIndex: 42,
  classRankings: [
    { classId: 'c1', className: '3A', active7dPct: 70, totalStudents: 20, missingCount: 3 },
    { classId: 'c2', className: '3B', active7dPct: 60, totalStudents: 20, missingCount: 5 },
  ],
  atRiskAlerts: [
    {
      userId: 'student-1',
      nome: 'João Silva',
      classId: 'c1',
      className: '3A',
      engagementState: 'missing',
      streak: 0,
      severity: 100,
    },
  ],
  ...overrides,
})

describe('buildNetworkEngagementView', () => {
  const units = [
    {
      organizationId: 'school-a',
      displayName: 'Escola Alpha',
      regionalLabel: 'Norte',
      gradeLabel: '3º ano EM',
      isDemo: true,
    },
    {
      organizationId: 'school-b',
      displayName: 'Escola Beta',
      regionalLabel: 'Sul',
      gradeLabel: '2º ano EM',
      isDemo: true,
    },
    {
      organizationId: 'school-c',
      displayName: 'Escola Gamma',
      regionalLabel: 'Norte',
      gradeLabel: '3º ano EM',
      isDemo: false,
    },
  ]

  it('agrega escolas e ordena por índice de risco decrescente', () => {
    const view = buildNetworkEngagementView({
      networkOrgId: 'network-1',
      networkName: 'Rede Demo',
      units,
      orgSnapshots: [
        {
          organizationId: 'school-a',
          snapshot: baseSnapshot('school-a', { abandonmentRiskIndex: 30 }),
        },
        {
          organizationId: 'school-b',
          snapshot: baseSnapshot('school-b', { abandonmentRiskIndex: 72 }),
        },
        {
          organizationId: 'school-c',
          snapshot: baseSnapshot('school-c', { abandonmentRiskIndex: 55 }),
        },
      ],
    })

    expect(view.totalSchools).toBe(3)
    expect(view.schools[0].schoolName).toBe('Escola Beta')
    expect(view.schools[0].abandonmentRiskIndex).toBe(72)
    expect(view.hasDemoData).toBe(true)
    expect(view.availableRegionals).toEqual(['Norte', 'Sul'])
    assertNetworkViewHasNoStudentNames(view)
  })

  it('filtra por regional e série', () => {
    const view = buildNetworkEngagementView({
      networkOrgId: 'network-1',
      networkName: 'Rede Demo',
      units,
      orgSnapshots: [
        { organizationId: 'school-a', snapshot: baseSnapshot('school-a') },
        { organizationId: 'school-b', snapshot: baseSnapshot('school-b') },
        { organizationId: 'school-c', snapshot: baseSnapshot('school-c') },
      ],
      filters: { regional: 'Norte', grade: '3º ano EM' },
    })

    expect(view.totalSchools).toBe(2)
    expect(view.schools.map((s) => s.schoolName).sort()).toEqual(['Escola Alpha', 'Escola Gamma'])
  })

  it('retorna vazio quando snapshots ausentes', () => {
    const view = buildNetworkEngagementView({
      networkOrgId: 'network-1',
      networkName: 'Rede Demo',
      units,
      orgSnapshots: [{ organizationId: 'school-a', snapshot: null }],
      filters: { regional: 'Norte' },
    })

    expect(view.totalSchools).toBe(0)
    expect(view.avgActive7dPct).toBe(0)
  })
})

describe('assertNetworkViewHasNoStudentNames', () => {
  it('rejeita payload com campos de aluno', () => {
    expect(() =>
      assertNetworkViewHasNoStudentNames({
        networkOrgId: 'n1',
        networkName: 'Rede',
        hasDemoData: false,
        computedAt: null,
        totalSchools: 0,
        totalStudents: 0,
        avgActive7dPct: 0,
        avgAbandonmentRiskIndex: 0,
        schools: [],
        availableRegionals: [],
        availableGrades: [],
        // @ts-expect-error — teste de vazamento intencional
        atRiskAlerts: [{ nome: 'João' }],
      }),
    ).toThrow(/PII/)
  })
})
