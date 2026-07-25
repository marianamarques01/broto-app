import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useEngagementOrg } from '@/hooks/useEngagementOrg'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { OrgDashboard } from '@/pages/school/OrgDashboard'
import { OrgRiskAlerts } from '@/pages/school/OrgRiskAlerts'
import { OrgClassManagement } from '@/pages/school/OrgClassManagement'
import { OrgReportPrint, printOrgReport } from '@/pages/school/OrgReportPrint'
import { supabase } from '@/lib/supabase'

type Tab = 'overview' | 'alerts' | 'classes'

export function SchoolDashboardPage() {
  const { admin } = useAdminAuth()
  const organizationId = admin?.organization_id
  const { data, loading, error, reload } = useEngagementOrg(organizationId)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [orgName, setOrgName] = useState('Instituição')

  useEffect(() => {
    if (!organizationId) return
    void supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) setOrgName(data.name as string)
      })
  }, [organizationId])

  const snapshot = data?.snapshot ?? null

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
          title="Coordenação"
          subtitle={orgName}
          action={
            snapshot ? (
              <button
                type="button"
                onClick={() => printOrgReport()}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-primary)',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Exportar PDF
              </button>
            ) : undefined
          }
        />

        <div
          style={{
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-default)',
            paddingLeft: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: 32,
          }}
        >
          <div>
            <button
              type="button"
              style={tabStyle('overview')}
              onClick={() => setActiveTab('overview')}
            >
              Visão geral
            </button>
            <button type="button" style={tabStyle('alerts')} onClick={() => setActiveTab('alerts')}>
              Alertas
            </button>
            <button
              type="button"
              style={tabStyle('classes')}
              onClick={() => setActiveTab('classes')}
            >
              Turmas
            </button>
          </div>
          <button
            type="button"
            onClick={() => void reload()}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 12,
              cursor: loading ? 'not-allowed' : 'pointer',
              textDecoration: 'underline',
            }}
          >
            Atualizar dados
          </button>
        </div>

        <main style={{ padding: '24px 32px', flex: 1, maxWidth: 900 }}>
          {error && (
            <p style={{ color: 'var(--red-400)', fontSize: 14, marginBottom: 16 }}>{error}</p>
          )}

          {activeTab === 'overview' && (
            <OrgDashboard
              rankings={snapshot?.classRankings ?? []}
              loading={loading}
              orgActive7dPct={snapshot?.active7dPct ?? 0}
              totalStudents={snapshot?.totalStudents ?? 0}
              totalClasses={snapshot?.totalClasses ?? 0}
              abandonmentRiskIndex={snapshot?.abandonmentRiskIndex ?? 0}
              computedAt={snapshot?.computedAt ?? null}
              computedInline={data?.computedInline ?? false}
              onManageClasses={() => setActiveTab('classes')}
            />
          )}

          {activeTab === 'alerts' && (
            <OrgRiskAlerts alerts={snapshot?.atRiskAlerts ?? []} loading={loading} />
          )}

          {activeTab === 'classes' && organizationId && (
            <OrgClassManagement organizationId={organizationId} />
          )}
        </main>
      </div>

      {snapshot && (
        <OrgReportPrint
          snapshot={snapshot}
          orgName={orgName}
          generatedAt={new Date().toISOString()}
        />
      )}
    </div>
  )
}
