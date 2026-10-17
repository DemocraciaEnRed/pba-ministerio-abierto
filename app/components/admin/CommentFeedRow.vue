<script setup lang="ts">
import type { CommentAuthorMode } from '~/types/consulta'

const props = defineProps<{
  authorUserId: number | null
  authorLabel: string | null
  authorEmail?: string | null
  authorAvatarUrl?: string | null
  authorMode?: CommentAuthorMode | null
  verb: string
  createdAt: string
  excerpt: string
  excerptMuted?: boolean
  active?: boolean
}>()

const emit = defineEmits<{
  open: []
}>()

// Toda la fila abre el hilo, salvo los clics sobre sus enlaces, botones y menús.
function onClick(event: MouseEvent): void {
  const target = event.target as HTMLElement | null
  if (target?.closest('a, button, [role="menuitem"]')) return
  emit('open')
}

function onKeydown(event: KeyboardEvent): void {
  if (event.target !== event.currentTarget) return
  event.preventDefault()
  emit('open')
}

const NuxtLink = resolveComponent('NuxtLink')
const profileLink = computed(() => props.authorUserId ? `/u/${props.authorUserId}` : undefined)
</script>

<template>
  <li
    class="flex cursor-pointer gap-3 px-4 py-4 transition-colors hover:bg-elevated/50 focus-visible:bg-elevated/50 focus-visible:outline-none sm:px-5"
    :class="{ 'bg-elevated/60': active }"
    tabindex="0"
    @click="onClick"
    @keydown.enter="onKeydown"
  >
    <component
      :is="profileLink ? NuxtLink : 'span'"
      :to="profileLink"
      class="h-fit shrink-0 rounded-full transition"
      :class="{ 'hover:ring-2 hover:ring-primary': profileLink }"
      :aria-label="profileLink ? `Ver perfil de ${authorLabel || 'usuario'}` : undefined"
    >
      <UAvatar
        :src="authorAvatarUrl ?? undefined"
        :text="commentAuthorInitials(authorLabel)"
        size="md"
      />
    </component>

    <div class="min-w-0 flex-1 space-y-1.5">
      <div class="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm">
        <UTooltip
          :text="authorEmail ?? undefined"
          :disabled="!authorEmail"
        >
          <span class="font-medium text-highlighted">
            {{ authorLabel || 'Sin nombre' }}
          </span>
        </UTooltip>
        <UBadge
          v-if="authorMode === 'institution'"
          label="Institución"
          icon="i-lucide-building-2"
          color="primary"
          variant="subtle"
          size="sm"
          class="self-center"
        />
        <span class="text-muted">{{ verb }}</span>
        <span class="font-medium text-highlighted">
          <slot name="context" />
        </span>
        <span class="text-muted">·</span>
        <UTooltip :text="formatDate(createdAt)">
          <span class="text-xs text-muted">{{ fromNow(createdAt) }}</span>
        </UTooltip>
      </div>

      <p
        class="line-clamp-2 text-sm"
        :class="excerptMuted ? 'italic text-muted' : 'text-default'"
      >
        {{ excerpt }}
      </p>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-1.5">
          <slot name="badges" />
        </div>

        <div class="ms-auto flex items-center gap-1">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </li>
</template>
