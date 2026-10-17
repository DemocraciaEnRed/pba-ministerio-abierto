import type { DropdownMenuItem } from '@nuxt/ui'
import type { AdminComment } from '~/types/consulta'

type ModerationAction = 'hide' | 'show' | 'delete'

/**
 * Acciones de moderación de comentarios (ocultar, mostrar, eliminar) con su
 * modal de confirmación. Lo comparten la bandeja y el panel lateral del hilo.
 * `onChanged` se llama después de cada acción exitosa para refrescar los datos.
 */
export function useCommentModeration(onChanged: (comment: AdminComment) => void | Promise<void>) {
  const toast = useToast()

  const confirmOpen = ref(false)
  const processing = ref(false)
  const target = ref<AdminComment | null>(null)
  const action = ref<ModerationAction>('hide')

  function ask(comment: AdminComment, type: ModerationAction): void {
    target.value = comment
    action.value = type
    confirmOpen.value = true
  }

  /**
   * Acciones disponibles según el estado de moderación. Un comentario borrado
   * no ofrece acciones (el borrado es final).
   */
  function actionsFor(comment: AdminComment): DropdownMenuItem[] {
    if (comment.moderationStatus === 'deleted') return []

    const toggle: DropdownMenuItem = comment.moderationStatus === 'visible'
      ? { label: 'Ocultar', icon: 'i-lucide-eye-off', onSelect: () => ask(comment, 'hide') }
      : { label: 'Mostrar', icon: 'i-lucide-eye', onSelect: () => ask(comment, 'show') }

    return [
      toggle,
      { type: 'separator' },
      { label: 'Eliminar', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => ask(comment, 'delete') }
    ]
  }

  const confirmConfig = computed(() => {
    if (action.value === 'delete') {
      return {
        title: 'Eliminar comentario',
        description: 'El comentario se borrará de forma permanente y no podrá restaurarse ni volver a moderarse. ¿Querés continuar?',
        confirmLabel: 'Eliminar',
        confirmColor: 'error' as const
      }
    }
    if (action.value === 'hide') {
      return {
        title: 'Ocultar comentario',
        description: 'El comentario dejará de verse en la vista pública. Podés volver a mostrarlo cuando quieras.',
        confirmLabel: 'Ocultar',
        confirmColor: 'warning' as const
      }
    }
    return {
      title: 'Mostrar comentario',
      description: 'El comentario volverá a verse en la vista pública.',
      confirmLabel: 'Mostrar',
      confirmColor: 'primary' as const
    }
  })

  async function confirm(): Promise<void> {
    const comment = target.value
    if (!comment) return

    processing.value = true
    try {
      if (action.value === 'delete') {
        await $fetch(`/api/comments/${comment.id}`, { method: 'DELETE' })
        toast.add({ title: 'Comentario eliminado', color: 'success' })
      } else {
        const moderationStatus = action.value === 'hide' ? 'hidden' : 'visible'
        await $fetch(`/api/comments/${comment.id}/moderation`, {
          method: 'POST',
          body: { moderationStatus }
        })
        toast.add({
          title: moderationStatus === 'hidden' ? 'Comentario ocultado' : 'Comentario visible',
          color: 'success'
        })
      }
      confirmOpen.value = false
      target.value = null
      await onChanged(comment)
    } catch (error) {
      toast.add({
        title: 'No se pudo completar la acción',
        description: getErrorMessage(error),
        color: 'error'
      })
    } finally {
      processing.value = false
    }
  }

  return { confirmOpen, processing, confirmConfig, actionsFor, confirm }
}
