<script setup lang="ts">
import type { CommentOrder, PublicComment } from '~/types/consulta'

const props = withDefaults(
  defineProps<{
    comments: PublicComment[]
    /** Endpoint de creación del contenedor (para responder). */
    basePath: string
    /** Ventana de participación abierta. */
    commentingOpen?: boolean
    /** Habilita el toggle "comentar como institución". */
    canManage?: boolean
    /** Orden del hilo (para reiniciar la paginación al cambiarlo). */
    order?: CommentOrder
    /** Comentarios de primer nivel por página. */
    itemsPerPage?: number
    loading?: boolean
  }>(),
  {
    commentingOpen: false,
    canManage: false,
    order: 'recent',
    itemsPerPage: 10,
    loading: false
  }
)

const page = ref(1)

const total = computed(() => props.comments.length)

const paginated = computed(() => {
  const start = (page.value - 1) * props.itemsPerPage
  return props.comments.slice(start, start + props.itemsPerPage)
})

// Vuelve a la primera página si cambia el conjunto o el orden.
watch(total, () => {
  page.value = 1
})
watch(() => props.order, () => {
  page.value = 1
})
</script>

<template>
  <section class="space-y-4">
    <div
      v-if="loading"
      class="space-y-4"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="flex gap-3"
      >
        <USkeleton class="h-10 w-10 rounded-full" />
        <div class="flex-1 space-y-2 py-1">
          <USkeleton class="h-3 w-1/3" />
          <USkeleton class="h-3 w-full" />
          <USkeleton class="h-3 w-4/5" />
        </div>
      </div>
    </div>

    <div
      v-else-if="!total"
      class="rounded-md border border-dashed border-default p-6 text-center"
    >
      <UIcon
        name="i-lucide-message-square-dashed"
        class="mx-auto mb-2 size-6 text-muted"
      />
      <p class="text-sm text-muted">
        Todavía no hay comentarios. ¡Sé el primero en participar!
      </p>
    </div>

    <template v-else>
      <ul
        role="list"
        class="divide-y divide-default"
      >
        <li
          v-for="comment in paginated"
          :key="comment.id"
        >
          <ConsultasComentarioItem
            :comment="comment"
            :base-path="basePath"
            :commenting-open="commentingOpen"
            :can-manage="canManage"
            :order="order"
          />
        </li>
      </ul>

      <div
        v-if="total > itemsPerPage"
        class="flex justify-center pt-2"
      >
        <UPagination
          v-model:page="page"
          :total="total"
          :items-per-page="itemsPerPage"
          :sibling-count="1"
        />
      </div>
    </template>
  </section>
</template>
