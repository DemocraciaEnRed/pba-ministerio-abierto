<script setup lang="ts">
import type { TimelineItem } from '@nuxt/ui'
import type { AdminComment, AdminCommentsResponse } from '~/types/consulta'

const props = defineProps<{
  consultationId: string
  consultationTitle?: string
}>()

const RECENT_LIMIT = 5

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para obtener la
// vista de gestión (incluye ocultos y borrados).
const requestFetch = useRequestFetch()
const { data, status, refresh } = await useAsyncData(
  () => `consultation-recent-comments-${props.consultationId}`,
  () => requestFetch<AdminCommentsResponse>(`/api/consultations/${props.consultationId}/comments`, {
    query: { level: 'all', order: 'recent', perPage: RECENT_LIMIT }
  }),
  { watch: [() => props.consultationId] }
)

type FeedItem = TimelineItem & { comment: AdminComment }

const items = computed<FeedItem[]>(() => (data.value?.items ?? []).map(comment => ({
  value: comment.id,
  avatar: {
    src: comment.authorAvatarUrl ?? undefined,
    text: commentAuthorInitials(comment.authorLabel)
  },
  comment
})))

function excerptOf(comment: AdminComment): string {
  if (comment.moderationStatus === 'deleted') return 'Comentario borrado.'
  return comment.body.replace(/\s+/g, ' ').trim()
}

const threadOpen = ref(false)
const threadComment = ref<AdminComment | null>(null)

function openThread(comment: AdminComment): void {
  threadComment.value = comment
  threadOpen.value = true
}
</script>

<template>
  <section class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="space-y-0.5">
        <h2 class="text-sm font-medium text-muted">
          Comentarios recientes
        </h2>
        <p class="text-xs text-muted">
          Últimos comentarios y respuestas en la consulta y sus temas.
        </p>
      </div>
      <UButton
        :to="consultationPanelPath(consultationId, 'comentarios')"
        label="Ver todos"
        trailing-icon="i-lucide-arrow-right"
        color="neutral"
        variant="ghost"
        size="sm"
      />
    </div>

    <UPageCard>
      <div
        v-if="status === 'pending' && items.length === 0"
        class="space-y-3"
      >
        <USkeleton
          v-for="n in 3"
          :key="n"
          class="h-12 w-full"
        />
      </div>

      <UEmpty
        v-else-if="items.length === 0"
        icon="i-lucide-message-square-off"
        title="Sin comentarios"
        description="Todavía no hay comentarios en esta consulta."
      />

      <UTimeline
        v-else
        :items="items"
        color="neutral"
        size="xs"
        :ui="{ description: 'mt-1' }"
      >
        <template #date="{ item }">
          <UTooltip :text="formatDate(item.comment.createdAt)">
            <span>{{ fromNow(item.comment.createdAt) }}</span>
          </UTooltip>
        </template>

        <template #title="{ item }">
          <div class="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span class="font-medium text-highlighted">{{ item.comment.authorLabel || 'Sin nombre' }}</span>
            <span class="font-normal text-muted">{{ item.comment.parentCommentId ? 'respondió en' : 'comentó en' }}</span>
            <button
              type="button"
              class="text-left text-primary hover:underline"
              @click="openThread(item.comment)"
            >
              <template v-if="item.comment.containerType === 'topic'">
                Tema › {{ item.comment.topicTitle ?? 'Tema' }}
              </template>
              <template v-else>
                la consulta
              </template>
            </button>
            <UBadge
              v-if="item.comment.moderationStatus !== 'visible'"
              :label="commentStatusBadge(item.comment.moderationStatus).label"
              :color="commentStatusBadge(item.comment.moderationStatus).color"
              variant="subtle"
              size="sm"
            />
          </div>
        </template>

        <template #description="{ item }">
          <p
            class="line-clamp-2 cursor-pointer hover:text-default"
            :class="{ italic: item.comment.moderationStatus === 'deleted' }"
            @click="openThread(item.comment)"
          >
            {{ excerptOf(item.comment) }}
          </p>
        </template>
      </UTimeline>
    </UPageCard>

    <AdminCommentThreadSlideover
      v-model:open="threadOpen"
      :comment-id="threadComment ? (threadComment.parentCommentId ?? threadComment.id) : null"
      :consultation-id="Number(consultationId)"
      :consultation-title="consultationTitle"
      :highlight-reply-id="threadComment?.parentCommentId ? threadComment.id : null"
      @changed="refresh()"
    />
  </section>
</template>
