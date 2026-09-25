<script setup lang="ts">
import type {
  PublicObservatoryInstitutionDTO,
  PublicObservatoryInstitutionCategoryDTO
} from '~~/server/utils/serializers/observatoryInstitution'

defineOptions({ name: 'ObservatorioInstitutionsFullList' })

// server: false evita renderizarlo en SSR y así no hay mismatch de hidratación
// si el catálogo cambia entre el build/caché y el momento de la visita.
const { data: institutions, status: institutionsStatus } = await useFetch<PublicObservatoryInstitutionDTO[]>(
  '/api/observatory-institutions',
  { server: false }
)
const { data: categories, status: categoriesStatus } = await useFetch<PublicObservatoryInstitutionCategoryDTO[]>(
  '/api/observatory-institution-categories',
  { server: false }
)

const isLoading = computed(() =>
  institutionsStatus.value === 'idle' || institutionsStatus.value === 'pending'
  || categoriesStatus.value === 'idle' || categoriesStatus.value === 'pending'
)

const groups = computed(() =>
  (categories.value ?? [])
    .map(category => ({
      category,
      institutions: (institutions.value ?? []).filter(institution => institution.categoryId === category.id)
    }))
    .filter(group => group.institutions.length > 0)
)
</script>

<template>
  <ClientOnly>
    <p
      v-if="isLoading"
      class="leading-7 text-neutral-700 dark:text-neutral-300"
    >
      Cargando instituciones…
    </p>
    <div
      v-else-if="groups.length"
      class="space-y-6"
    >
      <div
        v-for="group in groups"
        :key="group.category.id"
      >
        <h3 class="font-bold text-primary mb-2">
          {{ group.category.name }}
        </h3>
        <ul class="list-disc list-inside space-y-1 leading-7 text-neutral-700 dark:text-neutral-300">
          <li
            v-for="institution in group.institutions"
            :key="institution.id"
          >
            <ULink
              v-if="institution.websiteUrl"
              :to="institution.websiteUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-primary hover:underline"
            >
              {{ institution.name }}
              <UIcon
                name="lucide:external-link"
                class="size-3.5 shrink-0"
              />
            </ULink>
            <span v-else>{{ institution.name }}</span>
          </li>
        </ul>
      </div>
    </div>
  </ClientOnly>
</template>
