import { useMemo, useState } from 'react'
import {
  INSTITUTION_TYPE_LABELS,
  parseOrgStudentsCsv,
  previewOrgStudentsCsv,
  type InstitutionType,
  type OrgOnboardCreateResponse,
  type OrgStudentsImportResponse,
} from '@broto/shared'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { ClassCodeBadge } from '@/components/class/ClassCodeBadge'
import { api } from '@/lib/api-client'

type Step = 'org' | 'invite' | 'import' | 'done'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid var(--border-strong)',
  borderRadius: 8,
  fontSize: 14,
  boxSizing: 'border-box',
  background: 'var(--bg-deep)',
  color: 'var(--text-primary)',
}

const btnPrimary: React.CSSProperties = {
  background: 'var(--green-600)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '10px 18px',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
}

const btnSecondary: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border-strong)',
  color: 'var(--text-primary)',
  borderRadius: 8,
  padding: '10px 18px',
  fontSize: 14,
  cursor: 'pointer',
}

function adminLoginUrl(inviteCode: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/login?invite=${encodeURIComponent(inviteCode)}`
}

export function InstitutionalOnboarding() {
  const [step, setStep] = useState<Step>('org')
  const [name, setName] = useState('')
  const [institutionType, setInstitutionType] = useState<InstitutionType>('escola_privada')
  const [coordinatorEmail, setCoordinatorEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [created, setCreated] = useState<OrgOnboardCreateResponse | null>(null)

  const [csvText, setCsvText] = useState('')
  const [importConfirmed, setImportConfirmed] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<OrgStudentsImportResponse | null>(null)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const preview = useMemo(() => previewOrgStudentsCsv(csvText), [csvText])
  const validCount = preview.filter((r) => r.valid).length
  const invalidCount = preview.length - validCount

  async function handleCreateOrg() {
    if (name.trim().length < 2) {
      setCreateError('Informe o nome da instituição (mín. 2 caracteres).')
      return
    }

    setCreating(true)
    setCreateError(null)

    try {
      const res = await api.post<OrgOnboardCreateResponse>('org-onboard-create', {
        name: name.trim(),
        institutionType,
        coordinatorEmail: coordinatorEmail.trim() || undefined,
        createDefaultClass: true,
      })
      setCreated(res)
      setStep('invite')
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Erro ao criar instituição')
    } finally {
      setCreating(false)
    }
  }

  async function handleImport() {
    if (!created?.organizationId) return
    const rows = parseOrgStudentsCsv(csvText)
    if (rows.length === 0) {
      setImportError('CSV vazio ou formato inválido.')
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
        organizationId: created.organizationId,
        rows,
      })
      setImportResult(res)
      setStep('done')
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Erro na importação')
    } finally {
      setImporting(false)
    }
  }

  async function copyText(value: string, kind: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      setCopied(null)
    }
  }

  const stepLabels: Record<Step, string> = {
    org: '1. Instituição',
    invite: '2. Convite professor',
    import: '3. Importar alunos',
    done: 'Concluído',
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
          title="Onboarding institucional"
          subtitle="Fluxo operado pela equipe Broto — sem SQL manual"
        />

        <main style={{ padding: '24px 32px', flex: 1, maxWidth: 720 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 24px' }}>
            Etapa atual: <strong>{stepLabels[step]}</strong>
          </p>

          {step === 'org' && (
            <section
              style={{
                padding: 20,
                borderRadius: 12,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 16px' }}>
                Cadastrar instituição
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label
                    style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}
                  >
                    Nome
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Colégio Exemplo"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label
                    style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}
                  >
                    Tipo
                  </label>
                  <select
                    value={institutionType}
                    onChange={(e) => setInstitutionType(e.target.value as InstitutionType)}
                    style={inputStyle}
                  >
                    {(Object.keys(INSTITUTION_TYPE_LABELS) as InstitutionType[]).map((key) => (
                      <option key={key} value={key}>
                        {INSTITUTION_TYPE_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}
                  >
                    E-mail do coordenador (opcional)
                  </label>
                  <input
                    type="email"
                    value={coordinatorEmail}
                    onChange={(e) => setCoordinatorEmail(e.target.value)}
                    placeholder="coordenador@escola.com"
                    style={inputStyle}
                  />
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0' }}>
                    Recebe acesso org_admin na nova organização.
                  </p>
                </div>
              </div>

              {createError && (
                <p style={{ color: 'var(--red-400)', fontSize: 13, marginTop: 12 }}>
                  {createError}
                </p>
              )}

              <button
                type="button"
                onClick={() => void handleCreateOrg()}
                disabled={creating}
                style={{ ...btnPrimary, marginTop: 20, opacity: creating ? 0.7 : 1 }}
              >
                {creating ? 'Criando…' : 'Criar instituição'}
              </button>
            </section>
          )}

          {step === 'invite' && created && (
            <section
              style={{
                padding: 20,
                borderRadius: 12,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>
                {created.organizationName}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px' }}>
                Slug: <code>{created.slug}</code>
                {created.defaultClassAccessCode && (
                  <>
                    {' '}
                    · Turma inicial: <ClassCodeBadge code={created.defaultClassAccessCode} />
                  </>
                )}
              </p>

              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>
                Convite para professor
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                O professor usa o código no login do admin para receber membership{' '}
                <code>teacher</code> na organização.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <ClassCodeBadge code={created.teacherInviteCode} />
                <button
                  type="button"
                  style={btnSecondary}
                  onClick={() => void copyText(created.teacherInviteCode, 'code')}
                >
                  {copied === 'code' ? 'Copiado!' : 'Copiar código'}
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                <button
                  type="button"
                  style={btnSecondary}
                  onClick={() => void copyText(adminLoginUrl(created.teacherInviteCode), 'link')}
                >
                  {copied === 'link' ? 'Link copiado!' : 'Copiar link de login'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" style={btnSecondary} onClick={() => setStep('org')}>
                  Voltar
                </button>
                <button type="button" style={btnPrimary} onClick={() => setStep('import')}>
                  Próximo: importar alunos
                </button>
              </div>
            </section>
          )}

          {step === 'import' && created && (
            <section
              style={{
                padding: 20,
                borderRadius: 12,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>Importar alunos</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px' }}>
                Formato: <code>email,nome,turma_codigo</code> — use o código da turma (ex.:{' '}
                {created.defaultClassAccessCode ?? 'ABC123'}).
              </p>

              <textarea
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value)
                  setImportConfirmed(false)
                  setImportResult(null)
                }}
                placeholder={`email,nome,turma_codigo\naluno@escola.com,João Silva,${created.defaultClassAccessCode ?? 'ABC123'}`}
                rows={6}
                style={{
                  ...inputStyle,
                  fontFamily: 'monospace',
                  resize: 'vertical',
                }}
              />

              {preview.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 13, margin: '0 0 8px' }}>
                    Pré-visualização: {validCount} válida{validCount !== 1 ? 's' : ''},{' '}
                    {invalidCount} com erro
                  </p>
                  <div
                    style={{
                      maxHeight: 220,
                      overflow: 'auto',
                      border: '1px solid var(--border-default)',
                      borderRadius: 8,
                    }}
                  >
                    <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-deep)' }}>
                          <th style={{ textAlign: 'left', padding: 8 }}>#</th>
                          <th style={{ textAlign: 'left', padding: 8 }}>E-mail</th>
                          <th style={{ textAlign: 'left', padding: 8 }}>Turma</th>
                          <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row) => (
                          <tr
                            key={row.line}
                            style={{ borderTop: '1px solid var(--border-default)' }}
                          >
                            <td style={{ padding: 8 }}>{row.line}</td>
                            <td style={{ padding: 8 }}>{row.email}</td>
                            <td style={{ padding: 8 }}>{row.turmaCodigo}</td>
                            <td
                              style={{
                                padding: 8,
                                color: row.valid ? 'var(--green-400)' : 'var(--red-400)',
                              }}
                            >
                              {row.valid ? 'OK' : row.error}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 12,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={importConfirmed}
                      onChange={(e) => setImportConfirmed(e.target.checked)}
                    />
                    Confirmo a importação de {validCount} aluno{validCount !== 1 ? 's' : ''} válido
                    {validCount !== 1 ? 's' : ''}
                  </label>
                </div>
              )}

              {importError && (
                <p style={{ color: 'var(--red-400)', fontSize: 13, marginTop: 12 }}>
                  {importError}
                </p>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button type="button" style={btnSecondary} onClick={() => setStep('invite')}>
                  Voltar
                </button>
                <button
                  type="button"
                  style={{ ...btnPrimary, opacity: importing || validCount === 0 ? 0.6 : 1 }}
                  disabled={importing || validCount === 0}
                  onClick={() => void handleImport()}
                >
                  {importing ? 'Importando…' : 'Importar alunos'}
                </button>
                <button type="button" style={btnSecondary} onClick={() => setStep('done')}>
                  Pular importação
                </button>
              </div>
            </section>
          )}

          {step === 'done' && created && (
            <section
              style={{
                padding: 20,
                borderRadius: 12,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 12px' }}>
                Instituição pronta
              </h2>
              <p style={{ fontSize: 14, margin: '0 0 8px' }}>
                <strong>{created.organizationName}</strong> cadastrada com sucesso.
              </p>
              {importResult && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                  Importação: {importResult.imported} aluno
                  {importResult.imported !== 1 ? 's' : ''}, {importResult.failed} falha
                  {importResult.failed !== 1 ? 's' : ''}.
                </p>
              )}
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px' }}>
                Próximos passos: enviar convite ao professor, coordenador acessa{' '}
                <code>/escola</code> após login.
              </p>
              <button
                type="button"
                style={btnPrimary}
                onClick={() => {
                  setStep('org')
                  setName('')
                  setCoordinatorEmail('')
                  setCreated(null)
                  setCsvText('')
                  setImportResult(null)
                  setImportConfirmed(false)
                }}
              >
                Cadastrar outra instituição
              </button>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
