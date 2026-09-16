<script setup lang="ts">
import type { PublicObservatoryPublicationDTO } from '~~/server/utils/serializers/observatoryPublication'

defineOptions({ name: 'ObservatorioPublicationsShowcase' })

const { data: publications } = await useAsyncData('observatory-publications-showcase', () =>
  $fetch<PublicObservatoryPublicationDTO[]>('/api/observatory-publications')
)

const PER_PAGE = 3
const page = ref(1)

const total = computed(() => publications.value?.length ?? 0)

const paginated = computed(() =>
  (publications.value ?? []).slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE)
)
</script>

<template>
  <div
    v-if="total"
    class="space-y-6"
  >
    <ul class="space-y-4">
      <li
        v-for="publication in paginated"
        :key="publication.id"
      >
        <article class="flex flex-col gap-4 rounded-xl border border-default p-4 sm:flex-row">
          <div class="shrink-0">
            <img
              v-if="publication.coverUrl"
              :src="publication.coverUrl"
              :alt="publication.title"
              class="h-40 w-full rounded-lg object-cover sm:h-32 sm:w-24"
              loading="lazy"
            >
            <div
              v-else
              class="flex h-40 w-full items-center justify-center rounded-lg bg-elevated sm:h-32 sm:w-24"
            >
              <UIcon
                name="i-lucide-file-text"
                class="size-8 text-muted"
              />
            </div>
          </div>

          <div class="flex flex-1 flex-col gap-2">
            <div class="flex items-start justify-between gap-3">
              <h3 class="text-base font-semibold leading-tight text-highlighted">
                {{ publication.title }}
              </h3>
              <UBadge
                :label="String(publication.publicationYear)"
                color="neutral"
                variant="subtle"
                size="sm"
              />
            </div>
            <p
              v-if="publication.description"
              class="line-clamp-3 text-sm text-muted"
            >
              {{ publication.description }}
            </p>
            <div class="mt-auto pt-2">
              <UButton
                v-if="publication.downloadUrl"
                :to="publication.downloadUrl"
                target="_blank"
                rel="noopener noreferrer"
                label="Descargar"
                icon="i-lucide-download"
                color="primary"
                variant="subtle"
                size="sm"
              />
            </div>
          </div>
        </article>
      </li>
    </ul>

    <div
      v-if="total > PER_PAGE"
      class="flex justify-center"
    >
      <UPagination
        v-model:page="page"
        :total="total"
        :items-per-page="PER_PAGE"
        :sibling-count="1"
      />
    </div>
  </div>

  <UEmpty
    v-else
    icon="i-lucide-book-open"
    title="Todavía no hay publicaciones"
    description="Pronto vas a encontrar acá los documentos del Observatorio."
  />
</template>
