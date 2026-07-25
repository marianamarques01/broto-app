import type { OrgStudentsImportRow } from '../types/engagement'
import type { OrgStudentsCsvPreviewRow } from '../types/institutional-onboarding'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function parseOrgStudentsCsv(text: string): OrgStudentsImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length === 0) return []

  const startIndex =
    lines[0]?.toLowerCase().includes('email') && lines[0]?.toLowerCase().includes('turma') ? 1 : 0

  const rows: OrgStudentsImportRow[] = []
  for (let i = startIndex; i < lines.length; i++) {
    const parts = lines[i]!.split(',').map((p) => p.trim().replace(/^"|"$/g, ''))
    if (parts.length < 3) continue
    rows.push({
      email: parts[0] ?? '',
      nome: parts[1] ?? '',
      turmaCodigo: (parts[2] ?? '').toUpperCase(),
    })
  }
  return rows
}

export function validateOrgStudentsCsvRow(
  row: OrgStudentsImportRow,
  line: number,
): OrgStudentsCsvPreviewRow {
  const email = row.email?.trim() ?? ''
  const nome = row.nome?.trim() ?? ''
  const turmaCodigo = row.turmaCodigo?.trim().toUpperCase() ?? ''

  if (!email || !EMAIL_RE.test(email)) {
    return { line, email, nome, turmaCodigo, valid: false, error: 'E-mail inválido' }
  }
  if (!nome) {
    return { line, email, nome, turmaCodigo, valid: false, error: 'Nome obrigatório' }
  }
  if (!turmaCodigo) {
    return {
      line,
      email,
      nome,
      turmaCodigo,
      valid: false,
      error: 'Código da turma obrigatório',
    }
  }

  return { line, email, nome, turmaCodigo, valid: true }
}

export function previewOrgStudentsCsv(text: string): OrgStudentsCsvPreviewRow[] {
  const rows = parseOrgStudentsCsv(text)
  return rows.map((row, index) => validateOrgStudentsCsvRow(row, index + 1))
}
