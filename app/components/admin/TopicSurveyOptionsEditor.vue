<script setup lang="ts">
interface SurveyOption {
  id: number
  topicId: number
  label: string
  description: string | null
  displayOrder: number
  isActive: boolean
  createdAt: string
}

const props = defineProps<{
  consultationSlug: string
  topicSlug: string
  locked: boolean
}>()

const emit = defineEmits<{ changed: [] }>()

const toast = useToast()

const basePath = computed(() => `/api/consultations/${props.consultationSlug}/topics/${props.topicSlug}/survey-options`)

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()
const { data: options, status, refresh } = useAsyncData(
  () => `topic-survey-options-${props.consultationSlug}-${props.topicSlug}`,
  () => requestFetch<SurveyOption[]>(basePath.value),
  { watch: [() => props.topicSlug] }
)

const optionList = computed(() => options.value ?? [])
const activeCount = computed(() => optionList.value.filter(option => option.isActive).length)

// Alta de una nueva opción.
const newLabel = ref('')
const newDescription = ref('')
const adding = ref(false)

async function addOption() {
  const label = newLabel.value.trim()
  if (!label) return
  adding.value = true
  try {
    await $fetch(basePath.value, {
      method: 'POST',
      body: { label, description: newDescription.value.trim() || null, displayOrder: 0 }
    })
    newLabel.value = ''
    newDescription.value = ''
    await refresh()
    emit('changed')
  } catch (err) {
    notifyError(err, 'No se pudo agregar la opción')
  } finally {
    adding.value = false
  }
}

// Edición en línea de una opción.
const editingId = ref<number | null>(null)
const editLabel = ref('')
const editDescription = ref('')
const savingEdit = ref(false)

function startEdit(option: SurveyOption) {
  editingId.value = option.id
  editLabel.value = option.label
  editDescription.value = option.description ?? ''
}

function cancelEdit() {
  editingId.value = null
}

async function saveEdit(option: SurveyOption) {
  const label = editLabel.value.trim()
  if (!label) return
  savingEdit.value = true
  try {
    await $fetch(`/api/survey-options/${option.id}`, {
      method: 'PUT',
      body: {
        label,
        description: editDescription.value.trim() || null,
        displayOrder: option.displayOrder,
        isActive: option.isActive
      }
    })
    editingId.value = null
    await refresh()
    emit('changed')
  } catch (err) {
    notifyError(err, 'No se pudo guardar la opción')
  } finally {
    savingEdit.value = false
  }
}

// Activar / desactivar una opción (permitido incluso con la configuración bloqueada).
const togglingId = ref<number | null>(null)

async function toggleActive(option: SurveyOption) {
  togglingId.value = option.id
  try {
    await $fetch(`/api/survey-options/${option.id}`, {
      method: 'PUT',
      body: {
        label: option.label,
        description: option.description,
        displayOrder: option.displayOrder,
        isActive: !option.isActive
      }
    })
    await refresh()
    emit('changed')
  } catch (err) {
    notifyError(err, 'No se pudo actualizar la opción')
  } finally {
    togglingId.value = null
  }
}

// Eliminación de una opción (con confirmación).
const deleteTarget = ref<SurveyOption | null>(null)
const deleting = ref(false)

async function performDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch(`/api/survey-options/${deleteTarget.value.id}`, { method: 'DELETE' })
    deleteTarget.value = null
    await refresh()
    emit('changed')
  } catch (err) {
    notifyError(err, 'No se pudo eliminar la opción')
  } finally {
    deleting.value = false
  }
}

function notifyError(err: unknown, title: string) {
  const e = err as { data?: { message?: string }, message?: string }
  toast.add({
    title,
    description: e.data?.message || e.message || 'Ocurrió un error inesperado.',
    color: 'error'
  })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-2">
      <p class="text-sm font-medium">
        Opciones de la encuesta
      </p>
      <UBadge
        :label="`${activeCount} ${activeCount === 1 ? 'activa' : 'activas'}`"
        :color="activeCount >= 2 ? 'success' : 'warning'"
        variant="subtle"
      />
    </div>

    <UAlert
      v-if="activeCount < 2"
      icon="i-lucide-info"
      color="warning"
      variant="subtle"
      title="La encuesta necesita al menos 2 opciones activas"
      description="Hasta entonces no vas a poder publicar el tema con este método."
    />

    <p
      v-if="status === 'pending'"
      class="text-sm text-muted"
    >
      Cargando opciones...
    </p>

    <ul
      v-else-if="optionList.length"
      class="space-y-2"
    >
      <li
        v-for="option in optionList"
        :key="option.id"
        class="rounded-lg border border-default p-3"
      >
        <div
          v-if="editingId === option.id"
          class="space-y-2"
        >
          <UInput
            v-model="editLabel"
            placeholder="Etiqueta de la opción"
            class="w-full"
          />
          <UTextarea
            v-model="editDescription"
            :rows="2"
            placeholder="Descripción (opcional)"
            class="w-full"
          />
          <div class="flex justify-end gap-2">
            <UButton
              label="Cancelar"
              color="neutral"
              variant="ghost"
              size="sm"
              :disabled="savingEdit"
              @click="cancelEdit"
            />
            <UButton
              label="Guardar"
              icon="i-lucide-check"
              size="sm"
              :loading="savingEdit"
              @click="saveEdit(option)"
            />
          </div>
        </div>

        <div
          v-else
          class="flex items-start gap-3"
        >
          <USwitch
            :model-value="option.isActive"
            :loading="togglingId === option.id"
            :aria-label="option.isActive ? 'Desactivar opción' : 'Activar opción'"
            @update:model-value="toggleActive(option)"
          />
          <div class="min-w-0 flex-1">
            <p
              class="text-sm font-medium"
              :class="{ 'text-muted line-through': !option.isActive }"
            >
              {{ option.label }}
            </p>
            <p
              v-if="option.description"
              class="text-xs text-muted"
            >
              {{ option.description }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <UButton
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              size="xs"
              aria-label="Editar opción"
              @click="startEdit(option)"
            />
            <UButton
              v-if="!props.locked"
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="xs"
              aria-label="Eliminar opción"
              @click="() => { deleteTarget = option }"
            />
          </div>
        </div>
      </li>
    </ul>

    <p
      v-else
      class="text-sm text-muted"
    >
      Todavía no hay opciones cargadas.
    </p>

    <div
      v-if="!props.locked"
      class="space-y-2 rounded-lg border border-dashed border-default p-3"
    >
      <UInput
        v-model="newLabel"
        placeholder="Nueva opción (etiqueta)"
        class="w-full"
        @keydown.enter.prevent="addOption"
      />
      <UTextarea
        v-model="newDescription"
        :rows="2"
        placeholder="Descripción (opcional)"
        class="w-full"
      />
      <div class="flex justify-end">
        <UButton
          label="Agregar opción"
          icon="i-lucide-plus"
          size="sm"
          :loading="adding"
          :disabled="!newLabel.trim()"
          @click="addOption"
        />
      </div>
    </div>

    <UModal
      :open="deleteTarget !== null"
      title="Eliminar opción"
      @update:open="(value) => { if (!value) deleteTarget = null }"
    >
      <template #body>
        <p class="text-sm">
          ¿Seguro que querés eliminar la opción
          <span class="font-medium">«{{ deleteTarget?.label }}»</span>?
          Esta acción no se puede deshacer.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            label="Cancelar"
            color="neutral"
            variant="ghost"
            :disabled="deleting"
            @click="() => { deleteTarget = null }"
          />
          <UButton
            label="Eliminar"
            color="error"
            icon="i-lucide-trash-2"
            :loading="deleting"
            @click="performDelete"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
