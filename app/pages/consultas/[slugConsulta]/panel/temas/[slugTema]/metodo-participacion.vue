<script setup lang="ts">
import type { RadioGroupItem } from '@nuxt/ui'

definePageMeta({
  layout: 'tema-consulta-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Método de participación')

type MechanismType = 'support' | 'vote' | 'survey'
type MechanismChoice = 'none' | MechanismType

const toast = useToast()
const { consultationSlug, topicSlug, data: topic, status, error, refresh } = useTopicAdmin()

const isLocked = computed(() =>
  Boolean(topic.value) && (topic.value!.visibility !== 'hidden' || topic.value!.configLockedAt !== null)
)
const lockedByVisibility = computed(() => Boolean(topic.value) && topic.value!.visibility !== 'hidden')
const lockedByFlag = computed(() =>
  Boolean(topic.value) && topic.value!.visibility === 'hidden' && topic.value!.configLockedAt !== null
)

const visibilityLabels: Record<string, string> = {
  hidden: 'Oculto',
  visible: 'Visible',
  archived: 'Archivado'
}

// Selección de mecanismo (se aplica con un botón, no en vivo).
const mechanismOptions = [
  { label: 'Sin método', value: 'none', description: 'Tema informativo: solo lectura y comentarios.' },
  { label: 'Apoyo', value: 'support', description: 'Un botón de adhesión simple.' },
  { label: 'Votación', value: 'vote', description: 'A favor, abstención o en contra.' },
  { label: 'Encuesta', value: 'survey', description: 'Opciones de elección múltiple (se definen abajo).' }
] satisfies (RadioGroupItem & { value: MechanismChoice })[]

function toChoice(mechanism: MechanismType | null): MechanismChoice {
  return mechanism ?? 'none'
}
function toMechanism(choice: MechanismChoice): MechanismType | null {
  return choice === 'none' ? null : choice
}

const selectedChoice = ref<MechanismChoice>('none')

watch(topic, (value) => {
  if (value) {
    selectedChoice.value = toChoice(value.mechanismType)
  }
}, { immediate: true })

const mechanismChanged = computed(() =>
  Boolean(topic.value) && toMechanism(selectedChoice.value) !== topic.value!.mechanismType
)

const confirmMechanismOpen = ref(false)
const savingMechanism = ref(false)

const leavingSurvey = computed(() =>
  topic.value?.mechanismType === 'survey' && selectedChoice.value !== 'survey'
)

async function applyMechanism() {
  savingMechanism.value = true
  try {
    await $fetch(`/api/consultations/${consultationSlug.value}/topics/${topicSlug.value}/mechanism`, {
      method: 'POST',
      body: { mechanismType: toMechanism(selectedChoice.value) }
    })
    confirmMechanismOpen.value = false
    toast.add({ title: 'Método actualizado', color: 'success' })
    await refresh()
  } catch (err) {
    notifyError(err, 'No se pudo cambiar el método')
  } finally {
    savingMechanism.value = false
  }
}

// Cerrar / reabrir la configuración.
const confirmLockOpen = ref(false)
const savingLock = ref(false)

async function setConfigLock(locked: boolean) {
  savingLock.value = true
  try {
    await $fetch(`/api/consultations/${consultationSlug.value}/topics/${topicSlug.value}/config-lock`, {
      method: 'POST',
      body: { locked }
    })
    confirmLockOpen.value = false
    toast.add({
      title: locked ? 'Configuración cerrada' : 'Configuración reabierta',
      color: 'success'
    })
    await refresh()
  } catch (err) {
    notifyError(err, 'No se pudo cambiar el bloqueo de la configuración')
  } finally {
    savingLock.value = false
  }
}

// Configuración específica del método (voto: abstención; encuesta: selección).
const savingMechanismConfig = ref(false)

async function saveMechanismConfig(payload: Record<string, unknown>) {
  savingMechanismConfig.value = true
  try {
    await $fetch(`/api/consultations/${consultationSlug.value}/topics/${topicSlug.value}/mechanism-config`, {
      method: 'POST',
      body: payload
    })
    toast.add({ title: 'Configuración actualizada', color: 'success' })
    await refresh()
  } catch (err) {
    notifyError(err, 'No se pudo actualizar la configuración')
  } finally {
    savingMechanismConfig.value = false
  }
}

// Consigna del tema (propia del mecanismo).
const questionText = ref('')
watch(topic, (value) => {
  if (value) {
    questionText.value = value.questionText ?? ''
  }
}, { immediate: true })

const questionTextChanged = computed(() =>
  Boolean(topic.value) && (questionText.value.trim() || null) !== (topic.value!.questionText ?? null)
)

function saveQuestionText() {
  saveMechanismConfig({ questionText: questionText.value.trim() || null })
}

// Voto: abstención.
const voteAllowAbstain = ref(true)
watch(topic, (value) => {
  if (value) {
    voteAllowAbstain.value = value.voteAllowAbstain
  }
}, { immediate: true })

function toggleAbstain(value: boolean) {
  voteAllowAbstain.value = value
  saveMechanismConfig({ voteAllowAbstain: value })
}

// Encuesta: selección única/múltiple + mín/máx.
const allowMultiple = ref(false)
const minSelections = ref(1)
const maxSelections = ref<number | null>(null)

watch(topic, (value) => {
  if (!value) return
  allowMultiple.value = value.surveyMaxSelections === null || value.surveyMaxSelections > 1
  minSelections.value = value.surveyMinSelections
  maxSelections.value = value.surveyMaxSelections
}, { immediate: true })

function onToggleMultiple(value: boolean) {
  allowMultiple.value = value
  if (!value) {
    minSelections.value = 1
    maxSelections.value = 1
  } else if (maxSelections.value === 1) {
    maxSelections.value = null
  }
}

function surveyRulesPayload() {
  if (!allowMultiple.value) {
    return { surveyMinSelections: 1, surveyMaxSelections: 1 }
  }
  const rawMax = maxSelections.value
  const max = rawMax == null || String(rawMax).trim() === '' ? null : Number(rawMax)
  const min = Math.max(1, Number(minSelections.value) || 1)
  return { surveyMinSelections: min, surveyMaxSelections: max }
}

const surveyRulesChanged = computed(() => {
  if (!topic.value) return false
  const payload = surveyRulesPayload()
  return payload.surveyMinSelections !== topic.value.surveyMinSelections
    || payload.surveyMaxSelections !== topic.value.surveyMaxSelections
})

async function saveSurveyRules() {
  await saveMechanismConfig(surveyRulesPayload())
}

function notifyError(err: unknown, title: string) {
  const e = err as { data?: { message?: string, data?: { message?: string }[] }, message?: string }
  const fieldMessage = Array.isArray(e.data?.data) ? e.data?.data?.[0]?.message : undefined
  toast.add({
    title,
    description: fieldMessage || e.data?.message || e.message || 'Ocurrió un error inesperado.',
    color: 'error'
  })
}
</script>

<template>
  <UPage>
    <UPageHeader
      title="Método de participación"
      description="Elegí cómo participa la ciudadanía en este tema y fijá la configuración cuando esté lista."
    />

    <UPageBody class="space-y-6">
      <p
        v-if="status === 'pending'"
        class="text-sm text-muted"
      >
        Cargando tema...
      </p>

      <UPageCard
        v-else-if="error || !topic"
        class="space-y-2"
      >
        <p class="font-medium">
          No encontramos el tema.
        </p>
        <UButton
          :to="`/consultas/${consultationSlug}/panel/temas`"
          label="Volver a temas"
          color="neutral"
          variant="ghost"
        />
      </UPageCard>

      <template v-else>
        <UAlert
          v-if="isLocked"
          icon="i-lucide-lock"
          color="neutral"
          variant="subtle"
          title="Configuración fija"
          :description="lockedByVisibility
            ? `El método quedó fijo porque el tema está «${visibilityLabels[topic.visibility]}». Se preserva así la integridad de la participación.`
            : 'La configuración fue cerrada. Podés reabrirla mientras el tema siga oculto y sin participación.'"
        />

        <UPageCard
          title="Método de participación"
          description="Definí el mecanismo con el que la ciudadanía participa en este tema."
        >
          <div class="space-y-4">
            <URadioGroup
              v-model="selectedChoice"
              color="primary"
              variant="table"
              :items="mechanismOptions"
              value-key="value"
              :disabled="isLocked"
            />

            <div
              v-if="!isLocked"
              class="flex justify-end"
            >
              <UButton
                label="Aplicar método"
                icon="i-lucide-save"
                :disabled="!mechanismChanged"
                @click="() => { confirmMechanismOpen = true }"
              />
            </div>
          </div>
        </UPageCard>

        <UPageCard
          v-if="topic.mechanismType"
          title="Consigna del tema"
          description="La pregunta o consigna que orienta la participación. Es propia del método elegido."
        >
          <div class="space-y-4">
            <UFormField
              label="Pregunta o consigna"
              description="Texto que ve la ciudadanía al participar en este tema."
            >
              <UTextarea
                v-model="questionText"
                :rows="2"
                :disabled="isLocked || savingMechanismConfig"
                placeholder="Ej.: ¿Estás de acuerdo con ampliar la ciclovía en este tramo?"
                class="w-full"
              />
            </UFormField>

            <div
              v-if="!isLocked"
              class="flex justify-end"
            >
              <UButton
                label="Guardar consigna"
                icon="i-lucide-save"
                :disabled="!questionTextChanged"
                :loading="savingMechanismConfig"
                @click="saveQuestionText"
              />
            </div>
          </div>
        </UPageCard>

        <UPageCard
          v-if="topic.mechanismType === 'vote'"
          title="Opciones de voto"
          description="Ajustes del mecanismo de votación."
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-sm font-medium">
                Permitir abstención
              </p>
              <p class="text-xs text-muted">
                Si lo desactivás, el voto es binario: a favor o en contra.
              </p>
            </div>
            <USwitch
              :model-value="voteAllowAbstain"
              :disabled="isLocked || savingMechanismConfig"
              @update:model-value="toggleAbstain"
            />
          </div>
        </UPageCard>

        <UPageCard
          v-if="topic.mechanismType === 'survey'"
          title="Reglas de selección"
          description="Cuántas opciones puede elegir la ciudadanía en la encuesta."
        >
          <div class="space-y-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-medium">
                  Permitir selección múltiple
                </p>
                <p class="text-xs text-muted">
                  Si está activo, se puede elegir más de una opción.
                </p>
              </div>
              <USwitch
                :model-value="allowMultiple"
                :disabled="isLocked"
                @update:model-value="onToggleMultiple"
              />
            </div>

            <div
              v-if="allowMultiple"
              class="grid gap-4 sm:grid-cols-2"
            >
              <UFormField
                label="Mínimo de opciones"
                description="Al menos cuántas debe elegir."
              >
                <UInput
                  v-model.number="minSelections"
                  type="number"
                  :min="1"
                  :disabled="isLocked"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Máximo de opciones"
                description="Dejá vacío para no poner límite."
              >
                <UInput
                  v-model.number="maxSelections"
                  type="number"
                  :min="1"
                  placeholder="Sin límite"
                  :disabled="isLocked"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div
              v-if="!isLocked"
              class="flex justify-end"
            >
              <UButton
                label="Guardar reglas"
                icon="i-lucide-save"
                :disabled="!surveyRulesChanged"
                :loading="savingMechanismConfig"
                @click="saveSurveyRules"
              />
            </div>
          </div>
        </UPageCard>

        <UPageCard
          v-if="topic.mechanismType === 'survey'"
          title="Opciones de la encuesta"
          description="Las respuestas entre las que elige la ciudadanía."
        >
          <AdminTopicSurveyOptionsEditor
            :consultation-slug="consultationSlug"
            :topic-slug="topicSlug"
            :locked="isLocked"
            @changed="refresh"
          />
        </UPageCard>

        <UPageCard
          title="Bloqueo de la configuración"
          description="Al cerrar la configuración, el método y sus opciones quedan fijos. Publicar el tema también lo bloquea."
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <UIcon
                :name="isLocked ? 'i-lucide-lock' : 'i-lucide-lock-open'"
                class="text-muted"
              />
              <span class="text-sm">
                {{ isLocked ? 'La configuración está cerrada.' : 'La configuración está abierta a cambios.' }}
              </span>
            </div>

            <UButton
              v-if="!isLocked"
              label="Cerrar configuración"
              icon="i-lucide-lock"
              color="neutral"
              @click="() => { confirmLockOpen = true }"
            />
            <UButton
              v-else-if="lockedByFlag"
              label="Reabrir configuración"
              icon="i-lucide-lock-open"
              color="neutral"
              variant="subtle"
              :loading="savingLock"
              @click="setConfigLock(false)"
            />
          </div>
        </UPageCard>
      </template>
    </UPageBody>

    <UModal
      :open="confirmMechanismOpen"
      title="Cambiar método de participación"
      @update:open="(value) => { if (!value) confirmMechanismOpen = false }"
    >
      <template #body>
        <p class="text-sm">
          Vas a cambiar el método de participación de este tema.
        </p>
        <p
          v-if="leavingSurvey"
          class="mt-2 text-sm text-warning"
        >
          Se eliminarán las opciones de encuesta cargadas.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            label="Cancelar"
            color="neutral"
            variant="ghost"
            :disabled="savingMechanism"
            @click="() => { confirmMechanismOpen = false }"
          />
          <UButton
            label="Aplicar"
            icon="i-lucide-check"
            :loading="savingMechanism"
            @click="applyMechanism"
          />
        </div>
      </template>
    </UModal>

    <UModal
      :open="confirmLockOpen"
      title="Cerrar configuración"
      @update:open="(value) => { if (!value) confirmLockOpen = false }"
    >
      <template #body>
        <p class="text-sm">
          Al cerrar la configuración, el método y sus opciones quedan fijos.
          Vas a poder reabrirla solo si el tema sigue en borrador y sin participación.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            label="Cancelar"
            color="neutral"
            variant="ghost"
            :disabled="savingLock"
            @click="() => { confirmLockOpen = false }"
          />
          <UButton
            label="Cerrar configuración"
            icon="i-lucide-lock"
            color="neutral"
            :loading="savingLock"
            @click="setConfigLock(true)"
          />
        </div>
      </template>
    </UModal>
  </UPage>
</template>
