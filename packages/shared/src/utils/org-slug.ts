const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Normaliza nome de org para slug URL-safe (sem garantia de unicidade). */
export function slugifyOrganizationName(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)

  return base.length >= 2 ? base : 'instituicao'
}

export function isValidOrgSlug(slug: string): boolean {
  return SLUG_RE.test(slug) && slug.length >= 2 && slug.length <= 64
}

/** Anexa sufixo numérico se slug já existir (ex.: escola-abc-2). */
export function appendSlugSuffix(baseSlug: string, attempt: number): string {
  if (attempt <= 1) return baseSlug
  const suffix = `-${attempt}`
  const maxBase = 64 - suffix.length
  return `${baseSlug.slice(0, maxBase)}${suffix}`
}
