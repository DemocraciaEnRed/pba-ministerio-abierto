<script setup lang="ts">
import type { CommentReactionsSummary, CommentReactionType, PublicComment } from '~/types/consulta'

const props = withDefaults(
  defineProps<{
    /** Id del comentario sobre el que se reacciona. */
    commentId: number
    reactions: CommentReactionsSummary
    size?: 'xs' | 'sm'
  }>(),
  {
    size: 'xs'
  }
)

const { loggedIn } = useUserSession()
const toast = useToast()

/** Metadatos de presentación de cada tipo de reacción. */
const REACTION_META: Record<CommentReactionType, { label: string, icon: string }> = {
  heart: { label: 'Me gusta', icon: 'i-lucide-heart' },
  agree: { label: 'De acuerdo', icon: 'i-lucide-thumbs-up' },
  idea: { label: 'Idea', icon: 'i-lucide-lightbulb' },
  relevant: { label: 'Relevante', icon: 'i-lucide-star' },
  deepen: { label: 'Profundizar', icon: 'i-lucide-layers' }
}

const REACTION_ORDER: CommentReactionType[] = ['heart', 'agree', 'idea', 'relevant', 'deepen']

// Estado local para permitir la actualización optimista. Se sincroniza si el
// comentario se recarga desde el servidor.
const counts = reactive<Record<CommentReactionType, number>>({ ...props.reactions.counts })
const mine = ref<Set<CommentReactionType>>(new Set(props.reactions.mine))
const pending = ref<Set<CommentReactionType>>(new Set())

watch(
  () => props.reactions,
  (next) => {
    for (const type of REACTION_ORDER) {
      counts[type] = next.counts[type] ?? 0
    }
    mine.value = new Set(next.mine)
  }
)

const items = computed(() =>
  REACTION_ORDER
    .map(type => ({
      type,
      count: counts[type] ?? 0,
      mine: mine.value.has(type),
      pending: pending.value.has(type),
      ...REACTION_META[type]
    }))
    // Sin sesión el bloque es de solo lectura: mostramos solo las que tienen conteo.
    .filter(item => loggedIn.value || item.count > 0)
)

/** Fija el estado local de una reacción (marcada o no) y ajusta el conteo. */
function applyLocal(type: CommentReactionType, active: boolean): void {
  const currentlyMine = mine.value.has(type)
  if (active === currentlyMine) {
    return
  }
  const next = new Set(mine.value)
  if (active) {
    next.add(type)
    counts[type] = (counts[type] ?? 0) + 1
  } else {
    next.delete(type)
    counts[type] = Math.max(0, (counts[type] ?? 0) - 1)
  }
  mine.value = next
}

async function toggle(type: CommentReactionType): Promise<void> {
  if (!loggedIn.value || pending.value.has(type)) {
    return
  }

  const wasMine = mine.value.has(type)

  // Actualización optimista.
  applyLocal(type, !wasMine)
  pending.value = new Set(pending.value).add(type)

  try {
    if (wasMine) {
      await $fetch(`/api/comments/${props.commentId}/reactions`, {
        method: 'DELETE',
        body: { reactionType: type }
      })
    } else {
      const updated = await $fetch<PublicComment>(`/api/comments/${props.commentId}/reactions`, {
        method: 'POST',
        body: { reactionType: type }
      })
      // Sincronizamos con el resumen fresco del servidor.
      for (const t of REACTION_ORDER) {
        counts[t] = updated.reactions.counts[t] ?? 0
      }
      mine.value = new Set(updated.reactions.mine)
    }
  } catch {
    // Revertimos el optimismo ante un error.
    applyLocal(type, wasMine)
    toast.add({ title: 'No se pudo registrar tu reacción', color: 'error' })
  } finally {
    const next = new Set(pending.value)
    next.delete(type)
    pending.value = next
  }
}
</script>

<template>
  <UFieldGroup
    v-if="items.length"
  >
    <UTooltip
      v-for="item in items"
      :key="item.type"
      :text="loggedIn ? item.label : `${item.label} (iniciá sesión para reaccionar)`"
    >
      <UButton
        :icon="item.icon"
        :label="String(item.count)"
        :color="item.mine ? 'primary' : 'neutral'"
        :variant="item.mine ? 'subtle' : 'outline'"
        :size="size"
        :loading="item.pending"
        :disabled="!loggedIn || item.pending"
        :aria-label="`${item.label}: ${item.count}`"
        @click="toggle(item.type)"
      />
    </UTooltip>
  </UFieldGroup>
</template>
