import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useClasses } from '@/hooks/useClasses'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { canCreateClass as canCreateClassRole } from '@/lib/admin-roles'
import { CreateClassModal } from '@/components/class/CreateClassModal'
import { ClassCard } from '@/components/class/ClassCard'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export function Dashboard() {
  const { admin } = useAdminAuth()
  const { classes, loading, createClass } = useClasses()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const isTeacher = admin?.role === 'teacher'
  const canCreateClass = canCreateClassRole(admin?.role)

  if (!loading && isTeacher && classes.length === 1) {
    return <Navigate to={`/classes/${classes[0]!.id}/painel`} replace />
  }

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
          title={isTeacher ? 'Minhas turmas' : 'Turmas'}
          action={
            canCreateClass ? (
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  background: 'var(--green-600)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 18px',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                + Nova turma
              </button>
            ) : undefined
          }
        />

        <main style={{ padding: '24px 32px', flex: 1 }}>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Carregando turmas...</p>
          ) : classes.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '64px 0',
                color: 'var(--text-muted)',
              }}
            >
              <p style={{ fontSize: 16, marginBottom: 12 }}>
                {isTeacher
                  ? 'Nenhuma turma vinculada à sua conta ainda.'
                  : 'Nenhuma turma criada ainda.'}
              </p>
              {canCreateClass && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-primary)',
                    borderRadius: 8,
                    padding: '10px 20px',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  Criar primeira turma
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 16,
              }}
            >
              {classes.map((cls) => (
                <div key={cls.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link
                    to={isTeacher ? `/classes/${cls.id}/painel` : `/classes/${cls.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <ClassCard cls={cls} />
                  </Link>
                  {isTeacher && (
                    <Link
                      to={`/classes/${cls.id}/painel`}
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--green-400)',
                        textDecoration: 'none',
                        paddingLeft: 4,
                      }}
                    >
                      Abrir painel da turma →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateClassModal onClose={() => setShowCreateModal(false)} onCreate={createClass} />
      )}
    </div>
  )
}
