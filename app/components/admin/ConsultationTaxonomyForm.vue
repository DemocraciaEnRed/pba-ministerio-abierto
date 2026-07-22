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
  initialSectionId: number | null
  initialCategories: InitialCategory[]
  initialTags: TaxonomyOption[]
}>()

const emit = defineEmits<{
  saved: []
}>()

const toast = useToast()
const saving = ref(false)

const { data: sections, status: sectionsStatus } = await useAsyncData(
  'admin-sections',
  () => $fetch<TaxonomyOption[]>('/api/sections')
)

const { data: categories, status: categoriesStatus } = await useAsyncData(
  'admin-categories',
  () => $fetch<CategoryOption[]>('/api/categories')
)

const { data: tags, status: tagsStatus } = await useAsyncData(
  'admin-tags',
  () => $fetch<TaxonomyOption[]>('/api/tags')
)

const selectedSectionId = ref<number>(0)
const selectedCategoryIds = ref<number[]>([])
const primaryCategoryId = ref<number>(0)
const selectedTagIds = ref<number[]>([])

function hydrate() {
  selectedSectionId.value = props.initialSectionId ?? 0
  selectedCategoryIds.value = props.initialCategories.map(category => category.id)
  primaryCategoryId.value = props.initialCategories.find(category => category.isPrimary)?.id ?? 0
  selectedTagIds.value = props.initialTags.map(tag => tag.id)
}

watch(() => [props.initialSectionId, props.initialCategories, props.initialTags], hydrate, { immediate: true, deep: true })

const sectionItems = computed(() => [
  { label: 'Sin sección', value: 0 },
  ...(sections.value ?? []).map(section => ({ label: section.name, value: section.id }))
])

// Las categorías dependen de la sección: solo se listan las de la sección elegida.
const categoryItems = computed(() => {
  if (selectedSectionId.value === 0) return []
  return (categories.value ?? [])
    .filter(category => category.sectionId === selectedSectionId.value)
    .map(category => ({ label: category.name, value: category.id }))
})

// Al cambiar la sección, se quitan las categorías que no pertenecen a ella.
watch(selectedSectionId, (sectionId) => {
  if (sectionId === 0) {
    selectedCategoryIds.value = []
    return
  }
  const validIds = new Set(
    (categories.value ?? [])
      .filter(category => category.sectionId === sectionId)
      .map(category => category.id)
  )
  selectedCategoryIds.value = selectedCategoryIds.value.filter(id => validIds.has(id))
})

const tagItems = computed(() =>
  (tags.value ?? []).map(tag => ({ label: tag.name, value: tag.id }))
)

// La opción de categoría principal se limita a las categorías seleccionadas.
const primaryItems = computed(() => {
  const selected = (categories.value ?? []).filter(category => selectedCategoryIds.value.includes(category.id))
  return [
    { label: 'Sin categoría principal', value: 0 },
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
    await $fetch(`/api/consultations/${props.consultationId}/section`, {
      method: 'PUT',
      body: { sectionId: selectedSectionId.value === 0 ? null : selectedSectionId.value }
    })

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
      title: 'Sección, categorías y etiquetas actualizadas',
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
    title="Sección, categorías y etiquetas"
    description="Seguí el orden: elegí la sección, luego sus categorías, la categoría principal y las etiquetas."
  >
    <div class="space-y-6">
      <UFormField
        orientation="vertical"
        label="Sección"
        description="Contenedor de nivel superior al que pertenece la consulta (opcional)."
      >
        <USelect
          v-model="selectedSectionId"
          :items="sectionItems"
          value-key="value"
          :loading="sectionsStatus === 'pending'"
          class="w-full"
        />
      </UFormField>

      <UFormField
        orientation="vertical"
        label="Categorías"
        :description="selectedSectionId === 0 ? 'Elegí primero una sección para ver sus categorías.' : 'Clasificá la consulta con una o varias categorías de la sección.'"
      >
        <USelectMenu
          v-model="selectedCategoryIds"
          :items="categoryItems"
          value-key="value"
          multiple
          :disabled="selectedSectionId === 0"
          :loading="categoriesStatus === 'pending'"
          :placeholder="selectedSectionId === 0 ? 'Seleccioná una sección primero' : 'Elegí categorías'"
          class="w-full"
        />
      </UFormField>

      <UFormField
        v-if="selectedCategoryIds.length"
        orientation="vertical"
        label="Categoría principal"
        description="La categoría destacada de la consulta (opcional)."
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
          label="Guardar sección, categorías y etiquetas"
          icon="i-lucide-save"
          :loading="saving"
          @click="save"
        />
      </div>
    </template>
  </UCard>
</template>
