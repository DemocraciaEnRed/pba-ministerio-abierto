import { isSiteIndexable } from '#shared/utils/seo'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)

  if (!isSiteIndexable(config.public.siteIndexable)) {
    setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  }
})
