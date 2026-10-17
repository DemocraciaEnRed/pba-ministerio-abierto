import type { CommentModerationStatus, CommentReactionType } from '~/types/consulta'

/** Metadatos de presentación de cada tipo de reacción en el panel admin. */
export const COMMENT_REACTION_META: Record<CommentReactionType, { label: string, icon: string }> = {
  heart: { label: 'Me gusta', icon: 'i-lucide-heart' },
  agree: { label: 'De acuerdo', icon: 'i-lucide-thumbs-up' },
  idea: { label: 'Idea', icon: 'i-lucide-lightbulb' },
  relevant: { label: 'Relevante', icon: 'i-lucide-star' },
  deepen: { label: 'Profundizar', icon: 'i-lucide-layers' }
}

const COMMENT_REACTION_ORDER: CommentReactionType[] = ['heart', 'agree', 'idea', 'relevant', 'deepen']

/** Reacciones con al menos un voto, en el orden canónico. */
export function activeCommentReactions(
  counts: Record<CommentReactionType, number>
): { type: CommentReactionType, count: number }[] {
  return COMMENT_REACTION_ORDER
    .map(type => ({ type, count: counts[type] ?? 0 }))
    .filter(entry => entry.count > 0)
}

/** Etiqueta y color del badge de estado de moderación. */
export function commentStatusBadge(
  status: CommentModerationStatus
): { label: string, color: 'success' | 'warning' | 'error' } {
  if (status === 'visible') return { label: 'Visible', color: 'success' }
  if (status === 'hidden') return { label: 'Oculto', color: 'warning' }
  return { label: 'Borrado', color: 'error' }
}

/** Iniciales del autor para el avatar de respaldo. */
export function commentAuthorInitials(label: string | null | undefined): string {
  const trimmed = label?.trim()
  if (!trimmed) return '?'
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('')
}

/**
 * Panel de comentarios de la consulta con un hilo abierto en el panel lateral.
 * Si se indica una respuesta, se resalta dentro del hilo.
 */
export function commentThreadPanelLink(
  consultationId: number,
  rootCommentId: number,
  replyId?: number | null
): { path: string, query: Record<string, string> } {
  const query: Record<string, string> = { hilo: String(rootCommentId) }
  if (replyId) query.respuesta = String(replyId)
  return { path: consultationPanelPath(consultationId, 'comentarios'), query }
}
