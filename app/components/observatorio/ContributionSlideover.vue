<script setup lang="ts">
import type { AdminObservatoryContributionDTO } from '~~/server/utils/serializers/observatoryContribution'

defineOptions({ name: 'ObservatorioContributionSlideover' })

const props = defineProps<{
  open: boolean
  contribution: AdminObservatoryContributionDTO | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const fullName = computed(() => {
  const c = props.contribution
  if (!c) return ''
  return `${c.firstName} ${c.lastName}`.trim()
})
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    title="Detalle del aporte"
    description="Datos enviados desde el formulario público del Observatorio."
  >
    <template #body>
      <div
        v-if="contribution"
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
                <ULink :to="`mailto:${contribution.email}`">
                  {{ contribution.email }}
                </ULink>
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-muted">
                Teléfono
              </dt>
              <dd class="text-highlighted">
                {{ contribution.phone }}
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-muted">
                Ubicación
              </dt>
              <dd class="text-highlighted">
                {{ contribution.municipio ? `${contribution.municipio}, ` : '' }}{{ contribution.provincia }}
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-muted">
                Institución
              </dt>
              <dd class="text-highlighted">
                {{ contribution.institutionName }}
                <span class="block text-xs text-muted">{{ contribution.institutionCategoryName }}</span>
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
                Ejes de trabajo
              </dt>
              <dd class="text-highlighted">
                {{ contribution.workGroups.map(group => group.name).join(', ') }}
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-muted">
                Descripción
              </dt>
              <dd class="text-highlighted whitespace-pre-wrap">
                {{ contribution.description || '—' }}
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-muted">
                Enlaces
              </dt>
              <dd class="text-highlighted">
                <ul
                  v-if="contribution.links.length"
                  class="space-y-1"
                >
                  <li
                    v-for="link in contribution.links"
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
                  v-if="contribution.attachment"
                  :to="`/api/observatory-contributions/${contribution.id}/attachment`"
                  external
                  :label="contribution.attachment.filename || 'Descargar adjunto'"
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
          Recibido el {{ formatDateLong(contribution.createdAt) }}
        </p>
      </div>
    </template>
  </USlideover>
</template>
