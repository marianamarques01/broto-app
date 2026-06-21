export type InstitutionsLandingVariant = 'a' | 'b'

const STORAGE_KEY = 'broto:institutions-landing-variant'

export type HeroCopy = {
  eyebrow: string
  title: string
  titleAccent: string
  lead: string
}

export const HERO_VARIANTS: Record<InstitutionsLandingVariant, HeroCopy> = {
  a: {
    eyebrow: 'Plataforma de aprendizagem adaptativa para instituições',
    title: 'Seu conteúdo. Sua marca.',
    titleAccent: 'Aprendizagem que acompanha cada aluno.',
    lead: 'O Broto transforma apostilas, aulas e materiais da sua instituição em rotinas de estudo personalizadas — e entrega à coordenação a visibilidade que um LMS não oferece.',
  },
  b: {
    eyebrow: 'Inteligência pedagógica para quem coordena turmas',
    title: 'Visibilidade pedagógica real.',
    titleAccent: 'Antes que o aluno desista.',
    lead: 'Saiba quem parou de estudar, onde estão as lacunas e intervenha com dados — enquanto seus alunos seguem rotinas personalizadas com o material oficial da instituição.',
  },
}

function parseVariantParam(raw: string | null): InstitutionsLandingVariant | null {
  if (raw === 'a' || raw === 'b') return raw
  return null
}

/** Atribui ou recupera variante A/B (query `?variant=a|b` tem prioridade). */
export function resolveInstitutionsLandingVariant(
  searchParams: URLSearchParams,
): InstitutionsLandingVariant {
  const forced = parseVariantParam(searchParams.get('variant'))
  if (forced) {
    sessionStorage.setItem(STORAGE_KEY, forced)
    return forced
  }

  const stored = parseVariantParam(sessionStorage.getItem(STORAGE_KEY))
  if (stored) return stored

  const assigned: InstitutionsLandingVariant = Math.random() < 0.5 ? 'a' : 'b'
  sessionStorage.setItem(STORAGE_KEY, assigned)
  return assigned
}
