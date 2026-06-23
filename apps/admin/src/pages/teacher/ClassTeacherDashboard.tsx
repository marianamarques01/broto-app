import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useTeacherClassInsights } from '@/hooks/useTeacherClassInsights'
import { ClassDomainByArea } from '@/components/teacher/ClassDomainByArea'
import { ClassAtRiskAlerts } from '@/components/teacher/ClassAtRiskAlerts'
import { ClassCodeBadge } from '@/components/class/ClassCodeBadge'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import type { Class } from '@broto/shared'

type Tab = 'overview' | 'alerts'

export function ClassTeacherDashboard() {
  const { classId } = useParams<{ classId: string }>()
  const [cls, setCls] = useState<Class | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const { insights, loading, error } = useTeacherClassInsights(classId!)

  useEffect(() => {
    if (!classId) return
    void supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single()
      .then(({ data }) => setCls(data as Class | null))
  }, [classId])

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

  const studentCount = insights?.studentCount ?? 0

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
            style={tabStyle('overview')}
            onClick={() => setActiveTab('overview')}
          >
            Visão da Turma
          </button>
          <button type="button" style={tabStyle('alerts')} onClick={() => setActiveTab('alerts')}>
            Alertas
          </button>
        </div>

        <main style={{ padding: '24px 32px', flex: 1, maxWidth: 640 }}>
          {error && (
            <p style={{ color: 'var(--red-400)', fontSize: 14, marginBottom: 16 }}>{error}</p>
          )}

          {activeTab === 'overview' && (
            <ClassDomainByArea
              areaStats={insights?.areaStats ?? []}
              loading={loading}
              studentCount={studentCount}
            />
          )}

          {activeTab === 'alerts' && (
            <ClassAtRiskAlerts
              atRisk={insights?.atRisk ?? { inactive: [], struggling: [] }}
              loading={loading}
              studentCount={studentCount}
              classId={classId!}
            />
          )}
        </main>
      </div>
    </div>
  )
}
