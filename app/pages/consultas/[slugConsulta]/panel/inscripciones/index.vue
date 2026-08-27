<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import type { AdminConsultationRegistrationDTO } from '~~/server/utils/serializers/consultationRegistration'
import type { AdminConsultationRegistrationFormDTO } from '~~/server/utils/serializers/consultationRegistrationForm'
import {
  REGISTRATION_CHARACTER_LABELS,
  REGISTRATION_PARTICIPATION_MODE_LABELS,
  registrationEventNoun
} from '#shared/data/consultation-registrations'
import { consultationTypeRegistrationKind } from '#shared/data/consultation-types'

definePageMeta({
  layout: 'consultas-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Formulario de inscripción')

interface RegistrationsResponse {
  items: AdminConsultationRegistrationDTO[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

const { slug, data: consultation } = useConsultationAdmin()
const requestFetch = useRequestFetch()

const kind = computed(() => consultationTypeRegistrationKind(consultation.value?.section?.slug))
const eventNoun = computed(() => (kind.value ? registrationEventNoun(kind.value) : 'instancia'))

const { data: form, status: formStatus, refresh: refreshForm } = await useAsyncData(
  () => `admin-consultation-registration-form-${slug.value}`,
  async () => {
    try {
      return await requestFetch<AdminConsultationRegistrationFormDTO>(
        `/api/consultations/${slug.value}/registration-form`
      )
    } catch {
      // 404 = todavía no se creó el formulario; es un estado válido de la pantalla.
      return null
    }
  },
  { watch: [slug] }
)

const page = ref(1)
const perPage = 20

const { data: registrations, status: listStatus, refresh: refreshRegistrations } = await useAsyncData(
  () => `admin-consultation-registrations-${slug.value}`,
  async () => {
    if (!form.value) return null
    return await requestFetch<RegistrationsResponse>(`/api/consultations/${slug.value}/registrations`, {
      query: { page: page.value, perPage }
    })
  },
  { watch: [slug, page, form] }
)

const confirmOpen = ref(false)
const deleting = ref(false)
const detailOpen = ref(false)
const selected = ref<AdminConsultationRegistrationDTO | null>(null)
const registrationToRemove = ref<AdminConsultationRegistrationDTO | null>(null)
const removingRegistration = ref(false)

const toast = useToast()

const createLink = computed(() => `/consultas/${slug.value}/panel/inscripciones/nuevo`)
const editLink = computed(() => `/consultas/${slug.value}/panel/inscripciones/editar`)

// Enlace público donde la ciudadanía se inscribe (para compartir).
async function copyRegistrationLink() {
  const url = `${window.location.origin}/consultas/${slug.value}/inscripcion`
  try {
    await navigator.clipboard.writeText(url)
    toast.add({ title: 'Link copiado', description: url, color: 'success' })
  } catch {
    toast.add({ title: 'No se pudo copiar el link', color: 'error' })
  }
}

function openDetail(registration: AdminConsultationRegistrationDTO) {
  selected.value = registration
  detailOpen.value = true
}

function askRemoveRegistration(registration: AdminConsultationRegistrationDTO) {
  registrationToRemove.value = registration
}

async function confirmRemoveRegistration() {
  const registration = registrationToRemove.value
  if (!registration) return

  removingRegistration.value = true
  try {
    await $fetch(`/api/registrations/${registration.id}`, { method: 'DELETE' })
    toast.add({ title: 'Inscripción eliminada', color: 'success' })
    registrationToRemove.value = null

    // Si era la última de la página, retrocedemos para no quedar en una vacía.
    if (registrations.value?.items.length === 1 && page.value > 1) page.value -= 1
    await refreshRegistrations()
  } catch (error) {
    toast.add({
      title: 'No se pudo eliminar',
      description: getErrorMessage(error),
      color: 'error'
    })
  } finally {
    removingRegistration.value = false
  }
}

async function onSaved() {
  await refreshForm()
  await refreshRegistrations()
}

async function confirmRemove() {
  deleting.value = true
  try {
    await $fetch(`/api/consultations/${slug.value}/registration-form`, { method: 'DELETE' })
    toast.add({ title: 'Formulario eliminado', color: 'success' })
    confirmOpen.value = false
    await onSaved()
  } catch (error) {
    toast.add({
      title: 'No se pudo eliminar',
      description: getErrorMessage(error),
      color: 'error'
    })
  } finally {
    deleting.value = false
  }
}

const headerButtons = computed<ButtonProps[]>(() => {
  if (!form.value) {
    return [
      {
        label: 'Crear formulario de inscripción',
        icon: 'lucide:plus',
        to: createLink.value
      }
    ]
  }

  return [
    {
      label: 'Copiar link',
      icon: 'lucide:link',
      color: 'neutral',
      variant: 'subtle',
      onClick: copyRegistrationLink
    },
    {
      label: 'Exportar CSV',
      icon: 'lucide:file-text',
      color: 'neutral',
      variant: 'subtle',
      to: `/api/consultations/${slug.value}/registrations/export`,
      external: true
    },
    {
      label: 'Editar',
      icon: 'lucide:pencil',
      color: 'neutral',
      variant: 'subtle',
      to: editLink.value
    },
    {
      label: 'Eliminar',
      icon: 'lucide:trash-2',
      color: 'error',
      variant: 'subtle',
      onClick: () => {
        confirmOpen.value = true
      }
    }
  ]
})

const venue = computed(() => {
  if (!form.value) return ''
  return `${form.value.venueName} — ${form.value.venueAddress}, ${form.value.venueCity}, ${form.value.venueProvince}`
})

function nextPage() {
  if (registrations.value && page.value < registrations.value.pagination.totalPages) page.value += 1
}

function prevPage() {
  if (page.value > 1) page.value -= 1
}
</script>

<template>
  <div>
    <UPageHeader
      title="Formulario de inscripción"
      :description="`Gestioná el formulario con el que la ciudadanía se inscribe a esta ${eventNoun}.`"
      :links="headerButtons"
    />

    <UPageBody>
      <UPageCard v-if="formStatus === 'pending'">
        Cargando formulario...
      </UPageCard>

      <UEmpty
        v-else-if="!form"
        icon="lucide:clipboard-list"
        title="Todavía no hay formulario de inscripción"
        :description="`Aún no se creó el formulario de inscripción para esta ${eventNoun}. Creá el formulario para que los interesados puedan inscribirse.`"
      />

      <template v-else>
        <UPageCard
          :title="form.title"
          :description="venue"
        >
          <dl class="grid gap-4 sm:grid-cols-3 text-sm">
            <div class="flex flex-col">
              <dt class="text-muted">
                Fecha del evento
              </dt>
              <dd class="text-highlighted">
                {{ formatDate(form.eventAt) }}
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-muted">
                Apertura de inscripciones
              </dt>
              <dd class="text-highlighted">
                {{ formatDate(form.opensAt) }}
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-muted">
                Cierre de inscripciones
              </dt>
              <dd class="text-highlighted">
                {{ formatDate(form.closesAt) }}
              </dd>
            </div>
          </dl>
        </UPageCard>

        <AppTable
          class="mt-6"
          zebra
          align-last-right
          :empty="!registrations || registrations.items.length === 0"
        >
          <template #thead>
            <tr>
              <th>Persona</th>
              <th>DNI</th>
              <th>Carácter</th>
              <th>Participación</th>
              <th>Inscripción</th>
              <th>Acciones</th>
            </tr>
          </template>

          <template #tbody>
            <tr
              v-for="registration in registrations?.items || []"
              :key="registration.id"
            >
              <td class="font-medium">
                {{ registration.firstName }} {{ registration.lastName }}
              </td>
              <td>{{ registration.dni }}</td>
              <td>{{ REGISTRATION_CHARACTER_LABELS[registration.character] }}</td>
              <td>
                {{ registration.participationMode ? REGISTRATION_PARTICIPATION_MODE_LABELS[registration.participationMode] : '—' }}
              </td>
              <td>{{ formatDate(registration.createdAt) }}</td>
              <td>
                <div class="flex justify-end gap-1">
                  <UButton
                    label="Ver"
                    icon="lucide:eye"
                    color="neutral"
                    variant="subtle"
                    size="xs"
                    @click="openDetail(registration)"
                  />
                  <UButton
                    icon="lucide:trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    :aria-label="`Eliminar la inscripción de ${registration.firstName} ${registration.lastName}`"
                    @click="askRemoveRegistration(registration)"
                  />
                </div>
              </td>
            </tr>
          </template>

          <template #empty>
            <UEmpty
              icon="lucide:inbox"
              title="Todavía no hay inscripciones"
              description="Cuando alguien complete el formulario, las inscripciones aparecerán acá."
            />
          </template>
        </AppTable>

        <div
          v-if="registrations && registrations.pagination.total > 0"
          class="flex items-center justify-between mt-4"
        >
          <p class="text-sm text-toned">
            {{ registrations.pagination.total }} inscripción(es)
          </p>

          <div class="flex gap-2">
            <UButton
              label="Anterior"
              color="neutral"
              variant="ghost"
              :disabled="registrations.pagination.page <= 1 || listStatus === 'pending'"
              @click="prevPage"
            />
            <UButton
              label="Siguiente"
              color="neutral"
              variant="ghost"
              :disabled="registrations.pagination.page >= registrations.pagination.totalPages || listStatus === 'pending'"
              @click="nextPage"
            />
          </div>
        </div>
      </template>
    </UPageBody>

    <ConsultasRegistrationSlideover
      v-model:open="detailOpen"
      :registration="selected"
    />

    <ConfirmModal
      v-model:open="confirmOpen"
      title="Eliminar formulario de inscripción"
      :description="`Se eliminarán también todas las inscripciones recibidas. Esta acción no se puede deshacer.`"
      confirm-label="Eliminar"
      :loading="deleting"
      @confirm="confirmRemove"
    />

    <ConfirmModal
      :open="registrationToRemove !== null"
      title="Eliminar inscripción"
      :description="registrationToRemove
        ? `Se eliminará la inscripción de ${registrationToRemove.firstName} ${registrationToRemove.lastName} y su documentación adjunta. Esta acción no se puede deshacer.`
        : ''"
      confirm-label="Eliminar"
      :loading="removingRegistration"
      @update:open="value => { if (!value) registrationToRemove = null }"
      @confirm="confirmRemoveRegistration"
    />
  </div>
</template>
