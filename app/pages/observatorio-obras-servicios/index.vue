<script setup lang="ts">
import { getConsultationType } from '#shared/data/consultation-types'

interface WorkGroup {
  id: number
  slug: string
  name: string
  description: string | null
  color: string
  iconColor: string
  icon: string
}

const consultationType = getConsultationType('observatorio-obras-servicios')

usePageSeo({
  title: 'Observatorio de Obras y Servicios Públicos',
  description: 'Espacio institucional de participación y control ciudadano sobre la obra pública de la Provincia de Buenos Aires.',
  url: '/observatorio-obras-servicios'
})

const { data: workGroups } = await useAsyncData('observatory-work-groups', () =>
  $fetch<WorkGroup[]>('/api/observatory-work-groups')
)
</script>

<template>
  <div>
    <UPageHero
      title="Observatorio de Obras y Servicios Públicos"
      :description="consultationType?.description"
      :ui="{ root: 'bg-primary', title: 'text-white', description: 'text-white' }"
    >
      <template #links>
        <UButton
          to="/observatorio-obras-servicios/formulario"
          label="Presentá tu aporte"
          icon="lucide:send"
          size="xl"
          color="neutral"
        />
      </template>
    </UPageHero>

    <UContainer>
      <UPageSection
        title="Grupos de trabajo"
        description="El Observatorio se organiza en grupos de trabajo que abordan los distintos ejes de la obra pública provincial."
      >
        <UPageGrid>
          <div
            v-for="group in workGroups || []"
            :key="group.id"
            class="flex flex-col gap-3 rounded-xl p-5"
            :style="{ backgroundColor: group.color, color: group.iconColor }"
          >
            <UIcon
              :name="group.icon"
              class="size-10"
            />
            <h3 class="text-lg font-semibold leading-tight">
              {{ group.name }}
            </h3>
            <p class="text-sm opacity-90">
              {{ group.description }}
            </p>
          </div>
        </UPageGrid>
      </UPageSection>

      <UPageSection
        title="Instituciones que integran el Observatorio"
        description="Universidades, colegios profesionales, cámaras empresariales, sindicatos y organizaciones de la sociedad civil que participan del espacio."
      >
        <ObservatorioInstitutionsShowcase />
      </UPageSection>
    </UContainer>
  </div>
</template>
