<script setup lang="ts">
import type { TimelineItem } from '@nuxt/ui'
import type { AdminCommentLogEntry, AdminCommentLogResponse } from '~/types/consulta'

const RECENT_LIMIT = 5

// `useRequestFetch` reenvía la cookie de sesión durante el SSR: el endpoint es
// solo para administradores de plataforma.
const requestFetch = useRequestFetch()
const { data, status, refresh } = await useAsyncData(
  'admin-recent-comments',
  () => requestFetch<AdminCommentLogResponse>('/api/admin/comments', {
    query: { perPage: RECENT_LIMIT }
  })
)

type FeedItem = TimelineItem & { entry: AdminCommentLogEntry }

const items = computed<FeedItem[]>(() => (data.value?.items ?? []).map(entry => ({
  value: entry.id,
  avatar: {
    src: entry.authorAvatarUrl ?? undefined,
    text: commentAuthorInitials(entry.authorLabel)
  },
  entry
})))

const threadOpen = ref(false)
const threadEntry = ref<AdminCommentLogEntry | null>(null)

function openThread(entry: AdminCommentLogEntry): void {
  threadEntry.value = entry
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
          Quién comentó y dónde, en toda la plataforma.
        </p>
      </div>
      <UButton
        to="/admin/comentarios"
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
        description="Todavía no hay comentarios en la plataforma."
      />

      <UTimeline
        v-else
        :items="items"
        color="neutral"
        size="xs"
        :ui="{ description: 'mt-1' }"
      >
        <template #date="{ item }">
          <UTooltip :text="formatDate(item.entry.createdAt)">
            <span>{{ fromNow(item.entry.createdAt) }}</span>
          </UTooltip>
        </template>

        <template #title="{ item }">
          <div class="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span class="font-medium text-highlighted">{{ item.entry.authorLabel || 'Sin nombre' }}</span>
            <span class="font-normal text-muted">{{ item.entry.isReply ? 'respondió en' : 'comentó en' }}</span>
            <button
              type="button"
              class="text-left text-primary hover:underline"
              :aria-label="`Ver hilo en ${item.entry.consultation.title}`"
              @click="openThread(item.entry)"
            >
              {{ item.entry.consultation.title }}<template v-if="item.entry.topic">
                › {{ item.entry.topic.title }}
              </template>
            </button>
            <UBadge
              v-if="item.entry.moderationStatus !== 'visible'"
              :label="commentStatusBadge(item.entry.moderationStatus).label"
              :color="commentStatusBadge(item.entry.moderationStatus).color"
              variant="subtle"
              size="sm"
            />
          </div>
        </template>

        <template #description="{ item }">
          <p
            class="line-clamp-2 cursor-pointer hover:text-default"
            @click="openThread(item.entry)"
          >
            {{ item.entry.excerpt }}
          </p>
        </template>
      </UTimeline>
    </UPageCard>

    <AdminCommentThreadSlideover
      v-model:open="threadOpen"
      :comment-id="threadEntry?.rootCommentId ?? null"
      :consultation-id="threadEntry?.consultation.id ?? 0"
      :consultation-title="threadEntry?.consultation.title"
      :highlight-reply-id="threadEntry?.isReply ? threadEntry.id : null"
      show-panel-link
      @changed="refresh()"
    />
  </section>
</template>
