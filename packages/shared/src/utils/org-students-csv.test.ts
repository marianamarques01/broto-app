import { describe, expect, it } from 'vitest'
import { appendSlugSuffix, slugifyOrganizationName } from './org-slug'
import { parseOrgStudentsCsv, previewOrgStudentsCsv } from './org-students-csv'

describe('slugifyOrganizationName', () => {
  it('normaliza acentos e espaços', () => {
    expect(slugifyOrganizationName('Colégio São Paulo')).toBe('colegio-sao-paulo')
  })

  it('retorna fallback para nome curto', () => {
    expect(slugifyOrganizationName('A')).toBe('instituicao')
  })
})

describe('appendSlugSuffix', () => {
  it('anexa sufixo a partir da segunda tentativa', () => {
    expect(appendSlugSuffix('escola-abc', 2)).toBe('escola-abc-2')
  })
})

describe('org-students-csv', () => {
  it('ignora cabeçalho e valida linhas', () => {
    const text = 'email,nome,turma_codigo\nok@x.com,João,ABC123\nbad,,ABC'
    const preview = previewOrgStudentsCsv(text)
    expect(preview).toHaveLength(2)
    expect(preview[0]?.valid).toBe(true)
    expect(preview[1]?.valid).toBe(false)
  })

  it('parseOrgStudentsCsv retorna turma em maiúsculas', () => {
    const rows = parseOrgStudentsCsv('a@b.com,Maria,xyz789')
    expect(rows[0]?.turmaCodigo).toBe('XYZ789')
  })
})
