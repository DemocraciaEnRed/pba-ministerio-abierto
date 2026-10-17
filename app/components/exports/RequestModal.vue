<script setup lang="ts">
import type { DataExport, DataExportRequest } from '~/types/exports'

const props = defineProps<{
  request: DataExportRequest
  /** Aclaración opcional sobre qué incluye el archivo. */
  detail?: string
}>()

const emit = defineEmits<{
  close: [value: DataExport | null]
}>()

const MY_EXPORTS_PATH = '/mi-cuenta/exportaciones'

const step = ref<'confirm' | 'done'>('confirm')
const submitting = ref(false)
const errorMessage = ref<string | null>(null)
const created = ref<DataExport | null>(null)
const version = useDataExportsVersion()

const kindLabel = computed(() => DATA_EXPORT_KIND_LABELS[props.request.kind])
const filterChips = computed(() => dataExportFiltersSummary(props.request.filters ?? {}))

async function confirm(): Promise<void> {
  submitting.value = true
  errorMessage.value = null
  try {
    created.value = await $fetch<DataExport>('/api/exports', { method: 'POST', body: props.request })
    version.value += 1
    step.value = 'done'
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    submitting.value = false
  }
}

function close(): void {
  emit('close', created.value)
}

async function goToMyExports(): Promise<void> {
  close()
  await navigateTo(MY_EXPORTS_PATH)
}
</script>

<template>
  <UModal
    :title="step === 'confirm' ? 'Confirmar exportación' : 'Estamos generando tu exportación'"
    :description="step === 'confirm'
      ? kindLabel
      : 'El archivo se está preparando en segundo plano.'"
    :dismissible="!submitting"
    :close="!submitting"
    @update:open="value => { if (!value) close() }"
  >
    <template #body>
      <div
        v-if="step === 'confirm'"
        class="space-y-4"
      >
        <p
          v-if="detail"
          class="text-sm text-muted"
        >
          {{ detail }}
        </p>

        <div
          v-if="filterChips.length > 0"
          class="space-y-1.5"
        >
          <p class="text-xs font-medium text-muted">
            Filtros aplicados
          </p>
          <div class="flex flex-wrap gap-1.5">
            <UBadge
              v-for="chip in filterChips"
              :key="chip"
              :label="chip"
              color="neutral"
              variant="subtle"
            />
          </div>
        </div>

        <UAlert
          icon="i-lucide-shield-alert"
          color="warning"
          variant="subtle"
          title="La exportación queda registrada"
          description="Puede contener datos personales. Vas a poder descargarla desde Mi cuenta, y también la van a poder ver y descargar las personas que administran la plataforma."
        />

        <UAlert
          v-if="errorMessage"
          icon="i-lucide-circle-x"
          color="error"
          variant="subtle"
          title="No se pudo pedir la exportación"
          :description="errorMessage"
        />
      </div>

      <div
        v-else
        class="flex items-start gap-3"
      >
        <UIcon
          name="i-lucide-file-clock"
          class="size-8 shrink-0 text-primary"
        />
        <div class="space-y-2 text-sm">
          <p>
            Cuando esté lista, vas a poder descargarla desde
            <strong>Mi cuenta → Mis exportaciones</strong>. Si tiene muchas filas, se divide en partes.
          </p>
          <p class="text-muted">
            Podés cerrar este mensaje y seguir trabajando.
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-3">
        <template v-if="step === 'confirm'">
          <UButton
            label="Cancelar"
            color="neutral"
            variant="ghost"
            :disabled="submitting"
            @click="close"
          />
          <UButton
            label="Exportar"
            icon="i-lucide-file-down"
            :loading="submitting"
            @click="confirm"
          />
        </template>
        <template v-else>
          <UButton
            label="Cerrar"
            color="neutral"
            variant="ghost"
            @click="close"
          />
          <UButton
            label="Ir a Mis exportaciones"
            trailing-icon="i-lucide-arrow-right"
            @click="goToMyExports"
          />
        </template>
      </div>
    </template>
  </UModal>
</template>
