/** Shared signup validation (Deno). Covered by validate_test.ts. */

export const MAX_NOME = 200
export const MAX_OPTIONAL = 120
export const MIN_PASSWORD = 6

export function trimStr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export type SignupPayload = {
  email: string
  password: string
  nome: string
  telefone: string | undefined
  cpf: string | undefined
  cidade: string | undefined
  estado: string | undefined
}

export function parseSignupBody(raw: unknown): SignupPayload {
  if (raw === null || typeof raw !== 'object') {
    throw new Error('Corpo inválido')
  }
  const b = raw as Record<string, unknown>

  const email = normalizeEmail(trimStr(b.email))
  const password = trimStr(b.password)
  const nome = trimStr(b.nome)

  if (!email || !email.includes('@')) throw new Error('E-mail inválido')
  if (password.length < MIN_PASSWORD) {
    throw new Error(`A senha deve ter pelo menos ${MIN_PASSWORD} caracteres`)
  }
  if (!nome) throw new Error('Nome é obrigatório')
  if (nome.length > MAX_NOME) throw new Error('Nome muito longo')

  const opt = (k: string): string | undefined => {
    const s = trimStr(b[k])
    if (!s) return undefined
    if (s.length > MAX_OPTIONAL) throw new Error(`${k} muito longo`)
    return s
  }

  return {
    email,
    password,
    nome,
    telefone: opt('telefone'),
    cpf: opt('cpf'),
    cidade: opt('cidade'),
    estado: opt('estado'),
  }
}

export function mapCreateUserError(message: string): { status: number; message: string } {
  const m = message.toLowerCase()
  if (
    m.includes('already registered') ||
    m.includes('already exists') ||
    m.includes('user already') ||
    m.includes('duplicate')
  ) {
    return { status: 409, message: 'Este e-mail já está cadastrado' }
  }
  if (m.includes('password')) {
    return { status: 400, message: 'Senha inválida' }
  }
  if (m.includes('email')) {
    return { status: 400, message: 'E-mail inválido' }
  }
  return { status: 400, message: 'Não foi possível criar a conta' }
}
