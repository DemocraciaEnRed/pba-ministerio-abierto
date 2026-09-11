<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import {
  AccreditationEntrySchema,
  AccreditationEntryDetailsSchema,
  type AccreditationEntryInput,
  type AccreditationEntryDetailsInput
} from '#shared/schemas/accreditations'
import type { PublicAccreditationDTO } from '~~/server/utils/serializers/accreditation'

definePageMeta({
  layout: 'clean'
})

const route = useRoute()
const publicId = computed(() => String(route.params.publicId))

const { data: accreditation, error } = await useAsyncData(
  () => `accreditation-${publicId.value}`,
  () => $fetch<PublicAccreditationDTO>(`/api/accreditations/${publicId.value}`),
  { watch: [publicId] }
)

usePageSeo({
  title: 'Acreditación',
  description: 'Registrá tu asistencia al evento.',
  noindex: true
})

const LOGO_URL = 'https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/logo/logofull.svg'

const toast = useToast()

// --- Paso 1: DNI ---
const state = reactive({ dni: '' })
const submitting = ref(false)
const done = ref(false)
const entryId = ref<number | null>(null)

async function onSubmit(event: FormSubmitEvent<AccreditationEntryInput>) {
  submitting.value = true
  try {
    const res = await $fetch<{ id: number }>(`/api/accreditations/${publicId.value}/entries`, {
      method: 'POST',
      body: { dni: event.data.dni }
    })
    entryId.value = res.id
    done.value = true
  } catch (err) {
    toast.add({
      title: 'No pudimos registrar la acreditación',
      description: getErrorMessage(err),
      color: 'error'
    })
  } finally {
    submitting.value = false
  }
}

// --- Paso 2 (opcional): nombre y apellido ---
const details = reactive({ firstName: '', lastName: '' })
const savingDetails = ref(false)
const detailsSaved = ref(false)

async function onSaveDetails(event: FormSubmitEvent<AccreditationEntryDetailsInput>) {
  if (!entryId.value) return
  savingDetails.value = true
  try {
    await $fetch(`/api/accreditations/${publicId.value}/entries/${entryId.value}`, {
      method: 'PATCH',
      body: event.data
    })
    detailsSaved.value = true
    toast.add({ title: '¡Gracias! Guardamos tus datos', color: 'success' })
  } catch (err) {
    toast.add({
      title: 'No pudimos guardar tus datos',
      description: getErrorMessage(err),
      color: 'error'
    })
  } finally {
    savingDetails.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="flex justify-end p-4">
      <UColorModeButton color="primary" />
    </header>

    <main class="flex-1 flex flex-col items-center justify-center gap-8 px-4 pb-10">
      <div class="w-full max-w-lg">
        <UPageCard
          v-if="error || !accreditation"
          variant="subtle"
          class="text-center"
        >
          <div class="flex flex-col items-center gap-4 py-6">
            <UIcon
              name="lucide:circle-x"
              class="size-12 text-error"
            />
            <h1 class="text-2xl font-semibold text-highlighted">
              Acreditación no disponible
            </h1>
            <p class="text-toned max-w-md">
              El código de acreditación no es válido o ya no está disponible. Verificá el enlace o consultá con la organización del evento.
            </p>
          </div>
        </UPageCard>

        <UPageCard
          v-else-if="accreditation.state === 'scheduled'"
          variant="subtle"
          class="text-center"
        >
          <div class="flex flex-col items-center gap-4 py-6">
            <UIcon
              name="lucide:clock"
              class="size-12 text-primary"
            />
            <h1 class="text-2xl font-semibold text-highlighted">
              La acreditación todavía no está abierta
            </h1>
            <p class="text-toned max-w-md">
              {{ accreditation.formTitle }}
            </p>
            <p class="text-muted text-sm">
              Volvé a escanear el código cuando comience la acreditación.
            </p>
          </div>
        </UPageCard>

        <UPageCard
          v-else-if="accreditation.state === 'closed'"
          variant="subtle"
          class="text-center"
        >
          <div class="flex flex-col items-center gap-4 py-6">
            <UIcon
              name="lucide:circle-x"
              class="size-12 text-muted"
            />
            <h1 class="text-2xl font-semibold text-highlighted">
              La acreditación está cerrada
            </h1>
            <p class="text-toned max-w-md">
              El período de acreditación para «{{ accreditation.formTitle }}» ya finalizó.
            </p>
          </div>
        </UPageCard>

        <UPageCard
          v-else-if="done"
          variant="subtle"
        >
          <div class="flex flex-col items-center gap-4 py-6 text-center">
            <UIcon
              name="lucide:circle-check"
              class="size-12 text-success"
            />
            <h1 class="text-2xl font-semibold text-highlighted">
              ¡Acreditación registrada!
            </h1>
            <p class="text-toned max-w-md">
              Registramos tu ingreso a «{{ accreditation.formTitle }}». ¡Gracias por participar!
            </p>
          </div>

          <template v-if="!detailsSaved">
            <USeparator label="Opcional" />
            <div class="pt-4">
              <p class="text-sm text-toned text-center mb-4">
                Si querés, completá tu nombre y apellido para ayudar a la organización.
              </p>
              <UForm
                :schema="AccreditationEntryDetailsSchema"
                :state="details"
                class="space-y-4"
                @submit="onSaveDetails"
              >
                <div class="grid gap-4 sm:grid-cols-2">
                  <UFormField
                    label="Nombre"
                    name="firstName"
                  >
                    <UInput
                      v-model="details.firstName"
                      placeholder="Opcional"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField
                    label="Apellido"
                    name="lastName"
                  >
                    <UInput
                      v-model="details.lastName"
                      placeholder="Opcional"
                      class="w-full"
                    />
                  </UFormField>
                </div>
                <UButton
                  type="submit"
                  label="Guardar mis datos"
                  color="neutral"
                  variant="subtle"
                  block
                  :loading="savingDetails"
                />
              </UForm>
            </div>
          </template>

          <p
            v-else
            class="text-sm text-success text-center py-2"
          >
            ¡Listo! Guardamos tus datos.
          </p>

          <div class="pt-6">
            <UButton
              to="/"
              label="Ir al inicio"
              icon="lucide:home"
              block
            />
          </div>
        </UPageCard>

        <UPageCard
          v-else
          variant="subtle"
        >
          <div class="space-y-1 mb-6">
            <p class="text-sm text-muted uppercase tracking-wide">
              Acreditación
            </p>
            <h1 class="text-xl font-semibold text-highlighted">
              {{ accreditation.formTitle }}
            </h1>
            <p class="text-sm text-toned">
              {{ accreditation.venueName }} — {{ accreditation.venueCity }}, {{ accreditation.venueProvince }}
            </p>
          </div>

          <UForm
            :schema="AccreditationEntrySchema"
            :state="state"
            class="space-y-6"
            @submit="onSubmit"
          >
            <UFormField
              label="DNI"
              name="dni"
              required
              size="xl"
            >
              <UInput
                v-model="state.dni"
                placeholder="Ingresá tu DNI"
                inputmode="numeric"
                autofocus
                class="w-full"
              />
            </UFormField>

            <UButton
              type="submit"
              label="Confirmar acreditación"
              size="xl"
              block
              :loading="submitting"
            />
          </UForm>
        </UPageCard>
      </div>

      <NuxtLink
        to="/"
        aria-label="Ir al inicio"
      >
        <img
          :src="LOGO_URL"
          alt="Logo"
          class="h-10 w-auto"
        >
      </NuxtLink>
    </main>
  </div>
</template>
