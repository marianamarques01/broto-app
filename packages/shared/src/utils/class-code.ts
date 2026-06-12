/**
 * Gera um codigo de acesso unico para a turma.
 * Formato: 3 letras maiusculas + 3 numeros (ex: BRT042)
 */
export function generateClassCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const digits = '0123456789'
  const l = Array.from(
    { length: 3 },
    () => letters[Math.floor(Math.random() * letters.length)],
  ).join('')
  const d = Array.from({ length: 3 }, () => digits[Math.floor(Math.random() * digits.length)]).join(
    '',
  )
  return l + d
}
