import type {
  NetworkEngagementFilters,
  NetworkEngagementView,
  NetworkSchoolEngagement,
  OrgEngagementSnapshot,
  SchoolUnitRow,
} from '../types/engagement.ts'

type BuildParams = {
  networkOrgId: string
  networkName: string
  units: SchoolUnitRow[]
  orgSnapshots: Array<{
    organizationId: string
    snapshot: OrgEngagementSnapshot | null
  }>
  filters?: NetworkEngagementFilters
}

function withinPeriod(computedAt: string, periodDays: number | undefined): boolean {
  if (!periodDays || periodDays <= 0) return true
  const cutoff = Date.now() - periodDays * 86_400_000
  return new Date(computedAt).getTime() >= cutoff
}

function matchesFilter(value: string | null, filter: string | undefined): boolean {
  if (!filter || filter === 'all') return true
  return (value ?? '').toLowerCase() === filter.toLowerCase()
}

/**
 * Agrega snapshots de escolas filhas em visão de rede.
 * Nunca inclui nomes de alunos — apenas métricas agregadas por escola.
 */
export function buildNetworkEngagementView(params: BuildParams): NetworkEngagementView {
  const { networkOrgId, networkName, units, orgSnapshots, filters } = params
  const snapshotByOrg = new Map(orgSnapshots.map((row) => [row.organizationId, row.snapshot]))

  const filteredUnits = units.filter(
    (unit) =>
      matchesFilter(unit.regionalLabel, filters?.regional) &&
      matchesFilter(unit.gradeLabel, filters?.grade),
  )

  const schools: NetworkSchoolEngagement[] = []

  for (const unit of filteredUnits) {
    const snapshot = snapshotByOrg.get(unit.organizationId)
    if (!snapshot) continue
    if (!withinPeriod(snapshot.computedAt, filters?.periodDays)) continue

    const missingCount = snapshot.classRankings.reduce(
      (sum: number, row: { missingCount: number }) => sum + row.missingCount,
      0,
    )

    schools.push({
      organizationId: unit.organizationId,
      schoolName: unit.displayName,
      regionalLabel: unit.regionalLabel,
      gradeLabel: unit.gradeLabel,
      isDemo: unit.isDemo,
      active7dPct: snapshot.active7dPct,
      totalStudents: snapshot.totalStudents,
      totalClasses: snapshot.totalClasses,
      abandonmentRiskIndex: snapshot.abandonmentRiskIndex,
      missingCount,
      computedAt: snapshot.computedAt,
    })
  }

  schools.sort((a, b) => b.abandonmentRiskIndex - a.abandonmentRiskIndex)

  const totalStudents = schools.reduce((sum, s) => sum + s.totalStudents, 0)
  const avgActive7dPct =
    schools.length > 0
      ? Math.round((schools.reduce((sum, s) => sum + s.active7dPct, 0) / schools.length) * 100) /
        100
      : 0
  const avgAbandonmentRiskIndex =
    schools.length > 0
      ? Math.round(
          (schools.reduce((sum, s) => sum + s.abandonmentRiskIndex, 0) / schools.length) * 100,
        ) / 100
      : 0

  const computedAt =
    schools.length > 0
      ? schools.reduce(
          (latest, s) => (s.computedAt > latest ? s.computedAt : latest),
          schools[0].computedAt,
        )
      : null

  const availableRegionals = [
    ...new Set(units.map((u) => u.regionalLabel).filter((v): v is string => Boolean(v))),
  ].sort()
  const availableGrades = [
    ...new Set(units.map((u) => u.gradeLabel).filter((v): v is string => Boolean(v))),
  ].sort()

  return {
    networkOrgId,
    networkName,
    hasDemoData: schools.some((s) => s.isDemo),
    computedAt,
    totalSchools: schools.length,
    totalStudents,
    avgActive7dPct,
    avgAbandonmentRiskIndex,
    schools,
    availableRegionals,
    availableGrades,
  }
}

/** Garante que a resposta de rede não vaza nomes de alunos (LGPD / smoke test). */
export function assertNetworkViewHasNoStudentNames(view: NetworkEngagementView): void {
  const serialized = JSON.stringify(view)
  const forbiddenKeys = ['"nome"', '"userId"', '"studentId"', '"atRiskAlerts"']
  for (const key of forbiddenKeys) {
    if (serialized.includes(key)) {
      throw new Error(`Network view must not expose student PII: found ${key}`)
    }
  }
}
