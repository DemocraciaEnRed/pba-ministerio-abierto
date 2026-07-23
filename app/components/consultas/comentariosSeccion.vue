<script setup lang="ts">
import type { CommentOrder, PublicComment } from '~/types/consulta'

const props = withDefaults(
  defineProps<{
    /** Slug de la consulta contenedora. */
    consultationSlug: string
    /** Slug del tema, si el hilo es a nivel tema. */
    topicSlug?: string
    /** Ventana de participación abierta (permite crear comentarios). */
    commentingOpen?: boolean
    /** El usuario puede gestionar la consulta/tema (habilita autoría institucional). */
    canManage?: boolean
  }>(),
  {
    topicSlug: undefined,
    commentingOpen: false,
    canManage: false
  }
)

const basePath = computed(() =>
  props.topicSlug
    ? `/api/consultations/${props.consultationSlug}/topics/${props.topicSlug}/comments`
    : `/api/consultations/${props.consultationSlug}/comments`
)

// Fetch propio del hilo: client-only y perezoso, para no bloquear la carga
// (SSR) de la página. `view=thread` garantiza el hilo público aun para gestores.
const { data, status, error } = useAsyncData(
  `comments-${props.consultationSlug}-${props.topicSlug ?? 'root'}`,
  () => $fetch<PublicComment[]>(basePath.value, { query: { view: 'thread' } }),
  {
    server: false,
    lazy: true,
    default: (): PublicComment[] => [],
    watch: [basePath]
  }
)

// Copia local para actualizar de forma optimista al crear un comentario.
const items = ref<PublicComment[]>([])
watch(
  data,
  (next) => {
    items.value = next ?? []
  },
  { immediate: true }
)

const order = ref<CommentOrder>('recent')
const orderOptions: { label: string, value: CommentOrder }[] = [
  { label: 'Más recientes', value: 'recent' },
  { label: 'Más antiguos', value: 'oldest' }
]

// Orden del hilo de primer nivel (en cliente): por defecto, más reciente primero.
const sortedItems = computed(() => {
  const list = [...items.value]
  list.sort((a, b) => order.value === 'recent'
    ? b.createdAt.localeCompare(a.createdAt)
    : a.createdAt.localeCompare(b.createdAt))
  return list
})

function onCreated(comment: PublicComment): void {
  // Un comentario nuevo se agrega al conjunto; `sortedItems` lo ubica según el orden.
  items.value = [...items.value, { ...comment, replyCount: 0 }]
}

const totalSorted = computed(() => sortedItems.value.length)
</script>

<template>
  <div class="space-y-6">
    <ConsultasComentarioForm
      v-if="commentingOpen"
      :base-path="basePath"
      :commenting-open="commentingOpen"
      :can-manage="canManage"
      @created="onCreated"
    />
    <UAlert
      v-else
      icon="i-lucide-lock"
      color="neutral"
      variant="subtle"
      title="La participación está cerrada"
    />

    <UAlert
      v-if="error"
      icon="i-lucide-triangle-alert"
      color="error"
      variant="subtle"
      title="No se pudieron cargar los comentarios"
      description="Intentá recargar la página en unos instantes."
    />

    <UCard
      :ui="{ body: 'flex justify-between items-center sm:p-2 gap-8' }"
      variant="subtle"
    >
      <div class="flex items-center gap-1">
        <UBadge
          color="neutral"
          variant="outline"
        >
          {{ totalSorted }}
        </UBadge><span class="text-sm text-muted">{{ totalSorted === 1 ? 'comentario' : 'comentarios' }}</span>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-refresh-ccw"
          variant="outline"
          color="neutral"
          size="sm"

          :loading="false"
          aria-label="Recargar comentarios"
        />
        <USelect
          v-model="order"
          :items="orderOptions"
          size="sm"
          icon="i-lucide-arrow-down-up"
          class="w-44"
        />
      </div>
    </UCard>

    <ConsultasComentariosLista
      :comments="sortedItems"
      :base-path="basePath"
      :commenting-open="commentingOpen"
      :can-manage="canManage"
      :order="order"
      :loading="status === 'pending'"
    />
  </div>
</template>
