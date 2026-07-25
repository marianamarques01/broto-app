import { useMemo, useState } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { resolveNetworkOrgId } from '@/lib/admin-roles'
import { useEngagementNetwork } from '@/hooks/useEngagementNetwork'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { NetworkDashboard } from '@/pages/network/NetworkDashboard'

export function NetworkDashboardPage() {
  const { admin } = useAdminAuth()
  const networkOrgId = resolveNetworkOrgId(admin)

  const [periodDays, setPeriodDays] = useState<number | undefined>(undefined)
  const [regional, setRegional] = useState('all')
  const [grade, setGrade] = useState('all')

  const filters = useMemo(
    () => ({
      periodDays,
      regional: regional === 'all' ? undefined : regional,
      grade: grade === 'all' ? undefined : grade,
    }),
    [periodDays, regional, grade],
  )

  const { data, loading, error, reload } = useEngagementNetwork(networkOrgId, filters)

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
          title="Rede"
          subtitle={data?.view.networkName ?? 'Painel multi-escola'}
          action={
            <button
              type="button"
              onClick={() => void reload()}
              disabled={loading}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-primary)',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Atualizar
            </button>
          }
        />

        <main style={{ padding: '32px 40px', flex: 1, maxWidth: 1400 }}>
          {error && (
            <p style={{ color: 'var(--red-400)', fontSize: 14, marginBottom: 16 }}>{error}</p>
          )}

          <NetworkDashboard
            view={data?.view ?? null}
            loading={loading}
            computedInline={data?.computedInline ?? false}
            periodDays={periodDays}
            regional={regional}
            grade={grade}
            onPeriodChange={setPeriodDays}
            onRegionalChange={setRegional}
            onGradeChange={setGrade}
          />
        </main>
      </div>
    </div>
  )
}
