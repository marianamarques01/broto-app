import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useMaterials } from '@/hooks/useMaterials'
import { useClasses } from '@/hooks/useClasses'
import { MaterialsList } from '@/components/materials/MaterialsList'
import { MaterialUpload } from '@/components/materials/MaterialUpload'
import { ClassCodeBadge } from '@/components/class/ClassCodeBadge'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import type { Class } from '@broto/shared'

export function ClassDetail() {
  const { classId } = useParams<{ classId: string }>()
  const navigate = useNavigate()
  const [cls, setCls] = useState<Class | null>(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reindexing, setReindexing] = useState(false)

  const {
    materials,
    loading: materialsLoading,
    uploadPDF,
    addURL,
    deleteMaterial,
    reindexAllMaterials,
  } = useMaterials(classId!)
  const { updateClass, deleteClass } = useClasses()

  const [prevClassId, setPrevClassId] = useState(classId)
  if (classId !== prevClassId) {
    setPrevClassId(classId)
    setEditing(false)
    setShowDeleteConfirm(false)
  }

  useEffect(() => {
    void supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single()
      .then(({ data }) => {
        const c = data as Class | null
        setCls(c)
        if (c) {
          setEditName(c.name)
          setEditDescription(c.description ?? '')
        }
      })
  }, [classId])

  async function handleSave() {
    if (!classId || !editName.trim()) return
    setSaving(true)
    const { error } = await updateClass(classId, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
    })
    if (!error) {
      setCls((prev) =>
        prev
          ? { ...prev, name: editName.trim(), description: editDescription.trim() || undefined }
          : prev,
      )
      setEditing(false)
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!classId) return
    setDeleting(true)
    const { error } = await deleteClass(classId)
    if (!error) {
      navigate('/')
    } else {
      alert(error)
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  async function handleReindexAll() {
    setReindexing(true)
    const { error, indexed, failed, warnings } = await reindexAllMaterials()
    setReindexing(false)
    if (error) {
      alert(`${error} (${indexed} ok, ${failed} falha)`)
    } else if (warnings.length > 0) {
      alert(`${indexed} material(is) indexado(s) com ressalvas:\n\n${warnings.join('\n')}`)
    } else if (indexed > 0) {
      alert(`${indexed} material(is) indexado(s) no RAG.`)
    }
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
          title={cls?.name ?? 'Turma'}
          subtitle={cls && <ClassCodeBadge code={cls.access_code} />}
          backTo="/"
          action={
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => navigate(`/classes/${classId}/painel`)}
                style={{
                  background: 'var(--green-glow)',
                  border: '1px solid var(--green-600)',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 13,
                  cursor: 'pointer',
                  color: 'var(--green-400)',
                  fontWeight: 500,
                }}
              >
                Painel da turma
              </button>
              <button
                type="button"
                onClick={() => {
                  if (cls) {
                    setEditName(cls.name)
                    setEditDescription(cls.description ?? '')
                  }
                  setEditing(true)
                }}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 13,
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                }}
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--red-400)',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 13,
                  cursor: 'pointer',
                  color: 'var(--red-400)',
                }}
              >
                Excluir
              </button>
            </div>
          }
        />

        <main style={{ padding: '24px 32px', flex: 1 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 360px',
              gap: 24,
              alignItems: 'start',
            }}
          >
            <MaterialsList
              materials={materials}
              loading={materialsLoading}
              ragEnabled={cls?.rag_enabled === true}
              reindexing={reindexing}
              onDelete={deleteMaterial}
              onReindexAll={() => void handleReindexAll()}
            />
            <MaterialUpload classId={classId!} onUploadPDF={uploadPDF} onAddURL={addURL} />
          </div>
        </main>
      </div>

      {editing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={() => setEditing(false)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 12,
              padding: 32,
              width: 420,
              maxWidth: '90vw',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>Editar turma</h3>

            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 6,
                color: 'var(--text-secondary)',
              }}
            >
              Nome
            </label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-deep)',
                color: 'var(--text-primary)',
                borderRadius: 8,
                fontSize: 14,
                marginBottom: 16,
                boxSizing: 'border-box',
              }}
            />

            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 6,
                color: 'var(--text-secondary)',
              }}
            >
              Descricao
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border-strong)',
                borderRadius: 8,
                fontSize: 14,
                marginBottom: 20,
                resize: 'vertical',
                boxSizing: 'border-box',
                background: 'var(--bg-deep)',
                color: 'var(--text-primary)',
              }}
            />

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditing(false)}
                style={{
                  background: 'var(--bg-elevated)',
                  border: 'none',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  padding: '10px 20px',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editName.trim()}
                style={{
                  background: 'var(--green-600)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 20px',
                  fontSize: 14,
                  cursor: 'pointer',
                  opacity: saving || !editName.trim() ? 0.6 : 1,
                }}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 12,
              padding: 32,
              width: 400,
              maxWidth: '90vw',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: 'var(--red-400)' }}
            >
              Excluir turma
            </h3>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: 14,
                margin: '0 0 24px',
                lineHeight: 1.5,
              }}
            >
              Tem certeza que deseja excluir <strong>{cls?.name}</strong>? Essa acao nao pode ser
              desfeita. Todos os materiais e matriculas associados serao removidos.
            </p>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  background: 'var(--bg-elevated)',
                  border: 'none',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  padding: '10px 20px',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  background: 'var(--red-500)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 20px',
                  fontSize: 14,
                  cursor: 'pointer',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
