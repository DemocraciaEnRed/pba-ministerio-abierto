<script setup lang="ts">
import type { ButtonProps, FormSubmitEvent } from '@nuxt/ui'
import { AccreditationEntrySchema, type AccreditationEntryInput } from '#shared/schemas/accreditations'
import type { AdminConsultationRegistrationFormDTO } from '~~/server/utils/serializers/consultationRegistrationForm'
import type { AdminAccreditationEntryDTO, AccreditationState } from '~~/server/utils/serializers/accreditation'
import { registrationEventNoun } from '#shared/data/consultation-registrations'
import { consultationTypeRegistrationKind } from '#shared/data/consultation-types'

definePageMeta({
  layout: 'consultas-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Acreditaciones')

interface EntriesResponse {
  items: AdminAccreditationEntryDTO[]
  pagination: { page: number, perPage: number, total: number, totalPages: number }
}

const { slug, data: consultation } = useConsultationAdmin()
const requestFetch = useRequestFetch()
const toast = useToast()

const kind = computed(() => consultationTypeRegistrationKind(consultation.value?.section?.slug))
const eventNoun = computed(() => (kind.value ? registrationEventNoun(kind.value) : 'instancia'))

const backLink = computed(() => `/consultas/${slug.value}/panel/inscripciones`)
const qrLink = computed(() => `/consultas/${slug.value}/panel/inscripciones/acreditaciones/qr`)

const { data: form, status: formStatus } = await useAsyncData(
  () => `admin-accreditation-form-${slug.value}`,
  async () => {
    try {
      return await requestFetch<AdminConsultationRegistrationFormDTO>(
        `/api/consultations/${slug.value}/registration-form`
      )
    } catch {
      return null
    }
  },
  { watch: [slug] }
)

const accreditation = computed(() => form.value?.accreditation ?? null)

const page = ref(1)
const perPage = 20

const { data: entries, status: listStatus, refresh: refreshEntries } = await useAsyncData(
  () => `admin-accreditation-entries-${slug.value}`,
  async () => {
    if (!accreditation.value) return null
    return await requestFetch<EntriesResponse>(`/api/consultations/${slug.value}/accreditation/entries`, {
      query: { page: page.value, perPage }
    })
  },
  { watch: [slug, page, accreditation] }
)

const STATE_BADGE: Record<AccreditationState, { label: string, color: ButtonProps['color'] }> = {
  disabled: { label: 'Deshabilitada (histórica)', color: 'neutral' },
  scheduled: { label: 'Programada', color: 'info' },
  open: { label: 'Abierta', color: 'success' },
  closed: { label: 'Cerrada', color: 'neutral' }
}

const headerButtons = computed<ButtonProps[]>(() => {
  const buttons: ButtonProps[] = [
    { label: 'Volver a inscripciones', icon: 'lucide:arrow-left', color: 'neutral', variant: 'ghost', to: backLink.value }
  ]
  if (accreditation.value) {
    buttons.push(
      { label: 'Copiar link', icon: 'lucide:link', color: 'neutral', variant: 'subtle', onClick: copyAccreditationLink },
      { label: 'Exportar CSV', icon: 'lucide:file-text', color: 'neutral', variant: 'subtle', to: `/api/consultations/${slug.value}/accreditation/entries/export`, external: true },
      { label: 'Ver QR', icon: 'lucide:qr-code', color: 'primary', variant: 'solid', to: qrLink.value, target: '_blank' }
    )
  }
  return buttons
})

// Enlace público de acreditación (para compartir o proyectar).
async function copyAccreditationLink() {
  if (!accreditation.value) return
  const url = `${window.location.origin}/acreditaciones/${accreditation.value.publicId}`
  try {
    await navigator.clipboard.writeText(url)
    toast.add({ title: 'Link copiado', description: url, color: 'success' })
  } catch {
    toast.add({ title: 'No se pudo copiar el link', color: 'error' })
  }
}

// --- Alta manual ---
const addState = reactive({ dni: '', firstName: '', lastName: '', email: '' })
const adding = ref(false)

async function onAddEntry(event: FormSubmitEvent<AccreditationEntryInput>) {
  adding.value = true
  try {
    await $fetch(`/api/consultations/${slug.value}/accreditation/entries`, {
      method: 'POST',
      body: event.data
    })
    toast.add({ title: 'Ingreso registrado', color: 'success' })
    addState.dni = ''
    addState.firstName = ''
    addState.lastName = ''
    addState.email = ''
    page.value = 1
    await refreshEntries()
  } catch (error) {
    toast.add({ title: 'No se pudo registrar el ingreso', description: getErrorMessage(error), color: 'error' })
  } finally {
    adding.value = false
  }
}

// --- Baja ---
const entryToRemove = ref<AdminAccreditationEntryDTO | null>(null)
const removing = ref(false)

async function confirmRemove() {
  const entry = entryToRemove.value
  if (!entry) return
  removing.value = true
  try {
    await $fetch(`/api/accreditation-entries/${entry.id}`, { method: 'DELETE' })
    toast.add({ title: 'Ingreso eliminado', color: 'success' })
    entryToRemove.value = null
    if (entries.value?.items.length === 1 && page.value > 1) page.value -= 1
    await refreshEntries()
  } catch (error) {
    toast.add({ title: 'No se pudo eliminar', description: getErrorMessage(error), color: 'error' })
  } finally {
    removing.value = false
  }
}

function nextPage() {
  if (entries.value && page.value < entries.value.pagination.totalPages) page.value += 1
}
function prevPage() {
  if (page.value > 1) page.value -= 1
}

function personName(entry: AdminAccreditationEntryDTO): string {
  const name = [entry.firstName, entry.lastName].filter(Boolean).join(' ')
  return name || '—'
}
</script>

<template>
  <div>
    <UPageHeader
      title="Acreditaciones"
      :description="`Gestioná el registro de asistencia por QR para esta ${eventNoun}.`"
      :links="headerButtons"
    />

    <UPageBody>
      <UPageCard v-if="formStatus === 'pending'">
        Cargando acreditaciones...
      </UPageCard>

      <UEmpty
        v-else-if="!form"
        icon="lucide:clipboard-list"
        title="Todavía no hay formulario de inscripción"
        :description="`Creá primero el formulario de inscripción para poder habilitar las acreditaciones.`"
      />

      <UEmpty
        v-else-if="!accreditation"
        icon="lucide:qr-code"
        title="Las acreditaciones no están habilitadas"
        description="Habilitá las acreditaciones y definí su ventana desde la edición del formulario de inscripción."
      >
        <template #actions>
          <UButton
            label="Editar formulario"
            icon="lucide:pencil"
            :to="`/consultas/${slug}/panel/inscripciones/editar`"
          />
        </template>
      </UEmpty>

      <template v-else>
        <UPageCard>
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="space-y-2">
              <UBadge
                :label="STATE_BADGE[accreditation.state].label"
                :color="STATE_BADGE[accreditation.state].color"
                variant="soft"
              />
              <dl class="grid gap-4 sm:grid-cols-3 text-sm">
                <div class="flex flex-col">
                  <dt class="text-muted">
                    Apertura
                  </dt>
                  <dd class="text-highlighted">
                    {{ formatDate(accreditation.opensAt) }}
                  </dd>
                </div>
                <div class="flex flex-col">
                  <dt class="text-muted">
                    Cierre
                  </dt>
                  <dd class="text-highlighted">
                    {{ formatDate(accreditation.closesAt) }}
                  </dd>
                </div>
                <div class="flex flex-col">
                  <dt class="text-muted">
                    Ingresos
                  </dt>
                  <dd class="text-highlighted">
                    {{ accreditation.entriesCount }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </UPageCard>

        <UPageCard
          class="mt-6"
          title="Registrar ingreso manual"
          description="Cargá un ingreso a mano. Se admite fuera de la ventana de acreditación."
        >
          <UForm
            :schema="AccreditationEntrySchema"
            :state="addState"
            class="space-y-4"
            @submit="onAddEntry"
          >
            <div class="grid gap-4 md:grid-cols-4">
              <UFormField
                label="DNI"
                name="dni"
                required
              >
                <UInput
                  v-model="addState.dni"
                  inputmode="numeric"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Nombre"
                name="firstName"
              >
                <UInput
                  v-model="addState.firstName"
                  placeholder="Opcional"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Apellido"
                name="lastName"
              >
                <UInput
                  v-model="addState.lastName"
                  placeholder="Opcional"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Correo"
                name="email"
              >
                <UInput
                  v-model="addState.email"
                  type="email"
                  placeholder="Opcional"
                  class="w-full"
                />
              </UFormField>
            </div>
            <div class="flex justify-end">
              <UButton
                type="submit"
                label="Registrar ingreso"
                icon="lucide:user-plus"
                :loading="adding"
              />
            </div>
          </UForm>
        </UPageCard>

        <AppTable
          class="mt-6"
          zebra
          align-last-right
          :empty="!entries || entries.items.length === 0"
        >
          <template #thead>
            <tr>
              <th>DNI</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Inscripción</th>
              <th>Ingreso</th>
              <th>Acciones</th>
            </tr>
          </template>

          <template #tbody>
            <tr
              v-for="entry in entries?.items || []"
              :key="entry.id"
            >
              <td class="font-medium">
                {{ entry.dni }}
              </td>
              <td>{{ personName(entry) }}</td>
              <td>{{ entry.email || '—' }}</td>
              <td>
                <UBadge
                  v-if="entry.linkedToRegistration"
                  label="Inscripto/a"
                  color="success"
                  variant="subtle"
                  size="sm"
                />
                <span
                  v-else
                  class="text-muted"
                >—</span>
              </td>
              <td>{{ formatDate(entry.accreditedAt) }}</td>
              <td>
                <div class="flex justify-end">
                  <UButton
                    icon="lucide:trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    :aria-label="`Eliminar el ingreso con DNI ${entry.dni}`"
                    @click="entryToRemove = entry"
                  />
                </div>
              </td>
            </tr>
          </template>

          <template #empty>
            <UEmpty
              icon="lucide:inbox"
              title="Todavía no hay ingresos"
              description="Cuando alguien se acredite con el QR o cargues un ingreso manual, aparecerá acá."
            />
          </template>
        </AppTable>

        <div
          v-if="entries && entries.pagination.total > 0"
          class="flex items-center justify-between mt-4"
        >
          <p class="text-sm text-toned">
            {{ entries.pagination.total }} ingreso(s)
          </p>
          <div class="flex gap-2">
            <UButton
              label="Anterior"
              color="neutral"
              variant="ghost"
              :disabled="entries.pagination.page <= 1 || listStatus === 'pending'"
              @click="prevPage"
            />
            <UButton
              label="Siguiente"
              color="neutral"
              variant="ghost"
              :disabled="entries.pagination.page >= entries.pagination.totalPages || listStatus === 'pending'"
              @click="nextPage"
            />
          </div>
        </div>
      </template>
    </UPageBody>

    <ConfirmModal
      :open="entryToRemove !== null"
      title="Eliminar ingreso"
      :description="entryToRemove
        ? `Se eliminará el ingreso con DNI ${entryToRemove.dni}. Esta acción no se puede deshacer.`
        : ''"
      confirm-label="Eliminar"
      :loading="removing"
      @update:open="value => { if (!value) entryToRemove = null }"
      @confirm="confirmRemove"
    />
  </div>
</template>
