export function isSiteIndexable(value: unknown): boolean {
  if (value === true || value === 'true') return true
  if (value === false || value === 'false' || value === '' || value == null) return false

  throw new Error('NUXT_PUBLIC_SITE_INDEXABLE debe ser true o false')
}

export function getRobotsPolicy(siteIndexable: unknown, noindex = false): string {
  return isSiteIndexable(siteIndexable) && !noindex ? 'index, follow' : 'noindex, nofollow'
}
