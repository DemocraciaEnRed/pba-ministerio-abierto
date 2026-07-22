<script setup lang="ts">
import type { CommentOrder, CommentRepliesResponse, PublicComment } from '~/types/consulta'

const props = withDefaults(
  defineProps<{
    comment: PublicComment
    /** Endpoint de creación de comentarios del contenedor (consulta o tema). */
    basePath: string
    /** Ventana de participación abierta. */
    commentingOpen?: boolean
    /** Habilita el toggle "comentar como institución" en el formulario. */
    canManage?: boolean
    /** Orden del hilo de respuestas. */
    order?: CommentOrder
    /** Variante compacta para respuestas anidadas (sin responder ni sub-hilo). */
    reply?: boolean
  }>(),
  {
    commentingOpen: false,
    canManage: false,
    order: 'recent',
    reply: false
  }
)

const { loggedIn } = useUserSession()
const toast = useToast()

const REPLIES_PER_PAGE = 5

const isInstitution = computed(() => props.comment.authorMode === 'institution')
const authorLabel = computed(() => props.comment.authorLabel || 'Participante')

/** Iniciales para el avatar cuando hay nombre disponible. */
const initials = computed(() => {
  const label = props.comment.authorLabel?.trim()
  if (!label) return undefined
  return label
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
})

const canReply = computed(() => !props.reply && loggedIn.value && props.commentingOpen)

// Hilo de respuestas: se cargan bajo demanda y paginadas (5 por página).
const replies = ref<PublicComment[]>([])
const repliesTotal = ref(props.comment.replyCount ?? 0)
const nextPage = ref(1)
const expanded = ref(false)
const loadingReplies = ref(false)
const showReplyForm = ref(false)

const hasReplies = computed(() => repliesTotal.value > 0)
const hasMore = computed(() => replies.value.length < repliesTotal.value)

const repliesToggleLabel = computed(() => {
  if (expanded.value) return 'Ocultar respuestas'
  return repliesTotal.value === 1 ? 'Ver 1 respuesta' : `Ver ${repliesTotal.value} respuestas`
})

function sortReplies(): void {
  replies.value.sort((a, b) => props.order === 'recent'
    ? b.createdAt.localeCompare(a.createdAt)
    : a.createdAt.localeCompare(b.createdAt))
}

async function loadMore(): Promise<void> {
  if (loadingReplies.value) return
  loadingReplies.value = true
  try {
    const res = await $fetch<CommentRepliesResponse>(
      `/api/comments/${props.comment.id}/replies`,
      { query: { page: nextPage.value, perPage: REPLIES_PER_PAGE, order: props.order } }
    )
    const existing = new Set(replies.value.map(item => item.id))
    replies.value.push(...res.items.filter(item => !existing.has(item.id)))
    sortReplies()
    repliesTotal.value = res.pagination.total
    nextPage.value += 1
  } catch {
    toast.add({ title: 'No se pudieron cargar las respuestas', color: 'error' })
  } finally {
    loadingReplies.value = false
  }
}

async function toggleReplies(): Promise<void> {
  if (!expanded.value && replies.value.length === 0 && repliesTotal.value > 0) {
    await loadMore()
  }
  expanded.value = !expanded.value
}

// Al cambiar el orden, se descarta lo cargado y se recarga desde la primera página.
watch(() => props.order, () => {
  replies.value = []
  nextPage.value = 1
  if (expanded.value) {
    loadMore()
  }
})

function onReplyCreated(created: PublicComment): void {
  showReplyForm.value = false
  if (!replies.value.some(item => item.id === created.id)) {
    replies.value.push(created)
    sortReplies()
  }
  repliesTotal.value += 1
  expanded.value = true
}
</script>

<template>
  <div>
    <article
      class="flex gap-3"
      :class="reply ? 'py-2' : 'py-3'"
    >
      <UAvatar
        :src="!isInstitution ? (comment.authorAvatarUrl ?? undefined) : undefined"
        :text="initials"
        :icon="isInstitution ? 'i-lucide-landmark' : undefined"
        :size="reply ? 'sm' : 'lg'"
        :ui="{ root: isInstitution ? 'bg-primary/10 text-primary' : undefined }"
      />

      <div class="flex-1 space-y-1.5">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span class="text-sm font-semibold text-highlighted">
            {{ authorLabel }}
          </span>
          <UBadge
            v-if="isInstitution"
            label="Institución"
            color="primary"
            variant="subtle"
            size="sm"
          />
          <span class="text-xs text-muted">
            <NuxtTime
              :datetime="comment.createdAt"
              relative
              locale="es-AR"
            />
          </span>
        </div>

        <p class="text-sm text-default whitespace-pre-line">
          {{ comment.body }}
        </p>

        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <ConsultasComentarioReacciones
            :comment-id="comment.id"
            :reactions="comment.reactions"
          />
          <UButton
            v-if="canReply"
            :label="showReplyForm ? 'Cancelar' : 'Responder'"
            :icon="showReplyForm ? 'i-lucide-x' : 'i-lucide-reply'"
            color="neutral"
            variant="link"
            size="xs"
            @click="showReplyForm = !showReplyForm"
          />
        </div>

        <ConsultasComentarioForm
          v-if="canReply && showReplyForm"
          :base-path="basePath"
          :parent-comment-id="comment.id"
          :commenting-open="commentingOpen"
          :can-manage="canManage"
          compact
          cancelable
          class="pt-1"
          @created="onReplyCreated"
          @cancel="showReplyForm = false"
        />

        <div
          v-if="!reply && hasReplies"
          class="pt-1"
        >
          <UButton
            :label="repliesToggleLabel"
            icon="i-lucide-corner-down-right"
            color="neutral"
            variant="link"
            size="xs"
            trailing-icon="i-lucide-chevron-down"
            class="group"
            :ui="{ trailingIcon: expanded ? 'rotate-180 transition-transform' : 'transition-transform' }"
            :loading="loadingReplies && !expanded"
            @click="toggleReplies"
          />

          <div
            v-if="expanded"
            class="mt-1 space-y-1 border-l border-default pl-4"
          >
            <ConsultasComentarioItem
              v-for="child in replies"
              :key="child.id"
              :comment="child"
              :base-path="basePath"
              :order="order"
              reply
            />

            <UButton
              v-if="hasMore"
              label="Cargar más respuestas"
              icon="i-lucide-plus"
              color="neutral"
              variant="link"
              size="xs"
              :loading="loadingReplies"
              @click="loadMore"
            />
          </div>
        </div>
      </div>
    </article>
  </div>
</template>
