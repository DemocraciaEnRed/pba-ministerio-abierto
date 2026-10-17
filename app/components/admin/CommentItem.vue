<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { AdminComment } from '~/types/consulta'

const props = defineProps<{
  comment: AdminComment
  /** Acciones de moderación del comentario (vacío si no admite ninguna). */
  actions: DropdownMenuItem[]
  /** Resalta el comentario (por ejemplo, la respuesta a la que se llegó por enlace). */
  highlighted?: boolean
}>()

const status = computed(() => commentStatusBadge(props.comment.moderationStatus))
const reactions = computed(() => activeCommentReactions(props.comment.reactions.counts))
</script>

<template>
  <article
    class="space-y-2 rounded-lg border p-3 transition"
    :class="[
      highlighted ? 'border-primary ring-2 ring-primary/40' : 'border-default',
      comment.moderationStatus === 'visible' ? '' : 'bg-elevated/50'
    ]"
  >
    <header class="flex items-start gap-3">
      <UTooltip text="Ver perfil">
        <NuxtLink
          :to="`/u/${comment.authorUserId}`"
          class="shrink-0 rounded-full transition hover:ring-2 hover:ring-primary"
          :aria-label="`Ver perfil de ${comment.authorLabel || 'usuario'}`"
        >
          <UAvatar
            :src="comment.authorAvatarUrl ?? undefined"
            :text="commentAuthorInitials(comment.authorLabel)"
            size="sm"
          />
        </NuxtLink>
      </UTooltip>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
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
          <UBadge
            :label="status.label"
            :color="status.color"
            variant="subtle"
            size="sm"
          />
        </div>
        <p class="truncate text-xs text-muted">
          {{ comment.authorEmail }} ·
          <UTooltip :text="formatDate(comment.createdAt)">
            <span>{{ fromNow(comment.createdAt) }}</span>
          </UTooltip>
        </p>
      </div>

      <div class="flex shrink-0 gap-1">
        <UTooltip
          v-if="comment.attachment"
          arrow
          :text="`Descargar adjunto (${comment.attachment.filename})`"
        >
          <UButton
            :to="comment.attachment.downloadUrl"
            external
            download
            icon="i-lucide-paperclip"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Descargar adjunto"
          />
        </UTooltip>
        <UDropdownMenu
          v-if="actions.length > 0"
          :items="actions"
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
    </header>

    <p class="whitespace-pre-wrap text-sm">
      {{ comment.body }}
    </p>

    <div
      v-if="reactions.length > 0"
      class="flex flex-wrap items-center gap-1.5"
    >
      <UTooltip
        v-for="reaction in reactions"
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
    </div>
  </article>
</template>
