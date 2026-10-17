<script setup lang="ts">
import type { AdminComment, AdminCommentsResponse } from '~/types/consulta'

const REPLIES_PER_PAGE = 10
// Tope de páginas a cargar automáticamente para llegar a una respuesta resaltada.
const MAX_AUTO_PAGES = 20

const props = defineProps<{
  /** Comentario raíz del hilo. */
  commentId: number | null
  /** Consulta a la que pertenece el hilo (para el enlace público). */
  consultationId: number
  /** Respuesta a resaltar (llegada desde el registro de comentarios). */
  highlightReplyId?: number | null
  /** Título de la consulta, para dar contexto cuando se abre fuera de su panel. */
  consultationTitle?: string | null
  /** Muestra el acceso al hilo dentro del panel de la consulta. */
  showPanelLink?: boolean
}>()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  changed: []
}>()

const root = ref<AdminComment | null>(null)
const replies = ref<AdminComment[]>([])
const repliesTotal = ref(0)
const repliesPage = ref(0)
const loadingRoot = ref(false)
const loadingReplies = ref(false)
const loadError = ref<string | null>(null)

const description = computed(() => {
  const topicTitle = root.value?.topicTitle
  if (props.consultationTitle) {
    return topicTitle ? `${props.consultationTitle} › ${topicTitle}` : props.consultationTitle
  }
  return topicTitle ? `Tema: ${topicTitle}` : 'Comentario y sus respuestas, en orden cronológico.'
})

const panelLink = computed(() => props.commentId === null
  ? undefined
  : commentThreadPanelLink(
      props.consultationId,
      props.commentId,
      props.highlightReplyId !== props.commentId ? props.highlightReplyId : null
    ))

const hasMoreReplies = computed(() => replies.value.length < repliesTotal.value)

const publicUrl = computed(() => {
  const comment = root.value
  if (comment?.containerType === 'topic' && comment.topicSlug) {
    return consultationPermalinkPath(props.consultationId, `temas/${comment.topicSlug}`)
  }
  return consultationPermalinkPath(props.consultationId)
})

async function fetchRepliesPage(page: number): Promise<void> {
  if (props.commentId === null) return
  loadingReplies.value = true
  try {
    const response = await $fetch<AdminCommentsResponse>(`/api/comments/${props.commentId}/replies`, {
      query: { view: 'moderation', order: 'oldest', page, perPage: REPLIES_PER_PAGE }
    })
    replies.value = page === 1 ? response.items : [...replies.value, ...response.items]
    repliesTotal.value = response.pagination.total
    repliesPage.value = page
  } finally {
    loadingReplies.value = false
  }
}

function scrollToHighlight(): void {
  if (!props.highlightReplyId || !import.meta.client) return
  nextTick(() => {
    document
      .getElementById(`comentario-${props.highlightReplyId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

async function loadThread(): Promise<void> {
  if (props.commentId === null) return

  loadingRoot.value = true
  loadError.value = null
  root.value = null
  replies.value = []
  repliesTotal.value = 0
  repliesPage.value = 0

  try {
    root.value = await $fetch<AdminComment>(`/api/comments/${props.commentId}`)
    await fetchRepliesPage(1)

    // Si se llegó desde una respuesta concreta, cargamos páginas hasta encontrarla.
    const target = props.highlightReplyId
    if (target && target !== props.commentId) {
      while (
        !replies.value.some(reply => reply.id === target)
        && hasMoreReplies.value
        && repliesPage.value < MAX_AUTO_PAGES
      ) {
        await fetchRepliesPage(repliesPage.value + 1)
      }
      scrollToHighlight()
    }
  } catch (error) {
    loadError.value = getErrorMessage(error, 'No se pudo cargar el hilo.')
  } finally {
    loadingRoot.value = false
  }
}

watch(
  () => [open.value, props.commentId] as const,
  ([isOpen, id]) => {
    if (isOpen && id !== null) loadThread()
  },
  { immediate: true }
)

// Después de moderar, se refresca solo el comentario afectado.
async function onModerated(comment: AdminComment): Promise<void> {
  try {
    const updated = await $fetch<AdminComment>(`/api/comments/${comment.id}`)
    if (root.value?.id === updated.id) {
      root.value = updated
    } else {
      replies.value = replies.value.map(reply => reply.id === updated.id ? updated : reply)
    }
  } catch {
    await loadThread()
  }
  emit('changed')
}

const { confirmOpen, processing, confirmConfig, actionsFor, confirm } = useCommentModeration(onModerated)

const repliesSummary = computed(() => {
  const total = repliesTotal.value
  if (total === 0) return 'Sin respuestas'
  return `${total} ${total === 1 ? 'respuesta' : 'respuestas'}`
})
</script>

<template>
  <USlideover
    v-model:open="open"
    title="Hilo de conversación"
    :description="description"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <div
        v-if="loadingRoot && !root"
        class="space-y-3"
      >
        <USkeleton class="h-28 w-full" />
        <USkeleton class="h-20 w-full" />
        <USkeleton class="h-20 w-full" />
      </div>

      <UAlert
        v-else-if="loadError"
        icon="i-lucide-circle-alert"
        color="error"
        variant="subtle"
        title="No se pudo cargar el hilo"
        :description="loadError"
      />

      <div
        v-else-if="root"
        class="space-y-4"
      >
        <UAlert
          v-if="root.parentCommentId !== null"
          icon="i-lucide-info"
          color="info"
          variant="subtle"
          description="Este comentario es una respuesta: se muestra sin su hilo."
        />

        <AdminCommentItem
          :id="`comentario-${root.id}`"
          :comment="root"
          :actions="actionsFor(root)"
          :highlighted="highlightReplyId === root.id"
        />

        <div class="flex items-center gap-2 text-sm text-muted">
          <UIcon
            name="i-lucide-messages-square"
            class="size-4"
          />
          <span>{{ repliesSummary }}</span>
        </div>

        <ol
          v-if="replies.length > 0"
          class="space-y-3 border-l-2 border-default pl-4"
        >
          <li
            v-for="reply in replies"
            :id="`comentario-${reply.id}`"
            :key="reply.id"
          >
            <AdminCommentItem
              :comment="reply"
              :actions="actionsFor(reply)"
              :highlighted="highlightReplyId === reply.id"
            />
          </li>
        </ol>

        <div
          v-if="hasMoreReplies"
          class="flex justify-center"
        >
          <UButton
            :label="`Cargar más respuestas (${repliesTotal - replies.length} restantes)`"
            icon="i-lucide-chevrons-down"
            color="neutral"
            variant="outline"
            :loading="loadingReplies"
            @click="fetchRepliesPage(repliesPage + 1)"
          />
        </div>
      </div>

      <ConfirmModal
        v-model:open="confirmOpen"
        :title="confirmConfig.title"
        :description="confirmConfig.description"
        :confirm-label="confirmConfig.confirmLabel"
        :confirm-color="confirmConfig.confirmColor"
        :loading="processing"
        @confirm="confirm"
      />
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap justify-between gap-3">
        <div class="flex flex-wrap gap-1">
          <UButton
            v-if="showPanelLink && panelLink"
            :to="panelLink"
            label="Abrir en el panel de la consulta"
            icon="i-lucide-panel-right-open"
            color="neutral"
            variant="ghost"
          />
          <UButton
            :to="publicUrl"
            target="_blank"
            label="Ver en la página pública"
            icon="i-lucide-external-link"
            color="neutral"
            variant="ghost"
          />
        </div>
        <UButton
          label="Cerrar"
          color="neutral"
          variant="outline"
          @click="open = false"
        />
      </div>
    </template>
  </USlideover>
</template>
