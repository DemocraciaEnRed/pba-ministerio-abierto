<script setup lang="ts">
import type { Form, FormSubmitEvent } from '@nuxt/ui'
import { CreateSectionSchema, type CreateSectionInput } from '#shared/schemas/taxonomy'

export interface AdminSection {
  id: number
  slug: string
  name: string
  description: string | null
  isActive: boolean
  displayOrder: number
}

const props = withDefaults(defineProps<{
  open: boolean
  initialValues?: AdminSection | null
}>(), {
  initialValues: null
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const toast = useToast()
const formId = useId()
const formRef = ref<Form<CreateSectionInput>>()

const saving = ref(false)
const slugTouched = ref(false)

interface SectionFormState {
  slug: string
  name: string
  description: string
  isActive: boolean
  displayOrder: number
}

const state = reactive<SectionFormState>({
  slug: '',
  name: '',
  description: '',
  isActive: true,
  displayOrder: 0
})

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const isEdit = computed(() => props.initialValues != null)

const activeDescription = computed(() =>
  state.isActive
    ? 'La sección se muestra en la plataforma.'
    : 'La sección queda oculta en la plataforma.'
)

function hydrate() {
  const values = props.initialValues
  state.slug = values?.slug ?? ''
  state.name = values?.name ?? ''
  state.description = values?.description ?? ''
  state.isActive = values?.isActive ?? true
  state.displayOrder = values?.displayOrder ?? 0
  slugTouched.value = Boolean(values?.slug)
  formRef.value?.clear()
}

watch(() => props.open, (open) => {
  if (open) hydrate()
})

watch(() => state.name, (name) => {
  if (!isEdit.value && !slugTouched.value) {
    state.slug = slugify(name)
  }
})

function onSlugInput() {
  slugTouched.value = true
}

async function onSubmit(event: FormSubmitEvent<CreateSectionInput>) {
  saving.value = true
  const data = event.data

  try {
    if (isEdit.value && props.initialValues) {
      const id = props.initialValues.id

      await $fetch(`/api/sections/${id}`, {
        method: 'PUT',
        body: {
          slug: data.slug,
          name: data.name,
          description: data.description || null
        }
      })

      await $fetch(`/api/sections/${id}`, {
        method: 'PATCH',
        body: {
          isActive: data.isActive,
          displayOrder: data.displayOrder
        }
      })
    } else {
      await $fetch('/api/sections', {
        method: 'POST',
        body: {
          slug: data.slug,
          name: data.name,
          description: data.description || null,
          isActive: data.isActive,
          displayOrder: data.displayOrder
        }
      })
    }

    toast.add({
      title: isEdit.value ? 'Sección actualizada' : 'Sección creada',
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
    :title="isEdit ? 'Editar sección' : 'Nueva sección'"
    description="Contenedores de nivel superior que agrupan consultas y sus categorías."
    :dismissible="!saving"
    :ui="{ content: 'max-w-xl' }"
  >
    <template #body>
      <UForm
        :id="formId"
        ref="formRef"
        :schema="CreateSectionSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
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
          label="Identificador (URL)"
          name="slug"
          help="Se usa en la dirección web. Se genera solo desde el nombre; podés editarlo."
          required
        >
          <UInput
            v-model="state.slug"
            class="w-full"
            @input="onSlugInput"
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
          label="Mostrada en la plataforma"
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
          :label="isEdit ? 'Guardar cambios' : 'Crear sección'"
          icon="i-lucide-save"
          :loading="saving"
        />
      </div>
    </template>
  </USlideover>
</template>
