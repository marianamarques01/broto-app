import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useEngagementClass } from '@/hooks/useEngagementClass'
import { ClassDomainByArea } from '@/components/teacher/ClassDomainByArea'
import { ClassAtRiskAlerts } from '@/components/teacher/ClassAtRiskAlerts'
import { ClassWeakTopicsPanel } from '@/components/teacher/ClassWeakTopicsPanel'
import { StudentEngagementList } from '@/components/teacher/StudentEngagementList'
import { ClassCodeBadge } from '@/components/class/ClassCodeBadge'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import type { Class } from '@broto/shared'

type Tab = 'students' | 'overview' | 'alerts'

export function ClassTeacherDashboard() {
  const { classId } = useParams<{ classId: string }>()
  const [cls, setCls] = useState<Class | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('students')
  const {
    data: engagement,
    loading: engagementLoading,
    error: engagementError,
    setFollowUp,
  } = useEngagementClass(classId)

  useEffect(() => {
    if (!classId) return
    void supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single()
      .then(({ data }) => setCls(data as Class | null))
  }, [classId])

  const snapshot = engagement?.snapshot ?? null

  const followUpStudentIds = useMemo(
    () => new Set(engagement?.followUps.map((f) => f.studentId) ?? []),
    [engagement],
  )

  const tabStyle = (tab: Tab) => ({
    padding: '10px 20px',
    border: 'none',
    background: 'transparent',
    borderBottom: activeTab === tab ? '2px solid var(--green-600)' : '2px solid transparent',
    color: activeTab === tab ? 'var(--green-400)' : 'var(--text-muted)',
    fontWeight: activeTab === tab ? 500 : 400,
    cursor: 'pointer' as const,
    fontSize: 14,
  })

  const studentCount = snapshot?.totalStudents ?? 0

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-void)',
        color: 'var(--text-primary)',
      }}
    >
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header
          title={cls?.name ?? 'Turma'}
          subtitle={cls && <ClassCodeBadge code={cls.access_code} />}
          backTo={`/classes/${classId}`}
        />

        <div
          style={{
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-default)',
            paddingLeft: 32,
          }}
        >
          <button
            type="button"
            style={tabStyle('students')}
            onClick={() => setActiveTab('students')}
          >
            Alunos
          </button>
          <button
            type="button"
            style={tabStyle('overview')}
            onClick={() => setActiveTab('overview')}
          >
            Habilidades
          </button>
          <button type="button" style={tabStyle('alerts')} onClick={() => setActiveTab('alerts')}>
            Alertas
          </button>
        </div>

        <main style={{ padding: '24px 32px', flex: 1, maxWidth: 720 }}>
          {engagementError && (
            <p style={{ color: 'var(--red-400)', fontSize: 14, marginBottom: 16 }}>
              {engagementError}
            </p>
          )}
          {engagement?.computedInline && (
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>
              Snapshot ainda não gerado — exibindo cálculo em tempo real.
            </p>
          )}

          {activeTab === 'students' && (
            <StudentEngagementList
              classId={classId!}
              snapshot={snapshot}
              followUpStudentIds={followUpStudentIds}
              loading={engagementLoading}
              accessCode={cls?.access_code}
              onFollowUp={async (studentId, action) => {
                await setFollowUp({ classId: classId!, studentId, action })
              }}
            />
          )}

          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <ClassWeakTopicsPanel
                weakTopics={snapshot?.weakTopics ?? []}
                loading={engagementLoading}
                studentCount={studentCount}
              />
              <ClassDomainByArea
                areaStats={snapshot?.areaStats ?? []}
                loading={engagementLoading}
                studentCount={studentCount}
              />
            </div>
          )}

          {activeTab === 'alerts' && (
            <ClassAtRiskAlerts
              atRisk={snapshot?.atRisk ?? { inactive: [], struggling: [] }}
              loading={engagementLoading}
              studentCount={studentCount}
              classId={classId!}
            />
          )}
        </main>
      </div>
    </div>
  )
}
