<script setup lang="ts">
import type { PublicConsultationRegistrationFormDTO } from '~~/server/utils/serializers/consultationRegistrationForm'
import { registrationEventNoun } from '#shared/data/consultation-registrations'
import type { ThemeUI } from '@nuxt/ui/runtime/types/theme.js'

const route = useRoute()
const slug = computed(() => String(route.params.slugConsulta))

const { data: form } = await useAsyncData(
  () => `consultation-registration-form-public-${slug.value}`,
  () => $fetch<PublicConsultationRegistrationFormDTO>(
    `/api/consultations/${slug.value}/registration-form`
  ),
  { watch: [slug] }
)

// Sin formulario publicado no hay nada que inscribir: 404 explícito.
if (!form.value) {
  throw createError({ statusCode: 404, message: 'Formulario de inscripción no encontrado', fatal: true })
}

const eventNoun = computed(() => registrationEventNoun(form.value!.kind))
const isOpen = computed(() => form.value?.registrationState === 'open')

const eventDate = computed(() =>
  form.value
    ? new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'America/Argentina/Buenos_Aires'
      }).format(new Date(form.value.eventAt))
    : ''
)

const venue = computed(() => {
  if (!form.value) return ''
  return [form.value.venueName, form.value.venueAddress, form.value.venueCity, form.value.venueProvince]
    .filter(Boolean)
    .join(', ')
})

usePageSeo({
  title: `Inscripción - ${form.value?.title ?? ''}`,
  description: `Inscribite a la ${eventNoun.value}: ${form.value?.title ?? ''}.`
})

const themeUi: ThemeUI = {
  pageHero: {
    root: 'header-background-encuentros-regionales bg-primary',
    // Default container: flex flex-col lg:grid py-24 sm:py-32 lg:py-40 gap-16 sm:gap-y-24',
    // container: 'flex flex-col lg:flex lg:flex-row py-12 sm:py-16 md:py-16 lg:py-16 gap-6 sm:gap-y-6 md:gap-y-6 md:gap-12 justify-center items-center',
    container: 'flex flex-col lg:grid py-12 sm:py-16 md:py-16 lg:py-16 gap-6 sm:gap-y-6',
    // Default title: 'text-5xl sm:text-7xl text-pretty tracking-tight font-bold text-highlighted',
    title: 'text-white text-shadow-lg text-4xl sm:text-5xl font-bold ',
    // Default description: 'text-lg sm:text-xl/8 text-muted',
    description: 'text-white text-shadow-lg'
  },
  pageBody: {
    base: 'py-16 mt-0'
  }
}
</script>

<template>
  <UTheme :ui="themeUi">
    <UPageHero
      :title="form?.title ?? ''"
      :headline="`Formulario de inscripción a la ${eventNoun}`"
      :description="`${eventDate} - ${venue}`"
      :links="[{ label: 'Volver a la consulta', icon: 'lucide:arrow-left', to: `/consultas/${slug}`, color: 'neutral', variant: 'subtle', size: 'sm' }]"
    />
    <UContainer class="max-w-5xl">
      <UPage>
        <UPageBody v-if="form">
          <UPageCard
            variant="subtle"
            class="mb-6"
          >
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt class="text-muted">
                  Fecha y hora
                </dt>
                <dd class="font-medium text-highlighted">
                  {{ eventDate }}
                </dd>
              </div>
              <div>
                <dt class="text-muted">
                  Lugar
                </dt>
                <dd class="font-medium text-highlighted">
                  {{ venue }}
                </dd>
              </div>
            </dl>
          </UPageCard>

          <ConsultasInscripcionForm
            v-if="isOpen"
            :form="form"
            :consultation-slug="slug"
          />

          <UAlert
            v-else-if="form.registrationState === 'scheduled'"
            color="info"
            variant="subtle"
            icon="lucide:clock"
            title="Las inscripciones todavía no están abiertas"
            description="Volvé cuando se abra el período de inscripción para completar el formulario."
          />

          <UAlert
            v-else
            color="neutral"
            variant="subtle"
            icon="lucide:lock"
            title="Las inscripciones están cerradas"
            description="El período de inscripción para esta instancia ya finalizó."
          />
        </UPageBody>
      </UPage>
    </UContainer>
  </UTheme>
</template>
