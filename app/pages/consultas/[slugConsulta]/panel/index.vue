<script setup lang="ts">
import { consultationTypeAllowsRegion, consultationTypeAllowsRegistrationForm } from '#shared/data/consultation-types'
import type { AdminConsultationRegistrationFormDTO } from '~~/server/utils/serializers/consultationRegistrationForm'

definePageMeta({
  layout: 'consultas-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Panel de la consulta')

const { slug, data: consultation } = useConsultationAdmin()
const requestFetch = useRequestFetch()

type Visibility = 'hidden' | 'visible' | 'archived'

// Estadísticas del formulario de inscripción (solo en tipos que lo admiten).
const allowsRegistrationForm = computed(() => consultationTypeAllowsRegistrationForm(consultation.value?.section?.slug))

const { data: registrationForm } = await useAsyncData(
  () => `admin-panel-registration-form-${slug.value}`,
  async () => {
    if (!allowsRegistrationForm.value) return null
    try {
      return await requestFetch<AdminConsultationRegistrationFormDTO>(`/api/consultations/${slug.value}/registration-form`)
    } catch {
      return null
    }
  },
  { watch: [slug, allowsRegistrationForm] }
)

const registrationStateLabels: Record<'scheduled' | 'open' | 'closed', string> = {
  scheduled: 'Programada',
  open: 'Abierta',
  closed: 'Cerrada'
}
const registrationStateColors: Record<'scheduled' | 'open' | 'closed', 'success' | 'warning' | 'neutral'> = {
  scheduled: 'warning',
  open: 'success',
  closed: 'neutral'
}
const accreditationStateLabels: Record<'disabled' | 'scheduled' | 'open' | 'closed', string> = {
  disabled: 'Deshabilitada',
  scheduled: 'Programada',
  open: 'Abierta',
  closed: 'Cerrada'
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Sin definir'
  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatLabel = computed(() => consultation.value?.consultationFormat === 'single' ? 'Única' : 'Múltiple')

const visibilityColors: Record<Visibility, 'success' | 'warning' | 'neutral'> = {
  visible: 'success',
  hidden: 'warning',
  archived: 'neutral'
}

const publicationState = computed(() => {
  const c = consultation.value
  if (!c) return null
  return {
    label: visibilityLabelsConsulta[c.visibility],
    icon: visibilityIcons[c.visibility],
    color: visibilityColors[c.visibility],
    participation: participationStateBadge(c.participationState).label
  }
})

const requiresRegionByType = computed(() => consultationTypeAllowsRegion(consultation.value?.section?.slug))
const needsRegionClassification = computed(() => requiresRegionByType.value && !consultation.value?.region)

// Recordatorio no bloqueante: falta definir tipo de consulta y/o región cuando corresponde.
const missingClassification = computed(() => {
  const c = consultation.value
  if (!c) return [] as string[]
  const missing: string[] = []
  if (!c.section) missing.push('el tipo de consulta')
  if (needsRegionClassification.value) missing.push('la región')
  return missing
})

const classificationHint = computed(() => {
  const items = missingClassification.value
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(', ')} ni ${items[items.length - 1]}`
})

const classificationDescription = computed(() => {
  const base = `Todavía no definiste ${classificationHint.value}. No es obligatorio, pero ayuda a que la consulta aparezca mejor en el listado público y los filtros.`

  if (needsRegionClassification.value) {
    return `${base} En Encuentros Regionales es importante asignar la región desde Clasificación.`
  }

  return base
})
</script>

<template>
  <UPage>
    <UPageHeader
      title="Panel de gestión"
      description="Resumen y accesos rápidos de la consulta."
    >
      <template #links>
        <UButton
          label="Editar consulta"
          icon="i-lucide-pencil"
          color="neutral"
          variant="subtle"
          :to="`/consultas/${slug}/panel/editar`"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <UAlert
        v-if="missingClassification.length"
        icon="i-lucide-shapes"
        color="warning"
        variant="subtle"
        class="mb-6"
        title="Completá la clasificación de la consulta"
        :description="classificationDescription"
        :actions="[{ label: 'Completar clasificación', icon: 'i-lucide-shapes', color: 'warning', variant: 'soft', to: `/consultas/${slug}/panel/clasificacion` }]"
      />
      <UAlert
        v-if="consultation?.visibility === 'hidden'"
        icon="i-lucide-eye-off"
        color="neutral"
        variant="subtle"
        class="mb-6"
        title="La consulta está oculta"
        description="Mientras esté en estado Oculta, la ciudadanía no la va a ver en el sitio público."
        :actions="[{ label: 'Ir a configuración', icon: 'i-lucide-settings-2', color: 'neutral', variant: 'soft', to: `/consultas/${slug}/panel/configuracion` }]"
      />
      <div class="space-y-8">
        <section class="space-y-3">
          <h2 class="text-sm font-medium text-muted">
            Estado de la consulta
          </h2>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminPanelStat
              :icon="publicationState?.icon ?? 'lucide:eye'"
              label="Publicación"
              :value="publicationState?.label ?? 'Sin definir'"
              :color="publicationState?.color ?? 'neutral'"
              :hint="publicationState ? `Participación: ${publicationState.participation}` : undefined"
              :to="`/consultas/${slug}/panel/configuracion`"
            />

            <AdminPanelStat
              icon="i-lucide-git-branch"
              label="Formato"
              :value="formatLabel"
              :hint="consultation?.featured ? 'Destacada en el listado' : 'Sin destacar'"
            />

            <AdminPanelStat
              icon="i-lucide-calendar-range"
              label="Participación"
            >
              <div class="space-y-0.5 text-sm">
                <p class="flex items-center gap-1.5">
                  <UIcon
                    name="i-lucide-calendar-plus"
                    class="size-3.5 shrink-0 text-muted"
                  />
                  <span class="text-muted">Inicio:</span>
                  <span class="font-medium text-highlighted">{{ formatDate(consultation?.startsAt) }}</span>
                </p>
                <p class="flex items-center gap-1.5">
                  <UIcon
                    name="i-lucide-calendar-x"
                    class="size-3.5 shrink-0 text-muted"
                  />
                  <span class="text-muted">Cierre:</span>
                  <span class="font-medium text-highlighted">{{ formatDate(consultation?.endsAt) }}</span>
                </p>
              </div>
            </AdminPanelStat>
          </div>
        </section>

        <section
          v-if="registrationForm"
          class="space-y-3"
        >
          <h2 class="text-sm font-medium text-muted">
            Formulario de inscripción
          </h2>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminPanelStat
              icon="i-lucide-clipboard-list"
              label="Inscripciones"
              :value="registrationForm.registrationsCount"
              :color="registrationStateColors[registrationForm.registrationState]"
              :hint="`Estado: ${registrationStateLabels[registrationForm.registrationState]}`"
              :to="`/consultas/${slug}/panel/inscripciones`"
            />

            <AdminPanelStat
              icon="i-lucide-qr-code"
              label="Acreditaciones"
              :value="registrationForm.accreditation ? registrationForm.accreditation.entriesCount : 'Deshabilitadas'"
              :color="registrationForm.accreditation && registrationForm.accreditation.state === 'open' ? 'success' : 'neutral'"
              :hint="registrationForm.accreditation
                ? `Estado: ${accreditationStateLabels[registrationForm.accreditation.state]}`
                : 'No habilitadas'"
              :to="`/consultas/${slug}/panel/inscripciones/acreditaciones`"
            />
          </div>
        </section>

        <AdminConsultationActivityStats :slug="slug" />
      </div>
    </UPageBody>
  </UPage>
</template>
