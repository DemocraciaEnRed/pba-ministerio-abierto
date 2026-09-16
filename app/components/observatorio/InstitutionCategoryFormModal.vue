<script setup lang="ts">
import type { Form, FormSubmitEvent } from '@nuxt/ui'
import {
  CreateObservatoryInstitutionCategorySchema,
  type CreateObservatoryInstitutionCategoryInput
} from '#shared/schemas/observatory'
import type { AdminObservatoryInstitutionCategoryDTO } from '~~/server/utils/serializers/observatoryInstitution'

defineOptions({ name: 'ObservatorioInstitutionCategoryFormModal' })

const props = withDefaults(defineProps<{
  open: boolean
  initialValues?: AdminObservatoryInstitutionCategoryDTO | null
}>(), {
  initialValues: null
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const toast = useToast()
const formId = useId()
const formRef = ref<Form<CreateObservatoryInstitutionCategoryInput>>()

const saving = ref(false)
const slugTouched = ref(false)

const state = reactive({
  slug: '',
  name: '',
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
    ? 'La categoría y sus instituciones se ofrecen en el formulario de aportes.'
    : 'La categoría y sus instituciones quedan ocultas en el formulario. Los aportes ya recibidos no se modifican.'
)

function hydrate() {
  const values = props.initialValues
  state.slug = values?.slug ?? ''
  state.name = values?.name ?? ''
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

async function onSubmit(event: FormSubmitEvent<CreateObservatoryInstitutionCategoryInput>) {
  saving.value = true
  const data = event.data

  try {
    if (isEdit.value && props.initialValues) {
      await $fetch(`/api/observatory-institution-categories/${props.initialValues.id}`, {
        method: 'PATCH',
        body: data
      })
    } else {
      await $fetch('/api/observatory-institution-categories', {
        method: 'POST',
        body: data
      })
    }

    toast.add({
      title: isEdit.value ? 'Categoría actualizada' : 'Categoría creada',
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
    :title="isEdit ? 'Editar categoría' : 'Nueva categoría'"
    description="Agrupa a las instituciones en el formulario de aportes."
    :dismissible="!saving"
    :ui="{ content: 'max-w-xl' }"
  >
    <template #body>
      <UForm
        :id="formId"
        ref="formRef"
        :schema="CreateObservatoryInstitutionCategorySchema"
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
          label="Identificador"
          name="slug"
          help="Se genera solo desde el nombre; podés editarlo."
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

        <USwitch
          v-model="state.isActive"
          label="Disponible en el formulario"
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
          :label="isEdit ? 'Guardar cambios' : 'Crear categoría'"
          :loading="saving"
        />
      </div>
    </template>
  </USlideover>
</template>
