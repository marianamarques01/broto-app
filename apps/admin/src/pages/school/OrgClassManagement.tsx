import { useMemo, useState } from 'react'
import type { Class, OrgStudentsImportResponse } from '@broto/shared'
import { parseOrgStudentsCsv, previewOrgStudentsCsv } from '@broto/shared'
import { CreateClassModal } from '@/components/class/CreateClassModal'
import { ClassCodeBadge } from '@/components/class/ClassCodeBadge'
import { useClasses } from '@/hooks/useClasses'
import { useOrgTeachers, type OrgTeacher } from '@/hooks/useOrgTeachers'
import { api } from '@/lib/api-client'
import { supabase } from '@/lib/supabase'

type Props = {
  organizationId: string
}

function teacherLabel(t: OrgTeacher) {
  return t.nome || t.email
}

export function OrgClassManagement({ organizationId }: Props) {
  const { classes, loading: classesLoading, createClass, refetch } = useClasses()
  const { teachers, loading: teachersLoading } = useOrgTeachers(organizationId)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTeacherByClass, setSelectedTeacherByClass] = useState<Record<string, string>>({})
  const [csvText, setCsvText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<OrgStudentsImportResponse | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importConfirmed, setImportConfirmed] = useState(false)
  const [linkingClassId, setLinkingClassId] = useState<string | null>(null)

  const csvPreview = useMemo(() => previewOrgStudentsCsv(csvText), [csvText])
  const validCsvCount = csvPreview.filter((r) => r.valid).length

  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.userId, t])), [teachers])

  async function handleCreateClass(params: {
    name: string
    description?: string
  }): Promise<{ data: Class | null; error: string | null }> {
    return createClass(params)
  }

  async function handleLinkTeacher(classId: string, teacherId: string) {
    setLinkingClassId(classId)
    const { error } = await supabase
      .from('classes')
      .update({ created_by: teacherId })
      .eq('id', classId)
      .eq('organization_id', organizationId)

    setLinkingClassId(null)
    if (error) {
      console.error('[OrgClassManagement] link teacher:', error.message)
      return
    }
    await refetch()
  }

  async function handleImport() {
    const rows = parseOrgStudentsCsv(csvText)
    if (rows.length === 0) {
      setImportError('CSV vazio ou formato inválido. Use: email,nome,turma_codigo')
      return
    }
    if (!importConfirmed) {
      setImportError('Revise a pré-visualização e confirme a importação.')
      return
    }

    setImporting(true)
    setImportError(null)
    setImportResult(null)

    try {
      const res = await api.post<OrgStudentsImportResponse>('org-students-import', {
        organizationId,
        rows,
      })
      setImportResult(res)
      if (res.imported > 0) await refetch()
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Erro na importação')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 4px' }}>Gestão de turmas</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            Criar turmas, importar alunos via CSV e vincular professor responsável.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          style={{
            background: 'var(--green-600)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          + Nova turma
        </button>
      </div>

      <div
        style={{
          padding: 16,
          borderRadius: 10,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>Importar alunos (CSV)</h3>
        <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-muted)' }}>
          Formato: <code>email,nome,turma_codigo</code> — uma linha por aluno. Cabeçalho opcional.
        </p>
        <textarea
          value={csvText}
          onChange={(e) => {
            setCsvText(e.target.value)
            setImportConfirmed(false)
            setImportResult(null)
          }}
          placeholder={'email,nome,turma_codigo\naluno@escola.com,João Silva,ABC123'}
          rows={5}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            background: 'var(--bg-deep)',
            color: 'var(--text-primary)',
            fontSize: 13,
            fontFamily: 'monospace',
            boxSizing: 'border-box',
            resize: 'vertical',
          }}
        />
        {importError && (
          <p style={{ color: 'var(--red-400)', fontSize: 13, margin: '8px 0 0' }}>{importError}</p>
        )}
        {csvPreview.length > 0 && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: '8px 0 0' }}>
            Pré-visualização: {validCsvCount} válida{validCsvCount !== 1 ? 's' : ''},{' '}
            {csvPreview.length - validCsvCount} com erro
          </p>
        )}
        {validCsvCount > 0 && (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 10,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={importConfirmed}
              onChange={(e) => setImportConfirmed(e.target.checked)}
            />
            Confirmo importação de {validCsvCount} aluno{validCsvCount !== 1 ? 's' : ''}
          </label>
        )}
        {importResult && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '8px 0 0' }}>
            {importResult.imported} importado{importResult.imported !== 1 ? 's' : ''},{' '}
            {importResult.failed} falha{importResult.failed !== 1 ? 's' : ''}.
          </p>
        )}
        <button
          type="button"
          onClick={() => void handleImport()}
          disabled={importing || !csvText.trim() || validCsvCount === 0 || !importConfirmed}
          style={{
            marginTop: 12,
            background: 'transparent',
            border: '1px solid var(--border-strong)',
            color: 'var(--text-primary)',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 14,
            cursor:
              importing || !csvText.trim() || validCsvCount === 0 || !importConfirmed
                ? 'not-allowed'
                : 'pointer',
            opacity:
              importing || !csvText.trim() || validCsvCount === 0 || !importConfirmed ? 0.6 : 1,
          }}
        >
          {importing ? 'Importando…' : 'Importar CSV'}
        </button>
      </div>

      {classesLoading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando turmas…</p>
      ) : classes.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nenhuma turma cadastrada.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {classes.map((cls) => {
            const currentTeacherId = selectedTeacherByClass[cls.id] ?? cls.created_by ?? ''
            const linkedTeacher = teacherMap.get(currentTeacherId)
            return (
              <div
                key={cls.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ flex: 1, minWidth: 180 }}>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>{cls.name}</p>
                  <div style={{ marginTop: 4 }}>
                    <ClassCodeBadge code={cls.access_code} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Professor:</label>
                  <select
                    value={currentTeacherId}
                    onChange={(e) => {
                      const teacherId = e.target.value
                      setSelectedTeacherByClass((prev) => ({ ...prev, [cls.id]: teacherId }))
                      void handleLinkTeacher(cls.id, teacherId)
                    }}
                    disabled={teachersLoading || linkingClassId === cls.id}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: '1px solid var(--border-strong)',
                      background: 'var(--bg-deep)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      minWidth: 160,
                    }}
                  >
                    <option value="">— selecionar —</option>
                    {teachers.map((t) => (
                      <option key={t.userId} value={t.userId}>
                        {teacherLabel(t)}
                      </option>
                    ))}
                  </select>
                  {linkedTeacher && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>vinculado</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateClassModal
          onClose={() => {
            setShowCreateModal(false)
            void refetch()
          }}
          onCreate={handleCreateClass}
        />
      )}
    </div>
  )
}
