import type { TypedSupabaseClient } from './database.ts'
import type { TopicPerformanceInsightRow } from '@broto/shared/teacher/class-p-know-insights.ts'
import {
  computeClassEngagementSnapshot,
  computeOrgEngagementSnapshot,
  serializeClassSnapshotRow,
  serializeOrgSnapshotRow,
} from '@broto/shared/engagement/compute-engagement-snapshot.ts'

type ClassRow = { id: string; organization_id: string; name: string; is_active: boolean }

async function fetchActiveClasses(
  admin: TypedSupabaseClient,
  organizationId?: string,
): Promise<ClassRow[]> {
  let query = admin
    .from('classes')
    .select('id, organization_id, name, is_active')
    .eq('is_active', true)

  if (organizationId) {
    query = query.eq('organization_id', organizationId)
  }

  const { data, error } = await query
  if (error) throw new Error(`classes: ${error.message}`)
  return (data ?? []) as ClassRow[]
}

async function computeAndPersistClassSnapshot(
  admin: TypedSupabaseClient,
  cls: ClassRow,
  computedAt: string,
): Promise<void> {
  const { data: enrollments, error: enrollErr } = await admin
    .from('enrollments')
    .select('student_id')
    .eq('class_id', cls.id)
    .eq('status', 'active')

  if (enrollErr) throw new Error(`enrollments: ${enrollErr.message}`)

  const studentIds = (enrollments ?? []).map((e) => e.student_id as string)

  if (studentIds.length === 0) {
    const empty = computeClassEngagementSnapshot({
      classId: cls.id,
      organizationId: cls.organization_id,
      className: cls.name,
      studentIds: [],
      studentNames: new Map(),
      studentStreaks: new Map(),
      activityTimestampsByUser: new Map(),
      performance: [],
      computedAt,
    })
    const { error: insertErr } = await admin
      .from('engagement_snapshots_class')
      .insert(serializeClassSnapshotRow(empty))
    if (insertErr) throw new Error(`insert class snapshot: ${insertErr.message}`)
    return
  }

  const since14d = new Date(Date.now() - 14 * 86_400_000).toISOString()

  const [usersRes, perfRes, answersRes] = await Promise.all([
    admin.from('users').select('id, nome, streak').in('id', studentIds),
    admin
      .from('topic_performance')
      .select('user_id, area_key, topico_value, p_know, last_practiced')
      .in('user_id', studentIds),
    admin
      .from('user_question_answers')
      .select('user_id, created_at')
      .in('user_id', studentIds)
      .gte('created_at', since14d),
  ])

  if (usersRes.error) throw new Error(`users: ${usersRes.error.message}`)
  if (perfRes.error) throw new Error(`topic_performance: ${perfRes.error.message}`)
  if (answersRes.error) throw new Error(`answers: ${answersRes.error.message}`)

  const studentNames = new Map(
    (usersRes.data ?? []).map((u) => [u.id as string, (u.nome as string | null) ?? 'Aluno']),
  )
  const studentStreaks = new Map(
    (usersRes.data ?? []).map((u) => [u.id as string, (u.streak as number | null) ?? 0]),
  )

  const activityTimestampsByUser = new Map<string, string[]>()
  for (const row of answersRes.data ?? []) {
    const uid = row.user_id as string
    const list = activityTimestampsByUser.get(uid) ?? []
    list.push(row.created_at as string)
    activityTimestampsByUser.set(uid, list)
  }

  const snapshot = computeClassEngagementSnapshot({
    classId: cls.id,
    organizationId: cls.organization_id,
    className: cls.name,
    studentIds,
    studentNames,
    studentStreaks,
    activityTimestampsByUser,
    performance: (perfRes.data ?? []) as TopicPerformanceInsightRow[],
    computedAt,
  })

  const { error: insertErr } = await admin
    .from('engagement_snapshots_class')
    .insert(serializeClassSnapshotRow(snapshot))

  if (insertErr) throw new Error(`insert class snapshot: ${insertErr.message}`)
}

export async function refreshEngagementSnapshots(
  admin: TypedSupabaseClient,
  organizationId?: string,
): Promise<{ organizationsProcessed: number; classesProcessed: number; computedAt: string }> {
  const computedAt = new Date().toISOString()
  const classes = await fetchActiveClasses(admin, organizationId)

  const orgIds = new Set<string>()
  for (const cls of classes) {
    orgIds.add(cls.organization_id)
    await computeAndPersistClassSnapshot(admin, cls, computedAt)
  }

  if (organizationId && !orgIds.has(organizationId)) {
    orgIds.add(organizationId)
  }

  for (const orgId of orgIds) {
    const orgClasses = classes.filter((c) => c.organization_id === orgId)
    const classSnapshots = []

    for (const cls of orgClasses) {
      const { data: latest, error } = await admin
        .from('engagement_snapshots_class')
        .select('*')
        .eq('class_id', cls.id)
        .eq('computed_at', computedAt)
        .maybeSingle()

      if (error) throw new Error(`read class snapshot: ${error.message}`)
      if (!latest) continue

      classSnapshots.push({
        classId: latest.class_id as string,
        organizationId: latest.organization_id as string,
        computedAt: latest.computed_at as string,
        totalStudents: latest.total_students as number,
        active7dCount: latest.active_7d_count as number,
        active7dPct: Number(latest.active_7d_pct),
        streakBrokenCount: latest.streak_broken_count as number,
        missingCount: latest.missing_count as number,
        missingDaysThreshold: latest.missing_days_threshold as number,
        avgPKnowByArea: (latest.avg_p_know_by_area as Record<string, number>) ?? {},
        weakTopics: (latest.weak_topics as never[]) ?? [],
        atRiskStudentIds: (latest.at_risk_student_ids as string[]) ?? [],
        students: (latest.student_engagement as never[]) ?? [],
        areaStats: [],
        atRisk: { inactive: [], struggling: [] },
        className: cls.name,
      })
    }

    const orgSnapshot = computeOrgEngagementSnapshot({
      organizationId: orgId,
      classSnapshots,
      computedAt,
    })

    const { error: orgInsertErr } = await admin
      .from('engagement_snapshots_org')
      .insert(serializeOrgSnapshotRow(orgSnapshot))

    if (orgInsertErr) throw new Error(`insert org snapshot: ${orgInsertErr.message}`)
  }

  return {
    organizationsProcessed: orgIds.size,
    classesProcessed: classes.length,
    computedAt,
  }
}

export async function loadLatestOrgSnapshot(admin: TypedSupabaseClient, organizationId: string) {
  const { data, error } = await admin
    .from('engagement_snapshots_org')
    .select('*')
    .eq('organization_id', organizationId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function loadLatestClassSnapshot(admin: TypedSupabaseClient, classId: string) {
  const { data, error } = await admin
    .from('engagement_snapshots_class')
    .select('*')
    .eq('class_id', classId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function loadActiveFollowUps(admin: TypedSupabaseClient, classId: string) {
  const { data, error } = await admin
    .from('student_follow_ups')
    .select('student_id, note, marked_by, created_at')
    .eq('class_id', classId)
    .eq('status', 'active')

  if (error) throw new Error(error.message)
  return data ?? []
}

export { computeClassEngagementSnapshot, computeAndPersistClassSnapshot }
