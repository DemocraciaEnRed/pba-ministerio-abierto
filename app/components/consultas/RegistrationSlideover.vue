<script setup lang="ts">
import type { AdminConsultationRegistrationDTO } from '~~/server/utils/serializers/consultationRegistration'
import {
  REGISTRATION_CHARACTER_LABELS,
  REGISTRATION_PARTICIPATION_MODE_LABELS
} from '#shared/data/consultation-registrations'

defineOptions({ name: 'ConsultasRegistrationSlideover' })

const props = defineProps<{
  open: boolean
  registration: AdminConsultationRegistrationDTO | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const fullName = computed(() => {
  const item = props.registration
  return item ? `${item.firstName} ${item.lastName}`.trim() : ''
})

const isLegalEntity = computed(() => props.registration?.character === 'legal_entity')

const hasPresentation = computed(() =>
  Boolean(props.registration?.presentationSummary || props.registration?.documentationDetail || props.registration?.questions.length)
)
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    title="Detalle de la inscripción"
    description="Datos enviados desde el formulario público de inscripción."
  >
    <template #body>
      <div
        v-if="registration"
        class="space-y-6"
      >
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-highlighted">
            Persona participante
          </h3>
          <dl class="space-y-2 text-sm">
            <div class="flex flex-col">
              <dt class="text-muted">
                Nombre y apellido
              </dt>
              <dd class="text-highlighted">
                {{ fullName }}
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-muted">
                DNI
              </dt>
              <dd class="text-highlighted">
                {{ registration.dni }}
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-muted">
                Correo electrónico
              </dt>
              <dd class="text-highlighted">
                <ULink :to="`mailto:${registration.email}`">
                  {{ registration.email }}
                </ULink>
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-muted">
                Teléfono
              </dt>
              <dd class="text-highlighted">
                {{ registration.phone }}
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-muted">
                Carácter en que participa
              </dt>
              <dd class="text-highlighted">
                {{ REGISTRATION_CHARACTER_LABELS[registration.character] }}
              </dd>
            </div>
            <div
              v-if="registration.participationMode"
              class="flex flex-col"
            >
              <dt class="text-muted">
                Forma de participación
              </dt>
              <dd class="text-highlighted">
                {{ REGISTRATION_PARTICIPATION_MODE_LABELS[registration.participationMode] }}
              </dd>
            </div>
          </dl>
        </div>

        <template v-if="isLegalEntity">
          <USeparator />
          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-highlighted">
              Persona jurídica representada
            </h3>
            <dl class="space-y-2 text-sm">
              <div class="flex flex-col">
                <dt class="text-muted">
                  Denominación / Razón social
                </dt>
                <dd class="text-highlighted">
                  {{ registration.entityName || '—' }}
                </dd>
              </div>
              <div class="flex flex-col">
                <dt class="text-muted">
                  Domicilio
                </dt>
                <dd class="text-highlighted">
                  {{ registration.entityAddress || '—' }}
                </dd>
              </div>
              <div class="flex flex-col">
                <dt class="text-muted">
                  Correo electrónico
                </dt>
                <dd class="text-highlighted">
                  {{ registration.entityEmail || '—' }}
                </dd>
              </div>
              <div class="flex flex-col">
                <dt class="text-muted">
                  Teléfono de contacto
                </dt>
                <dd class="text-highlighted">
                  {{ registration.entityPhone || '—' }}
                </dd>
              </div>
              <div class="flex flex-col">
                <dt class="text-muted">
                  Instrumento que acredita la personería
                </dt>
                <dd class="text-highlighted">
                  <UButton
                    v-if="registration.proof"
                    :label="registration.proof.filename || 'Descargar archivo'"
                    icon="lucide:download"
                    color="neutral"
                    variant="subtle"
                    size="xs"
                    :to="`/api/registrations/${registration.id}/attachment`"
                    external
                  />
                  <ULink
                    v-else-if="registration.proofUrl"
                    :to="registration.proofUrl"
                    target="_blank"
                    class="break-all"
                  >
                    {{ registration.proofUrl }}
                  </ULink>
                  <span v-else>—</span>
                </dd>
              </div>
            </dl>
          </div>
        </template>

        <template v-if="hasPresentation">
          <USeparator />
          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-highlighted">
              Exposición
            </h3>
            <dl class="space-y-2 text-sm">
              <div class="flex flex-col">
                <dt class="text-muted">
                  Descripción de la exposición
                </dt>
                <dd class="text-highlighted whitespace-pre-wrap">
                  {{ registration.presentationSummary || '—' }}
                </dd>
              </div>
              <div class="flex flex-col">
                <dt class="text-muted">
                  Documentación acompañada
                </dt>
                <dd class="text-highlighted whitespace-pre-wrap">
                  {{ registration.documentationDetail || '—' }}
                </dd>
              </div>
              <div
                v-if="registration.questions.length"
                class="flex flex-col"
              >
                <dt class="text-muted">
                  Preguntas
                </dt>
                <dd class="text-highlighted">
                  <ol class="list-decimal list-inside space-y-1">
                    <li
                      v-for="(question, index) in registration.questions"
                      :key="index"
                      class="whitespace-pre-wrap"
                    >
                      {{ question }}
                    </li>
                  </ol>
                </dd>
              </div>
            </dl>
          </div>
        </template>

        <USeparator />

        <p class="text-sm text-muted">
          Inscripción recibida el {{ formatDate(registration.createdAt) }}
        </p>
      </div>
    </template>
  </USlideover>
</template>
