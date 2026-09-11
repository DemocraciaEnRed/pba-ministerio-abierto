<script setup lang="ts">
import type {
  PublicObservatoryInstitutionDTO,
  PublicObservatoryInstitutionCategoryDTO
} from '~~/server/utils/serializers/observatoryInstitution'

defineOptions({ name: 'ObservatorioInstitutionsShowcase' })

const { data: institutions } = await useAsyncData('observatory-institutions-showcase', () =>
  $fetch<PublicObservatoryInstitutionDTO[]>('/api/observatory-institutions')
)

const { data: categories } = await useAsyncData('observatory-institution-categories-showcase', () =>
  $fetch<PublicObservatoryInstitutionCategoryDTO[]>('/api/observatory-institution-categories')
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
  <div
    v-if="groups.length"
    class="space-y-10"
  >
    <div
      v-for="group in groups"
      :key="group.category.id"
      class="space-y-4"
    >
      <h3 class="text-sm font-semibold uppercase tracking-wide text-muted">
        {{ group.category.name }}
      </h3>

      <ul class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <li
          v-for="institution in group.institutions"
          :key="institution.id"
        >
          <component
            :is="institution.websiteUrl ? 'a' : 'div'"
            :href="institution.websiteUrl || undefined"
            :target="institution.websiteUrl ? '_blank' : undefined"
            :rel="institution.websiteUrl ? 'noopener noreferrer' : undefined"
            class="flex h-full min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-accented bg-default p-4 text-center transition hover:border-primary"
          >
            <img
              v-if="institution.logoUrl"
              :src="institution.logoUrl"
              :alt="institution.name"
              class="h-12 w-auto max-w-full object-contain"
              loading="lazy"
            >
            <span
              v-else
              class="text-sm font-medium leading-tight text-highlighted"
            >
              {{ institution.name }}
            </span>
          </component>
        </li>
      </ul>
    </div>
  </div>
</template>
