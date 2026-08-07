<script setup lang="ts">
import type { Form, FormSubmitEvent } from '@nuxt/ui'
import { UpdateSectionSchema, type UpdateSectionInput } from '#shared/schemas/taxonomy'

export interface AdminSection {
  id: number
  slug: string
  name: string
  description: string | null
  isActive: boolean
  displayOrder: number
}

const props = defineProps<{
  open: boolean
  initialValues: AdminSection | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const toast = useToast()
const formId = useId()
const formRef = ref<Form<UpdateSectionInput>>()

const saving = ref(false)

interface SectionFormState {
  name: string
  description: string
  isActive: boolean
  displayOrder: number
}

const state = reactive<SectionFormState>({
  name: '',
  description: '',
  isActive: true,
  displayOrder: 0
})

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const activeDescription = computed(() =>
  state.isActive
    ? 'El tipo de consulta se muestra en la plataforma.'
    : 'El tipo de consulta queda oculto en la plataforma.'
)

function hydrate() {
  const values = props.initialValues
  state.name = values?.name ?? ''
  state.description = values?.description ?? ''
  state.isActive = values?.isActive ?? true
  state.displayOrder = values?.displayOrder ?? 0
  formRef.value?.clear()
}

watch(() => props.open, (open) => {
  if (open) hydrate()
})

async function onSubmit(event: FormSubmitEvent<UpdateSectionInput>) {
  if (!props.initialValues) return

  saving.value = true
  const data = event.data
  const id = props.initialValues.id

  try {
    await $fetch(`/api/sections/${id}`, {
      method: 'PUT',
      body: {
        name: data.name,
        description: data.description || null
      }
    })

    await $fetch(`/api/sections/${id}`, {
      method: 'PATCH',
      body: {
        isActive: state.isActive,
        displayOrder: state.displayOrder
      }
    })

    toast.add({
      title: 'Tipo de consulta actualizado',
      color: 'success'
    })

    isOpen.value = false
    emit('saved')
  } catch (error) {
    if (!applyServerErrors(formRef.value, error)) {
      toast.add({
        title: 'No se pudo guardar',
        description: getErrorMessage(error),
        color: 'error'
      })
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    title="Editar tipo de consulta"
    description="Solo podés ajustar cómo se presenta: el catálogo de tipos es fijo."
    :dismissible="!saving"
    :ui="{ content: 'max-w-xl' }"
  >
    <template #body>
      <UForm
        :id="formId"
        ref="formRef"
        :schema="UpdateSectionSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Identificador (URL)"
          help="Define la estructura que habilita el tipo de consulta. No se puede modificar."
        >
          <UInput
            :model-value="initialValues?.slug ?? ''"
            disabled
            class="w-full font-mono"
          />
        </UFormField>

        <UFormField
          label="Nombre"
          name="name"
          required
        >
          <UInput
            v-model="state.name"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Orden"
          name="displayOrder"
          help="Menor número aparece primero."
        >
          <UInput
            v-model.number="state.displayOrder"
            type="number"
            :min="0"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Descripción"
          name="description"
        >
          <UTextarea
            v-model="state.description"
            :rows="3"
            class="w-full"
          />
        </UFormField>

        <USwitch
          v-model="state.isActive"
          label="Mostrado en la plataforma"
          :description="activeDescription"
        />
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-3">
        <UButton
          label="Cancelar"
          color="neutral"
          variant="ghost"
          :disabled="saving"
          @click="isOpen = false"
        />
        <UButton
          type="submit"
          :form="formId"
          label="Guardar cambios"
          icon="i-lucide-save"
          :loading="saving"
        />
      </div>
    </template>
  </USlideover>
</template>
