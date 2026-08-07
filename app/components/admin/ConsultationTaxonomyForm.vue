<script setup lang="ts">
interface TaxonomyOption {
  id: number
  name: string
}

interface CategoryOption extends TaxonomyOption {
  sectionId: number
}

interface InitialCategory {
  id: number
  name: string
  isPrimary: boolean
}

const props = defineProps<{
  consultationId: number
  sectionId: number | null
  sectionName: string | null
  initialCategories: InitialCategory[]
  initialTags: TaxonomyOption[]
}>()

const emit = defineEmits<{
  saved: []
}>()

const toast = useToast()
const saving = ref(false)

const { data: categories, status: categoriesStatus } = await useAsyncData(
  'admin-categories',
  () => $fetch<CategoryOption[]>('/api/categories')
)

const { data: tags, status: tagsStatus } = await useAsyncData(
  'admin-tags',
  () => $fetch<TaxonomyOption[]>('/api/tags')
)

const selectedCategoryIds = ref<number[]>([])
const primaryCategoryId = ref<number>(0)
const selectedTagIds = ref<number[]>([])

function hydrate() {
  selectedCategoryIds.value = props.initialCategories.map(category => category.id)
  primaryCategoryId.value = props.initialCategories.find(category => category.isPrimary)?.id ?? 0
  selectedTagIds.value = props.initialTags.map(tag => tag.id)
}

watch(() => [props.initialCategories, props.initialTags], hydrate, { immediate: true, deep: true })

// Las categorías dependen del tipo de consulta: solo se listan las de su sección.
const categoryItems = computed(() => {
  if (props.sectionId === null) return []
  return (categories.value ?? [])
    .filter(category => category.sectionId === props.sectionId)
    .map(category => ({ label: category.name, value: category.id }))
})

const tagItems = computed(() =>
  (tags.value ?? []).map(tag => ({ label: tag.name, value: tag.id }))
)

// La opción de categoría principal se limita a las categorías seleccionadas.
const primaryItems = computed(() => {
  const selected = (categories.value ?? []).filter(category => selectedCategoryIds.value.includes(category.id))
  return [
    { label: 'Sin eje de gestión principal', value: 0 },
    ...selected.map(category => ({ label: category.name, value: category.id }))
  ]
})

// Si la principal deja de estar seleccionada, se resetea.
watch(selectedCategoryIds, (ids) => {
  if (primaryCategoryId.value !== 0 && !ids.includes(primaryCategoryId.value)) {
    primaryCategoryId.value = 0
  }
})

async function save() {
  saving.value = true
  try {
    const categoriesPayload = selectedCategoryIds.value.map((id, index) => ({
      categoryId: id,
      isPrimary: id === primaryCategoryId.value,
      displayOrder: index
    }))

    await $fetch(`/api/consultations/${props.consultationId}/categories`, {
      method: 'PUT',
      body: { categories: categoriesPayload }
    })

    await $fetch(`/api/consultations/${props.consultationId}/tags`, {
      method: 'PUT',
      body: { tagIds: selectedTagIds.value }
    })

    toast.add({
      title: 'Ejes de gestión y etiquetas actualizados',
      color: 'success'
    })
    emit('saved')
  } catch (error) {
    const e = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'No se pudieron guardar los cambios',
      description: e.data?.message || e.message || 'Ocurrió un error inesperado.',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UCard
    title="Ejes de gestión y etiquetas"
    description="Clasificá la consulta dentro de su tipo: elegí los ejes de gestión, el principal y las etiquetas."
  >
    <div class="space-y-6">
      <UFormField
        orientation="vertical"
        label="Tipo de consulta"
        description="Se fija al crear la consulta y no se puede modificar."
      >
        <UInput
          :model-value="sectionName ?? 'Sin tipo asignado'"
          disabled
          class="w-full"
        />
      </UFormField>

      <UFormField
        orientation="vertical"
        label="Ejes de gestión"
        :description="sectionId === null ? 'La consulta no tiene un tipo asignado, así que no hay ejes de gestión disponibles.' : 'Clasificá la consulta con uno o varios ejes de gestión de su tipo.'"
      >
        <USelectMenu
          v-model="selectedCategoryIds"
          :items="categoryItems"
          value-key="value"
          multiple
          :disabled="sectionId === null"
          :loading="categoriesStatus === 'pending'"
          :placeholder="sectionId === null ? 'Sin tipo asignado' : 'Elegí ejes de gestión'"
          class="w-full"
        />
      </UFormField>

      <UFormField
        v-if="selectedCategoryIds.length"
        orientation="vertical"
        label="Eje de gestión principal"
        description="El eje de gestión destacado de la consulta (opcional)."
      >
        <USelect
          v-model="primaryCategoryId"
          :items="primaryItems"
          value-key="value"
          class="w-full"
        />
      </UFormField>

      <UFormField
        orientation="vertical"
        label="Etiquetas"
        description="Agregá etiquetas para facilitar la búsqueda."
      >
        <USelectMenu
          v-model="selectedTagIds"
          :items="tagItems"
          value-key="value"
          multiple
          :loading="tagsStatus === 'pending'"
          placeholder="Elegí etiquetas"
          class="w-full"
        />
      </UFormField>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <UButton
          label="Guardar ejes de gestión y etiquetas"
          icon="i-lucide-save"
          :loading="saving"
          @click="save"
        />
      </div>
    </template>
  </UCard>
</template>
