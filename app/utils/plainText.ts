/**
 * Convierte texto con markdown/HTML a texto plano apto para meta descriptions.
 * Elimina etiquetas, tokens de markdown y colapsa espacios; recorta a `maxLength`
 * agregando una elipsis cuando corresponde.
 */
export function toPlainText(input?: string | null, maxLength = 160): string {
  if (!input) return ''

  const text = input
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [texto](url) -> texto
    .replace(/<[^>]*>/g, ' ') // etiquetas HTML
    .replace(/[*_`~>#]/g, '') // tokens de énfasis/encabezado markdown
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trimEnd()}…`
}
