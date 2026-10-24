<script setup lang="ts">
export interface RegionalMeetingFormValues {
  location: string
  heldAt: string | null
  registrationUrl: string
  registrationOpensAt: string | null
  registrationClosesAt: string | null
}

interface RegionOption {
  id: number
  slug: string
  name: string
}

interface AgendaResponse {
  items: Array<{
    region: { id: number } | null
    consultation: { id: number, title: string }
  }>
}

const props = defineProps<{
  /** Consulta que se está editando; se excluye al buscar duplicados. */
  consultationId?: number | null
  errors: Partial<Record<string, string>>
}>()

const regionId = defineModel<number | undefined>('regionId', { required: true })
const meeting = defineModel<RegionalMeetingFormValues>('meeting', { required: true })

const { data: regions, status: regionsStatus } = useAsyncData(
  'consultation-form-regions',
  () => $fetch<RegionOption[]>('/api/regions'),
  { default: () => [] }
)

const regionItems = computed(() =>
  (regions.value ?? []).map(region => ({ label: region.name, value: region.id }))
)

const hasRegistration = computed(() => meeting.value.registrationUrl.trim().length > 0)

const meetingYear = computed(() => (meeting.value.heldAt ? regionalMeetingYear(meeting.value.heldAt) : null))

// Regla de negocio blanda: un encuentro por región y año. Solo se advierte.
const duplicate = ref<{ id: number, title: string } | null>(null)

watch([regionId, meetingYear], async ([currentRegionId, year]) => {
  duplicate.value = null
  if (!currentRegionId || !year) return
  try {
    const response = await $fetch<AgendaResponse>('/api/regional-meetings/agenda', { query: { year } })
    const match = response.items.find(item =>
      item.region?.id === currentRegionId && item.consultation.id !== props.consultationId
    )
    duplicate.value = match ? match.consultation : null
  } catch {
    duplicate.value = null
  }
}, { immediate: true })

const duplicateRegionName = computed(() =>
  regions.value?.find(region => region.id === regionId.value)?.name ?? 'esta región'
)
</script>

<template>
  <div class="md:col-span-2 space-y-4 rounded-lg border border-default p-4">
    <div>
      <h3 class="font-semibold text-highlighted">
        Encuentro regional
      </h3>
      <p class="text-sm text-muted">
        Estos datos arman la agenda pública de Encuentros Regionales. El estado del encuentro se toma de las fechas de participación de la consulta.
      </p>
    </div>

    <UAlert
      v-if="duplicate"
      color="warning"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      title="Ya hay un encuentro para esta región en ese año"
      :description="`«${duplicate.title}» ya es el encuentro de ${duplicateRegionName} en ${meetingYear}. Podés guardar igual, pero en la agenda van a aparecer los dos.`"
    />

    <div class="grid gap-4 md:grid-cols-2">
      <UFormField
        label="Región"
        description="Región de la Provincia de Buenos Aires del encuentro."
        required
        :error="errors.regionId"
      >
        <USelect
          v-model="regionId"
          :items="regionItems"
          value-key="value"
          placeholder="Elegí una región"
          :loading="regionsStatus === 'pending'"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Lugar"
        description="Ciudad o sede donde se realiza el encuentro."
        required
        :error="errors['regionalMeeting.location'] ?? errors.regionalMeeting"
      >
        <UInput
          v-model="meeting.location"
          :maxlength="160"
          placeholder="Ej.: Bahía Blanca"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Fecha y hora del encuentro"
        description="Define también el año en el que aparece en la agenda."
        required
        :error="errors['regionalMeeting.heldAt']"
      >
        <DateTimeField
          v-model="meeting.heldAt"
          placeholder="Sin definir"
        />
      </UFormField>

      <UFormField
        label="Enlace de inscripción"
        description="Formulario externo al que lleva el botón «Inscribite». Opcional."
        :error="errors['regionalMeeting.registrationUrl']"
      >
        <UInput
          v-model="meeting.registrationUrl"
          type="url"
          placeholder="https://…"
          class="w-full"
        />
      </UFormField>

      <template v-if="hasRegistration">
        <UFormField
          label="Inscripción desde"
          description="Desde cuándo se muestra el botón «Inscribite»."
          required
          :error="errors['regionalMeeting.registrationOpensAt']"
        >
          <DateTimeField
            v-model="meeting.registrationOpensAt"
            placeholder="Sin definir"
          />
        </UFormField>

        <UFormField
          label="Inscripción hasta"
          description="Hasta cuándo se muestra el botón «Inscribite»."
          required
          :error="errors['regionalMeeting.registrationClosesAt']"
        >
          <DateTimeField
            v-model="meeting.registrationClosesAt"
            placeholder="Sin definir"
          />
        </UFormField>
      </template>
    </div>
  </div>
</template>
