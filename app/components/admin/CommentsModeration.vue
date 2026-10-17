<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type {
  AdminComment,
  AdminCommentsResponse,
  CommentModerationOrder,
  CommentModerationStatus,
  CommentReplyCounts
} from '~/types/consulta'

const props = defineProps<{
  /** Id de la consulta a la que pertenece la bandeja. */
  consultationId: string
  /** Slug (o id) del tema. Si se pasa, la bandeja se acota a ese tema. */
  topicSlug?: string
}>()

const route = useRoute()
const router = useRouter()

const endpoint = computed(() =>
  props.topicSlug
    ? `/api/consultations/${props.consultationId}/topics/${props.topicSlug}/comments`
    : `/api/consultations/${props.consultationId}/comments`
)

type StatusFilter = 'all' | CommentModerationStatus

const SEARCH_DEBOUNCE_MS = 350

const filters = reactive({
  q: '',
  moderationStatus: 'all' as StatusFilter,
  from: '',
  to: '',
  unanswered: false,
  withAttachment: false,
  order: 'recent' as CommentModerationOrder,
  page: 1,
  perPage: 20
})

// El texto de búsqueda se escribe en `searchInput` y se aplica con demora para
// no disparar una consulta por cada tecla.
const searchInput = ref('')
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(searchInput, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    filters.q = value.trim()
  }, SEARCH_DEBOUNCE_MS)
})
onBeforeUnmount(() => clearTimeout(searchTimer))

const statusOptions = [
  { label: 'Todos los estados', value: 'all' },
  { label: 'Visibles', value: 'visible' },
  { label: 'Ocultos', value: 'hidden' },
  { label: 'Borrados', value: 'deleted' }
] satisfies { label: string, value: StatusFilter }[]

const orderOptions = [
  { label: 'Más recientes', value: 'recent' },
  { label: 'Más antiguos', value: 'oldest' },
  { label: 'Más respondidos', value: 'mostReplied' }
] satisfies { label: string, value: CommentModerationOrder }[]

const hasActiveFilters = computed(() =>
  Boolean(filters.q)
  || filters.moderationStatus !== 'all'
  || Boolean(filters.from)
  || Boolean(filters.to)
  || filters.unanswered
  || filters.withAttachment
  || filters.order !== 'recent'
)

function clearFilters(): void {
  clearTimeout(searchTimer)
  searchInput.value = ''
  Object.assign(filters, {
    q: '',
    moderationStatus: 'all',
    from: '',
    to: '',
    unanswered: false,
    withAttachment: false,
    order: 'recent',
    page: 1
  })
}

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin (estado de moderación) del usuario logueado.
const requestFetch = useRequestFetch()
// Las acciones de recarga se muestran en el encabezado de la página.
// Se exponen antes del `await` (requisito de Vue) con getters que leen el estado ya inicializado.
defineExpose({
  refresh: () => refresh(),
  get status() { return status.value }
})

const { data, status, refresh } = await useAsyncData(
  () => `admin-comments-${props.consultationId}-${props.topicSlug ?? 'all'}`,
  () => requestFetch<AdminCommentsResponse>(endpoint.value, {
    query: {
      level: 'top',
      page: filters.page,
      perPage: filters.perPage,
      order: filters.order,
      q: filters.q || undefined,
      moderationStatus: filters.moderationStatus === 'all' ? undefined : filters.moderationStatus,
      from: filters.from || undefined,
      to: filters.to || undefined,
      unanswered: filters.unanswered ? 'true' : undefined,
      withAttachment: filters.withAttachment ? 'true' : undefined
    }
  }),
  {
    watch: [
      () => props.consultationId,
      () => props.topicSlug,
      () => filters.page,
      () => filters.q,
      () => filters.moderationStatus,
      () => filters.from,
      () => filters.to,
      () => filters.unanswered,
      () => filters.withAttachment,
      () => filters.order
    ]
  }
)

const comments = computed(() => data.value?.items ?? [])
const pagination = computed(() => data.value?.pagination)

// Al cambiar cualquier filtro volvemos a la primera página.
watch(
  () => [
    filters.q,
    filters.moderationStatus,
    filters.from,
    filters.to,
    filters.unanswered,
    filters.withAttachment,
    filters.order
  ],
  () => {
    filters.page = 1
  }
)

/**
 * URL pública del contenedor del comentario (consulta o tema), para abrirla
 * en una nueva pestaña. En la bandeja del tema el `topicSlug` del DTO viene
 * nulo, así que se cae al `topicSlug` que recibe el componente por prop.
 */
function publicUrl(comment: AdminComment): string {
  // El enlace corto redirige a la URL canónica de la consulta.
  if (comment.containerType === 'topic') {
    const topicSlug = comment.topicSlug ?? props.topicSlug
    return consultationPermalinkPath(props.consultationId, `temas/${topicSlug}`)
  }
  return consultationPermalinkPath(props.consultationId)
}

function repliesLabel(counts: CommentReplyCounts | undefined): string {
  const total = counts?.total ?? 0
  if (total === 0) return 'Sin respuestas'
  return `${total} ${total === 1 ? 'respuesta' : 'respuestas'}`
}

function moderatedRepliesHint(counts: CommentReplyCounts | undefined): string | null {
  if (!counts || counts.hidden + counts.deleted === 0) return null
  const parts: string[] = []
  if (counts.hidden > 0) parts.push(`${counts.hidden} ${counts.hidden === 1 ? 'oculta' : 'ocultas'}`)
  if (counts.deleted > 0) parts.push(`${counts.deleted} ${counts.deleted === 1 ? 'borrada' : 'borradas'}`)
  return parts.join(' · ')
}

// --- Panel lateral del hilo (sincronizado con `?hilo=<id>&respuesta=<id>`) ---

function parseQueryId(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return null
  const id = Number(raw)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

const threadId = computed(() => parseQueryId(route.query.hilo))
const highlightReplyId = computed(() => parseQueryId(route.query.respuesta))

const threadOpen = computed({
  get: () => threadId.value !== null,
  set: (value: boolean) => {
    if (!value) {
      const { hilo: _hilo, respuesta: _respuesta, ...rest } = route.query
      router.replace({ query: rest })
    }
  }
})

function openThread(comment: AdminComment): void {
  const { respuesta: _respuesta, ...rest } = route.query
  router.replace({ query: { ...rest, hilo: String(comment.id) } })
}

// --- Acciones de moderación sobre la raíz del hilo ---

const { confirmOpen, processing, confirmConfig, actionsFor, confirm } = useCommentModeration(() => refresh())

function excerptOf(comment: AdminComment): string {
  if (comment.moderationStatus === 'deleted') return 'Comentario borrado.'
  return comment.body.replace(/\s+/g, ' ').trim()
}

function menuItems(comment: AdminComment): DropdownMenuItem[][] {
  const links: DropdownMenuItem[] = [
    {
      label: comment.containerType === 'topic' ? 'Ver el tema en la página pública' : 'Ver en la página pública',
      icon: 'i-lucide-external-link',
      to: publicUrl(comment),
      target: '_blank'
    }
  ]
  if (comment.attachment) {
    links.push({
      label: `Descargar adjunto (${comment.attachment.filename})`,
      icon: 'i-lucide-paperclip',
      to: comment.attachment.downloadUrl,
      external: true,
      download: true
    })
  }
  const moderation = actionsFor(comment)
  return moderation.length > 0 ? [links, moderation] : [links]
}
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-3">
      <div class="flex flex-wrap items-end gap-3">
        <UInput
          v-model="searchInput"
          icon="i-lucide-search"
          placeholder="Buscar por texto, nombre o correo"
          aria-label="Buscar comentarios"
          class="w-full sm:w-72"
        />
        <USelect
          v-model="filters.moderationStatus"
          :items="statusOptions"
          value-key="value"
          aria-label="Estado de moderación"
          class="w-full sm:w-48"
        />
        <USelect
          v-model="filters.order"
          :items="orderOptions"
          value-key="value"
          aria-label="Orden"
          class="w-full sm:w-44"
        />
        <DateRangeField
          v-model:from="filters.from"
          v-model:to="filters.to"
          aria-label="Rango de fechas"
          class="w-full sm:w-auto"
        />
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-4">
          <USwitch
            v-model="filters.unanswered"
            label="Sin respuesta institucional"
          />
          <USwitch
            v-model="filters.withAttachment"
            label="Con adjunto"
          />
        </div>
        <div class="flex items-center gap-1">
          <UButton
            v-if="hasActiveFilters || searchInput"
            label="Limpiar filtros"
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            @click="clearFilters"
          />
        </div>
      </div>
    </div>

    <UPageCard :ui="{ container: 'p-0 sm:p-0' }">
      <div
        v-if="status === 'pending' && comments.length === 0"
        class="space-y-3 p-4"
      >
        <USkeleton
          v-for="n in 4"
          :key="n"
          class="h-20 w-full"
        />
      </div>

      <UEmpty
        v-else-if="comments.length === 0"
        icon="i-lucide-message-square-off"
        title="No hay comentarios"
        :description="hasActiveFilters ? 'Ningún hilo coincide con los filtros seleccionados.' : 'Todavía no hay comentarios.'"
        class="py-10"
      />

      <ul
        v-else
        class="divide-y divide-default"
      >
        <AdminCommentFeedRow
          v-for="comment in comments"
          :key="comment.id"
          :author-user-id="comment.authorUserId"
          :author-label="comment.authorLabel"
          :author-email="comment.authorEmail"
          :author-avatar-url="comment.authorAvatarUrl"
          :author-mode="comment.authorMode"
          verb="comentó en"
          :created-at="comment.createdAt"
          :excerpt="excerptOf(comment)"
          :excerpt-muted="comment.moderationStatus === 'deleted'"
          :active="threadId === comment.id"
          @open="openThread(comment)"
        >
          <template #context>
            <template v-if="comment.containerType === 'topic'">
              <span class="font-normal text-muted">Tema › </span>{{ comment.topicTitle ?? 'Tema' }}
            </template>
            <template v-else>
              la consulta
            </template>
          </template>

          <template #badges>
            <UBadge
              v-if="comment.moderationStatus !== 'visible'"
              :label="commentStatusBadge(comment.moderationStatus).label"
              :color="commentStatusBadge(comment.moderationStatus).color"
              icon="i-lucide-shield"
              variant="subtle"
              size="sm"
            />
            <UBadge
              v-if="comment.attachment"
              label="Adjunto"
              icon="i-lucide-paperclip"
              color="neutral"
              variant="soft"
              size="sm"
            />
            <UTooltip
              v-for="reaction in activeCommentReactions(comment.reactions.counts)"
              :key="reaction.type"
              arrow
              :text="COMMENT_REACTION_META[reaction.type].label"
            >
              <UBadge
                :label="String(reaction.count)"
                :icon="COMMENT_REACTION_META[reaction.type].icon"
                color="neutral"
                variant="soft"
                size="sm"
              />
            </UTooltip>
            <UBadge
              v-if="moderatedRepliesHint(comment.replyCounts)"
              :label="moderatedRepliesHint(comment.replyCounts)!"
              icon="i-lucide-eye-off"
              color="warning"
              variant="soft"
              size="sm"
            />
          </template>

          <template #actions>
            <UButton
              :label="repliesLabel(comment.replyCounts)"
              icon="i-lucide-messages-square"
              color="neutral"
              variant="outline"
              size="xs"
              @click="openThread(comment)"
            />
            <UDropdownMenu
              :items="menuItems(comment)"
              :content="{ align: 'end' }"
            >
              <UButton
                icon="i-lucide-ellipsis-vertical"
                color="neutral"
                variant="ghost"
                size="xs"
                aria-label="Más acciones"
              />
            </UDropdownMenu>
          </template>
        </AdminCommentFeedRow>
      </ul>
    </UPageCard>

    <div
      v-if="pagination && pagination.total > 0"
      class="flex flex-wrap items-center justify-between gap-3"
    >
      <p class="text-xs text-muted">
        {{ pagination.total }} {{ pagination.total === 1 ? 'hilo' : 'hilos' }}
      </p>
      <UPagination
        v-model:page="filters.page"
        :items-per-page="pagination.perPage"
        :total="pagination.total"
      />
    </div>

    <AdminCommentThreadSlideover
      v-model:open="threadOpen"
      :comment-id="threadId"
      :consultation-id="Number(consultationId)"
      :highlight-reply-id="highlightReplyId"
      @changed="refresh()"
    />

    <ConfirmModal
      v-model:open="confirmOpen"
      :title="confirmConfig.title"
      :description="confirmConfig.description"
      :confirm-label="confirmConfig.confirmLabel"
      :confirm-color="confirmConfig.confirmColor"
      :loading="processing"
      @confirm="confirm"
    />
  </div>
</template>
