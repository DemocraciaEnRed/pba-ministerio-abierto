<script setup lang="ts">
import type { CommentAuthorMode, CommentReactionType } from '~/types/consulta'
import type { DropdownMenuItem } from '@nuxt/ui'

/**
 * Estado de moderación de un comentario en la vista admin.
 */
type ModerationStatus = 'visible' | 'hidden' | 'deleted'

/**
 * Comentario tal como lo devuelve la bandeja de moderación admin
 * (`GET /api/consultations/:slug/comments` y su equivalente por tema).
 */
export interface AdminComment {
  id: number
  containerType: 'consultation' | 'topic'
  consultationId: number | null
  topicId: number | null
  parentCommentId: number | null
  body: string
  authorMode: CommentAuthorMode
  authorLabel: string | null
  authorEmail: string
  authorAvatarUrl: string | null
  authorUserId: number
  moderationStatus: ModerationStatus
  deletedAt: string | null
  topicTitle: string | null
  topicSlug: string | null
  reactions: {
    counts: Record<CommentReactionType, number>
    mine: CommentReactionType[]
  }
  createdAt: string
  updatedAt: string
}

interface ModerationResponse {
  items: AdminComment[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

const props = defineProps<{
  /** Slug (o id) de la consulta a la que pertenece la bandeja. */
  consultationSlug: string
  /** Slug (o id) del tema. Si se pasa, la bandeja se acota a ese tema. */
  topicSlug?: string
}>()

const toast = useToast()

// Cuando la bandeja es de un tema, el contenedor es siempre el mismo tema,
// así que ocultamos la columna "Contenedor".
const showContainer = computed(() => !props.topicSlug)

const endpoint = computed(() =>
  props.topicSlug
    ? `/api/consultations/${props.consultationSlug}/topics/${props.topicSlug}/comments`
    : `/api/consultations/${props.consultationSlug}/comments`
)

type StatusFilter = 'all' | ModerationStatus

const filters = reactive({
  moderationStatus: 'all' as StatusFilter,
  page: 1,
  perPage: 20
})

const statusOptions = [
  { label: 'Todos los estados', value: 'all' },
  { label: 'Visibles', value: 'visible' },
  { label: 'Ocultos', value: 'hidden' },
  { label: 'Borrados', value: 'deleted' }
] satisfies { label: string, value: StatusFilter }[]

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin (estado de moderación) del usuario logueado.
const requestFetch = useRequestFetch()
const { data, status, refresh } = await useAsyncData(
  () => `admin-comments-${props.consultationSlug}-${props.topicSlug ?? 'all'}`,
  () => requestFetch<ModerationResponse>(endpoint.value, {
    query: {
      page: filters.page,
      perPage: filters.perPage,
      moderationStatus: filters.moderationStatus === 'all' ? undefined : filters.moderationStatus
    }
  }),
  {
    watch: [
      () => props.consultationSlug,
      () => props.topicSlug,
      () => filters.moderationStatus,
      () => filters.page
    ]
  }
)

const comments = computed(() => data.value?.items ?? [])
const pagination = computed(() => data.value?.pagination)

// Al cambiar el filtro de estado volvemos a la primera página.
watch(() => filters.moderationStatus, () => {
  filters.page = 1
})

/** Metadatos de presentación de cada tipo de reacción. */
const REACTION_META: Record<CommentReactionType, { label: string, icon: string }> = {
  heart: { label: 'Me gusta', icon: 'i-lucide-heart' },
  agree: { label: 'De acuerdo', icon: 'i-lucide-thumbs-up' },
  idea: { label: 'Idea', icon: 'i-lucide-lightbulb' },
  relevant: { label: 'Relevante', icon: 'i-lucide-star' },
  deepen: { label: 'Profundizar', icon: 'i-lucide-layers' }
}

const REACTION_ORDER: CommentReactionType[] = ['heart', 'agree', 'idea', 'relevant', 'deepen']

function activeReactions(comment: AdminComment): { type: CommentReactionType, count: number }[] {
  return REACTION_ORDER
    .map(type => ({ type, count: comment.reactions.counts[type] ?? 0 }))
    .filter(entry => entry.count > 0)
}

function statusBadge(status: ModerationStatus): { label: string, color: 'success' | 'warning' | 'error' } {
  if (status === 'visible') return { label: 'Visible', color: 'success' }
  if (status === 'hidden') return { label: 'Oculto', color: 'warning' }
  return { label: 'Borrado', color: 'error' }
}

function authorInitials(comment: AdminComment): string {
  const label = comment.authorLabel?.trim()
  if (!label) return '?'
  return label
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('')
}

/**
 * URL pública del contenedor del comentario (consulta o tema), para abrirla
 * en una nueva pestaña. En la bandeja del tema el `topicSlug` del DTO viene
 * nulo, así que se cae al `topicSlug` que recibe el componente por prop.
 */
function publicUrl(comment: AdminComment): string {
  const base = `/consultas/${props.consultationSlug}`
  if (comment.containerType === 'topic') {
    const topicSlug = comment.topicSlug ?? props.topicSlug
    return `${base}/temas/${topicSlug}`
  }
  return base
}

// --- Acciones de moderación con confirmación ---

type ActionType = 'hide' | 'show' | 'delete'

const confirmOpen = ref(false)
const actionTarget = ref<AdminComment | null>(null)
const actionType = ref<ActionType>('hide')
const processing = ref(false)

function askAction(comment: AdminComment, type: ActionType): void {
  actionTarget.value = comment
  actionType.value = type
  confirmOpen.value = true
}

/**
 * Acciones disponibles para un comentario según su estado de moderación.
 * Un comentario borrado no ofrece acciones (el borrado es final).
 */
function rowActions(comment: AdminComment): DropdownMenuItem[] {
  if (comment.moderationStatus === 'deleted') return []

  const toggle: DropdownMenuItem = comment.moderationStatus === 'visible'
    ? { label: 'Ocultar', icon: 'i-lucide-eye-off', onSelect: () => askAction(comment, 'hide') }
    : { label: 'Mostrar', icon: 'i-lucide-eye', onSelect: () => askAction(comment, 'show') }

  return [
    toggle,
    { type: 'separator' },
    { label: 'Eliminar', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => askAction(comment, 'delete') }
  ]
}

const confirmConfig = computed(() => {
  if (actionType.value === 'delete') {
    return {
      title: 'Eliminar comentario',
      description: 'El comentario se borrará de forma permanente y no podrá restaurarse ni volver a moderarse. ¿Querés continuar?',
      confirmLabel: 'Eliminar',
      confirmColor: 'error' as const
    }
  }
  if (actionType.value === 'hide') {
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

async function confirmAction(): Promise<void> {
  const target = actionTarget.value
  if (!target) return

  processing.value = true
  try {
    if (actionType.value === 'delete') {
      await $fetch(`/api/comments/${target.id}`, { method: 'DELETE' })
      toast.add({ title: 'Comentario eliminado', color: 'success' })
    } else {
      const moderationStatus = actionType.value === 'hide' ? 'hidden' : 'visible'
      await $fetch(`/api/comments/${target.id}/moderation`, {
        method: 'POST',
        body: { moderationStatus }
      })
      toast.add({
        title: moderationStatus === 'hidden' ? 'Comentario ocultado' : 'Comentario visible',
        color: 'success'
      })
    }
    confirmOpen.value = false
    actionTarget.value = null
    await refresh()
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
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <USelect
        v-model="filters.moderationStatus"
        :items="statusOptions"
        value-key="value"
        class="w-full sm:w-56"
      />
      <UButton
        label="Actualizar"
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="ghost"
        :loading="status === 'pending'"
        @click="refresh()"
      />
    </div>

    <UPageCard v-if="status === 'pending' && comments.length === 0">
      Cargando comentarios...
    </UPageCard>

    <AppTable
      v-else
      zebra
      align-last-right
      :empty="comments.length === 0"
    >
      <template #thead>
        <tr>
          <th>Autor</th>
          <th class="w-full">
            Comentario
          </th>
          <th>Acciones</th>
        </tr>
      </template>

      <template #tbody>
        <tr
          v-for="comment in comments"
          :key="comment.id"
        >
          <td class="align-top">
            <div class="flex items-start gap-3">
              <UTooltip text="Ver perfil">
                <NuxtLink
                  :to="`/u/${comment.authorUserId}`"
                  class="shrink-0 rounded-full transition hover:ring-2 hover:ring-primary"
                  :aria-label="`Ver perfil de ${comment.authorLabel || 'usuario'}`"
                >
                  <UAvatar
                    :src="comment.authorAvatarUrl ?? undefined"
                    :text="authorInitials(comment)"
                    size="md"
                  />
                </NuxtLink>
              </UTooltip>
              <div class="min-w-0 space-y-2">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium leading-tight">
                      {{ comment.authorLabel || 'Sin nombre' }}
                    </span>
                    <UBadge
                      v-if="comment.authorMode === 'institution'"
                      label="Institución"
                      icon="i-lucide-building-2"
                      color="primary"
                      variant="subtle"
                      size="sm"
                    />
                  </div>
                  <p class="truncate text-xs text-muted">
                    {{ comment.authorEmail }}
                  </p>
                </div>

                <UFieldGroup size="sm">
                  <UTooltip
                    v-if="showContainer && comment.containerType === 'topic'"
                    :text="comment.topicTitle ?? 'Tema'"
                  >
                    <UBadge
                      label="Tema"
                      icon="i-lucide-list-tree"
                      color="info"
                      variant="subtle"
                    />
                  </UTooltip>
                  <UBadge
                    v-else-if="showContainer"
                    label="Consulta"
                    icon="i-lucide-megaphone"
                    color="neutral"
                    variant="subtle"
                  />
                  <UBadge
                    :label="statusBadge(comment.moderationStatus).label"
                    :color="statusBadge(comment.moderationStatus).color"
                    icon="i-lucide-shield"
                    variant="subtle"
                  />
                  <UTooltip :text="formatDate(comment.createdAt)">
                    <UBadge
                      :label="formatDateShort(comment.createdAt)"
                      icon="i-lucide-calendar"
                      color="neutral"
                      variant="subtle"
                    />
                  </UTooltip>
                </UFieldGroup>
              </div>
            </div>
          </td>

          <td class="w-full align-top">
            <div class="space-y-1.5">
              <div
                v-if="comment.parentCommentId || activeReactions(comment).length > 0"
                class="flex flex-wrap items-center gap-1.5"
              >
                <UBadge
                  v-if="comment.parentCommentId"
                  label="Respuesta"
                  icon="i-lucide-corner-down-right"
                  color="neutral"
                  variant="soft"
                  size="sm"
                />
                <UTooltip
                  v-for="reaction in activeReactions(comment)"
                  :key="reaction.type"
                  arrow
                  :text="REACTION_META[reaction.type].label"
                >
                  <UBadge
                    :label="String(reaction.count)"
                    :icon="REACTION_META[reaction.type].icon"
                    color="neutral"
                    variant="soft"
                    size="sm"
                  />
                </UTooltip>
              </div>
              <p
                class="whitespace-pre-wrap text-sm"
              >
                {{ comment.body }}
              </p>
            </div>
          </td>

          <td class="align-top">
            <div class="flex justify-end gap-1">
              <UTooltip
                arrow
                :text="comment.containerType === 'topic' ? 'Abrir tema en nueva pestaña' : 'Abrir consulta en nueva pestaña'"
              >
                <UButton
                  :to="publicUrl(comment)"
                  target="_blank"
                  icon="i-lucide-external-link"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  aria-label="Abrir en nueva pestaña"
                />
              </UTooltip>
              <UTooltip
                v-if="comment.moderationStatus === 'deleted'"
                arrow
                text="Comentario borrado: sin acciones"
              >
                <UButton
                  icon="i-lucide-ban"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  disabled
                  aria-label="Sin acciones"
                />
              </UTooltip>
              <UDropdownMenu
                v-else
                :items="rowActions(comment)"
                :content="{ align: 'end' }"
              >
                <UButton
                  icon="i-lucide-ellipsis-vertical"
                  color="neutral"
                  variant="outline"
                  size="xs"
                  aria-label="Acciones"
                />
              </UDropdownMenu>
            </div>
          </td>
        </tr>
      </template>

      <template #empty>
        <UEmpty
          icon="i-lucide-message-square-off"
          title="No hay comentarios"
          description="No se encontraron comentarios para el filtro seleccionado."
        />
      </template>
    </AppTable>

    <div
      v-if="pagination && pagination.total > 0"
      class="flex flex-wrap items-center justify-between gap-3"
    >
      <p class="text-xs text-muted">
        {{ pagination.total }} {{ pagination.total === 1 ? 'comentario' : 'comentarios' }}
      </p>
      <UPagination
        v-model:page="filters.page"
        :items-per-page="pagination.perPage"
        :total="pagination.total"
      />
    </div>

    <ConfirmModal
      v-model:open="confirmOpen"
      :title="confirmConfig.title"
      :description="confirmConfig.description"
      :confirm-label="confirmConfig.confirmLabel"
      :confirm-color="confirmConfig.confirmColor"
      :loading="processing"
      @confirm="confirmAction"
    />
  </div>
</template>
