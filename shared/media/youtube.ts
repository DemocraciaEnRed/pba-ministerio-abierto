export const YOUTUBE_VIDEO_ID_PATTERN = /^[\w-]{11}$/

// Única forma de URL que el hook de DOMPurify deja pasar al renderizar Markdown.
export const YOUTUBE_EMBED_URL_PATTERN = /^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}(?:\?[\w=&.-]*)?$/

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com'
])

const YOUTU_BE_HOSTS = new Set(['youtu.be', 'www.youtu.be'])

const YOUTUBE_PATH_PREFIX = /^\/(?:embed|shorts|v|live)\//

export function extractYoutubeVideoId(input: string | null | undefined): string | null {
  const raw = input?.trim()
  if (!raw) return null

  const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/\//, '')}`

  let url: URL
  try {
    url = new URL(normalized)
  } catch {
    return null
  }

  let candidate: string | null = null

  if (YOUTU_BE_HOSTS.has(url.hostname)) {
    candidate = url.pathname.slice(1)
  } else if (YOUTUBE_HOSTS.has(url.hostname)) {
    candidate = url.searchParams.get('v')
      ?? (YOUTUBE_PATH_PREFIX.test(url.pathname) ? url.pathname.replace(YOUTUBE_PATH_PREFIX, '') : null)
  }

  const videoId = candidate?.split('/')[0] ?? ''
  return YOUTUBE_VIDEO_ID_PATTERN.test(videoId) ? videoId : null
}

export function buildYoutubeEmbedUrl(videoId: string, startAt?: number | null): string {
  const params = new URLSearchParams({ rel: '0', modestbranding: '1' })
  if (startAt && startAt > 0) {
    params.set('start', String(Math.floor(startAt)))
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
}
