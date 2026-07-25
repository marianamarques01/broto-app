import type { TypedSupabaseClient } from './database.ts'
import type {
  NetworkEngagementFilters,
  NetworkEngagementGetResponse,
  SchoolUnitRow,
} from '@broto/shared/types/engagement.ts'
import {
  assertNetworkViewHasNoStudentNames,
  buildNetworkEngagementView,
} from '@broto/shared/engagement/build-network-engagement-view.ts'
import { parseOrgSnapshotFromRow } from '@broto/shared/engagement/compute-engagement-snapshot.ts'
import { loadLatestOrgSnapshot, refreshEngagementSnapshots } from './engagement-snapshot-core.ts'

type SchoolUnitDbRow = {
  organization_id: string
  display_name: string | null
  regional_label: string | null
  grade_label: string | null
  organizations: { name: string; config: Record<string, unknown> | null } | null
}

export function parseNetworkFilters(params: {
  regional?: string | null
  grade?: string | null
  periodDays?: string | null
}): NetworkEngagementFilters {
  const filters: NetworkEngagementFilters = {}
  const regional = params.regional?.trim()
  const grade = params.grade?.trim()
  const periodRaw = params.periodDays?.trim()

  if (regional && regional !== 'all') filters.regional = regional
  if (grade && grade !== 'all') filters.grade = grade
  if (periodRaw) {
    const days = Number(periodRaw)
    if (Number.isFinite(days) && days > 0) filters.periodDays = days
  }

  return filters
}

function isDemoOrg(config: Record<string, unknown> | null | undefined): boolean {
  return config?.is_demo === true
}

export async function loadNetworkSchoolUnits(
  admin: TypedSupabaseClient,
  networkOrgId: string,
): Promise<SchoolUnitRow[]> {
  const { data, error } = await admin
    .from('school_units')
    .select(
      'organization_id, display_name, regional_label, grade_label, organizations!school_units_organization_id_fkey(name, config)',
    )
    .eq('network_org_id', networkOrgId)

  if (error) throw new Error(`school_units: ${error.message}`)

  return ((data ?? []) as unknown as SchoolUnitDbRow[]).map((row) => ({
    organizationId: row.organization_id,
    displayName: row.display_name?.trim() || row.organizations?.name || 'Escola',
    regionalLabel: row.regional_label,
    gradeLabel: row.grade_label,
    isDemo: isDemoOrg(row.organizations?.config ?? null),
  }))
}

export async function buildNetworkEngagementResponse(
  admin: TypedSupabaseClient,
  networkOrgId: string,
  filters: NetworkEngagementFilters,
): Promise<NetworkEngagementGetResponse> {
  const { data: networkOrg, error: orgErr } = await admin
    .from('organizations')
    .select('name')
    .eq('id', networkOrgId)
    .maybeSingle()

  if (orgErr) throw new Error(`organizations: ${orgErr.message}`)
  if (!networkOrg?.name) throw new Error('Organização de rede não encontrada')

  const units = await loadNetworkSchoolUnits(admin, networkOrgId)
  let computedInline = false

  const orgSnapshots = await Promise.all(
    units.map(async (unit) => {
      let snapshotRow = await loadLatestOrgSnapshot(admin, unit.organizationId)
      if (!snapshotRow) {
        computedInline = true
        await refreshEngagementSnapshots(admin, unit.organizationId)
        snapshotRow = await loadLatestOrgSnapshot(admin, unit.organizationId)
      }

      return {
        organizationId: unit.organizationId,
        snapshot: snapshotRow
          ? parseOrgSnapshotFromRow(snapshotRow as Parameters<typeof parseOrgSnapshotFromRow>[0])
          : null,
      }
    }),
  )

  const view = buildNetworkEngagementView({
    networkOrgId,
    networkName: networkOrg.name as string,
    units,
    orgSnapshots,
    filters,
  })

  assertNetworkViewHasNoStudentNames(view)

  return { view, computedInline }
}
