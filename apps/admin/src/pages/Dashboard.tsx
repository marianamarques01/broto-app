import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useClasses } from '@/hooks/useClasses'
import { CreateClassModal } from '@/components/class/CreateClassModal'
import { ClassCard } from '@/components/class/ClassCard'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export function Dashboard() {
  const { classes, loading, createClass } = useClasses()
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-void)', color: 'var(--text-primary)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header title="Turmas" action={
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
        } />

        <main style={{ padding: '24px 32px', flex: 1 }}>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Carregando turmas...</p>
          ) : classes.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '64px 0',
              color: 'var(--text-muted)',
            }}>
              <p style={{ fontSize: 16, marginBottom: 12 }}>Nenhuma turma criada ainda.</p>
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
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}>
              {classes.map(cls => (
                <Link
                  key={cls.id}
                  to={`/classes/${cls.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <ClassCard cls={cls} />
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateClassModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createClass}
        />
      )}
    </div>
  )
}
