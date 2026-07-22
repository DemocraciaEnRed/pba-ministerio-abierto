<script setup lang="ts">
import type { Form, FormSubmitEvent } from '@nuxt/ui'
import { CreateTagSchema, type CreateTagInput } from '#shared/schemas/taxonomy'

export interface AdminTag {
  id: number
  slug: string
  name: string
  description: string | null
  isActive: boolean
}

const props = withDefaults(defineProps<{
  open: boolean
  initialValues?: AdminTag | null
}>(), {
  initialValues: null
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const toast = useToast()
const formId = useId()
const formRef = ref<Form<CreateTagInput>>()

const saving = ref(false)
const slugTouched = ref(false)

interface TagFormState {
  slug: string
  name: string
  description: string
  isActive: boolean
}

const state = reactive<TagFormState>({
  slug: '',
  name: '',
  description: '',
  isActive: true
})

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const isEdit = computed(() => props.initialValues != null)

const activeDescription = computed(() =>
  state.isActive
    ? 'La etiqueta puede usarse en consultas y temas.'
    : 'La etiqueta queda deshabilitada para nuevos usos.'
)

function hydrate() {
  const values = props.initialValues
  state.slug = values?.slug ?? ''
  state.name = values?.name ?? ''
  state.description = values?.description ?? ''
  state.isActive = values?.isActive ?? true
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

async function onSubmit(event: FormSubmitEvent<CreateTagInput>) {
  saving.value = true
  const data = event.data

  const body = {
    slug: data.slug,
    name: data.name,
    description: data.description || null,
    isActive: data.isActive
  }

  try {
    if (isEdit.value && props.initialValues) {
      await $fetch(`/api/tags/${props.initialValues.id}`, {
        method: 'PUT',
        body
      })
    } else {
      await $fetch('/api/tags', {
        method: 'POST',
        body
      })
    }

    toast.add({
      title: isEdit.value ? 'Etiqueta actualizada' : 'Etiqueta creada',
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
    :title="isEdit ? 'Editar etiqueta' : 'Nueva etiqueta'"
    description="Etiquetas compartidas para consultas y temas."
    :dismissible="!saving"
    :ui="{ content: 'max-w-xl' }"
  >
    <template #body>
      <UForm
        :id="formId"
        ref="formRef"
        :schema="CreateTagSchema"
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
          label="Activa"
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
          :label="isEdit ? 'Guardar cambios' : 'Crear etiqueta'"
          icon="i-lucide-save"
          :loading="saving"
        />
      </div>
    </template>
  </USlideover>
</template>
