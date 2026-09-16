/**
 * Utilidades para links de YouTube. El registro audiovisual guarda solo la URL:
 * del ID se derivan el thumbnail y el embed, así no hace falta subir portada.
 */

// Acepta youtube.com/watch?v=, youtu.be/, /embed/ y /shorts/.
const YOUTUBE_ID_PATTERNS = [
  /[?&]v=([\w-]{11})/,
  /youtu\.be\/([\w-]{11})/,
  /youtube\.com\/embed\/([\w-]{11})/,
  /youtube\.com\/shorts\/([\w-]{11})/
]

/** Extrae el ID de 11 caracteres de una URL de YouTube, o `null` si no es válida. */
export function extractYoutubeId(url: string): string | null {
  const trimmed = url.trim()

  for (const pattern of YOUTUBE_ID_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match?.[1]) {
      return match[1]
    }
  }

  return null
}

/** `true` si la URL corresponde a un video de YouTube reconocible. */
export function isValidYoutubeUrl(url: string): boolean {
  return extractYoutubeId(url) !== null
}

/** URL del thumbnail (`hqdefault` existe para todos los videos). */
export function youtubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

/** URL de embed para iframes. */
export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
}

/** URL canónica de reproducción. */
export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}
