<script setup lang="ts">
import type { AdminRegionalMeetingSubmissionDTO } from '~~/server/utils/serializers/regionalMeetingSubmission'

defineOptions({ name: 'EncuentrosRegionalesSubmissionSlideover' })

const props = defineProps<{
  open: boolean
  submission: AdminRegionalMeetingSubmissionDTO | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const fullName = computed(() => {
  const s = props.submission
  if (!s) return ''
  return `${s.firstName} ${s.lastName}`.trim()
})

const ejeCompleto = computed(() => {
  const s = props.submission
  if (!s) return '—'
  return s.subejeTematico ? `${s.ejeTematico} · ${s.subejeTematico}` : s.ejeTematico
})
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    title="Detalle del aporte"
    description="Datos enviados desde el formulario público de Encuentros Regionales."
  >
    <template #body>
      <div
        v-if="submission"
        class="space-y-6"
      >
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-highlighted">
            Persona
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
                Correo electrónico
              </dt>
              <dd class="text-highlighted">
                <ULink :to="`mailto:${submission.email}`">
                  {{ submission.email }}
                </ULink>
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-muted">
                Teléfono
              </dt>
              <dd class="text-highlighted">
                {{ submission.phone }}
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-muted">
                Ubicación
              </dt>
              <dd class="text-highlighted">
                {{ submission.municipio ? `${submission.municipio}, ` : '' }}{{ submission.provincia }}
              </dd>
            </div>
            <div
              v-if="submission.organization"
              class="flex flex-col"
            >
              <dt class="text-muted">
                Institución u organización
              </dt>
              <dd class="text-highlighted">
                {{ submission.organization }}
              </dd>
            </div>
          </dl>
        </div>

        <USeparator />

        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-highlighted">
            Aporte
          </h3>
          <dl class="space-y-2 text-sm">
            <div class="flex flex-col">
              <dt class="text-muted">
                Eje temático
              </dt>
              <dd class="text-highlighted">
                {{ ejeCompleto }}
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-muted">
                Idea y/o proyecto
              </dt>
              <dd class="text-highlighted whitespace-pre-wrap">
                {{ submission.ideaProyecto || '—' }}
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-muted">
                Comentarios / aportes adicionales
              </dt>
              <dd class="text-highlighted whitespace-pre-wrap">
                {{ submission.comentarios || '—' }}
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-muted">
                Enlaces
              </dt>
              <dd class="text-highlighted">
                <ul
                  v-if="submission.links.length"
                  class="space-y-1"
                >
                  <li
                    v-for="link in submission.links"
                    :key="link.id"
                    class="flex flex-col"
                  >
                    <span
                      v-if="link.title"
                      class="text-xs text-muted"
                    >
                      {{ link.title }}
                    </span>
                    <ULink
                      :to="link.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="break-all"
                    >
                      {{ link.url }}
                    </ULink>
                  </li>
                </ul>
                <span v-else>—</span>
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-muted">
                Archivo adjunto
              </dt>
              <dd class="text-highlighted">
                <UButton
                  v-if="submission.attachment"
                  :to="`/api/regional-meetings/submissions/${submission.id}/attachment`"
                  external
                  :label="submission.attachment.filename || 'Descargar adjunto'"
                  icon="lucide:download"
                  color="neutral"
                  variant="subtle"
                  size="sm"
                />
                <span v-else>—</span>
              </dd>
            </div>
          </dl>
        </div>

        <USeparator />

        <p class="text-xs text-muted">
          Recibido el {{ formatDateLong(submission.createdAt) }}
        </p>
      </div>
    </template>
  </USlideover>
</template>
