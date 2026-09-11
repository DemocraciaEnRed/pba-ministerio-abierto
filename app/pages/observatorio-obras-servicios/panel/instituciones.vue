<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import type {
  AdminObservatoryInstitutionDTO,
  AdminObservatoryInstitutionCategoryDTO
} from '~~/server/utils/serializers/observatoryInstitution'

definePageMeta({
  layout: 'observatorio-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Instituciones - Observatorio')

const toast = useToast()

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()

const { data: categories, status: categoriesStatus, refresh: refreshCategories } = await useAsyncData(
  'admin-observatory-institution-categories',
  () => requestFetch<AdminObservatoryInstitutionCategoryDTO[]>('/api/observatory-institution-categories')
)

const { data: institutions, status, refresh: refreshInstitutions } = await useAsyncData(
  'admin-observatory-institutions',
  () => requestFetch<AdminObservatoryInstitutionDTO[]>('/api/observatory-institutions')
)

// Las instituciones se listan agrupadas por categoría, igual que en el formulario.
const groupedInstitutions = computed(() =>
  (categories.value ?? []).map(category => ({
    category,
    institutions: (institutions.value ?? []).filter(institution => institution.categoryId === category.id)
  }))
)

const institutionFormOpen = ref(false)
const editingInstitution = ref<AdminObservatoryInstitutionDTO | null>(null)

const categoryFormOpen = ref(false)
const editingCategory = ref<AdminObservatoryInstitutionCategoryDTO | null>(null)

function openCreateInstitution() {
  editingInstitution.value = null
  institutionFormOpen.value = true
}

function openEditInstitution(institution: AdminObservatoryInstitutionDTO) {
  editingInstitution.value = institution
  institutionFormOpen.value = true
}

function openCreateCategory() {
  editingCategory.value = null
  categoryFormOpen.value = true
}

function openEditCategory(category: AdminObservatoryInstitutionCategoryDTO) {
  editingCategory.value = category
  categoryFormOpen.value = true
}

async function refreshAll() {
  await Promise.all([refreshCategories(), refreshInstitutions()])
}

// La baja es lógica: el aporte ya recibido conserva el nombre de la institución.
async function toggleInstitution(institution: AdminObservatoryInstitutionDTO) {
  try {
    await $fetch(`/api/observatory-institutions/${institution.id}`, {
      method: 'PATCH',
      body: { isActive: !institution.isActive }
    })
    toast.add({
      title: institution.isActive ? 'Institución dada de baja' : 'Institución reactivada',
      color: 'success'
    })
    await refreshInstitutions()
  } catch (error) {
    toast.add({
      title: 'No se pudo actualizar',
      description: getErrorMessage(error),
      color: 'error'
    })
  }
}

async function toggleCategory(category: AdminObservatoryInstitutionCategoryDTO) {
  try {
    await $fetch(`/api/observatory-institution-categories/${category.id}`, {
      method: 'PATCH',
      body: { isActive: !category.isActive }
    })
    toast.add({
      title: category.isActive ? 'Categoría dada de baja' : 'Categoría reactivada',
      color: 'success'
    })
    await refreshCategories()
  } catch (error) {
    toast.add({
      title: 'No se pudo actualizar',
      description: getErrorMessage(error),
      color: 'error'
    })
  }
}

const pageActions = computed<ButtonProps[]>(() => [
  {
    label: 'Nueva categoría',
    icon: 'lucide:folder-plus',
    color: 'neutral',
    variant: 'subtle',
    onClick: () => openCreateCategory()
  },
  {
    label: 'Nueva institución',
    icon: 'lucide:plus',
    color: 'primary',
    variant: 'solid',
    onClick: () => openCreateInstitution()
  }
])
</script>

<template>
  <div>
    <UPageHeader
      title="Instituciones"
      description="Catálogo de instituciones habilitadas para presentar aportes. Las bajas son lógicas: se ocultan del formulario y los aportes ya recibidos conservan su nombre."
      :links="pageActions"
    />
    <UPageBody>
      <UPageCard v-if="status === 'pending' || categoriesStatus === 'pending'">
        Cargando instituciones...
      </UPageCard>

      <div
        v-else-if="groupedInstitutions.length"
        class="space-y-8"
      >
        <div
          v-for="group in groupedInstitutions"
          :key="group.category.id"
          class="space-y-3"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <h2 class="text-base font-semibold text-highlighted">
                {{ group.category.name }}
              </h2>
              <UBadge
                :label="group.category.isActive ? 'Activa' : 'Inactiva'"
                :color="group.category.isActive ? 'success' : 'neutral'"
                variant="outline"
                size="sm"
              />
            </div>

            <UFieldGroup size="xs">
              <UButton
                label="Editar categoría"
                icon="lucide:pencil"
                color="neutral"
                variant="subtle"
                @click="openEditCategory(group.category)"
              />
              <UButton
                :label="group.category.isActive ? 'Dar de baja' : 'Reactivar'"
                :icon="group.category.isActive ? 'lucide:eye-off' : 'lucide:eye'"
                color="neutral"
                variant="outline"
                @click="toggleCategory(group.category)"
              />
            </UFieldGroup>
          </div>

          <AppTable
            zebra
            align-last-right
            :empty="group.institutions.length === 0"
          >
            <template #thead>
              <tr>
                <th class="text-center">
                  Orden
                </th>
                <th>Nombre</th>
                <th class="text-center">
                  Identificador
                </th>
                <th class="text-center">
                  Estado
                </th>
                <th>Acciones</th>
              </tr>
            </template>

            <template #tbody>
              <tr
                v-for="institution in group.institutions"
                :key="institution.id"
              >
                <td class="text-center">
                  {{ institution.displayOrder }}
                </td>
                <td>{{ institution.name }}</td>
                <td class="text-center font-mono text-xs">
                  {{ institution.slug }}
                </td>
                <td class="text-center">
                  <UBadge
                    :label="institution.isActive ? 'Activa' : 'Inactiva'"
                    :color="institution.isActive ? 'success' : 'neutral'"
                    variant="outline"
                  />
                </td>
                <td>
                  <UFieldGroup size="xs">
                    <UButton
                      label="Editar"
                      icon="lucide:pencil"
                      color="neutral"
                      variant="subtle"
                      @click="openEditInstitution(institution)"
                    />
                    <UButton
                      :label="institution.isActive ? 'Dar de baja' : 'Reactivar'"
                      :icon="institution.isActive ? 'lucide:eye-off' : 'lucide:eye'"
                      color="neutral"
                      variant="outline"
                      @click="toggleInstitution(institution)"
                    />
                  </UFieldGroup>
                </td>
              </tr>
            </template>

            <template #empty>
              <UEmpty
                icon="lucide:building-2"
                title="Sin instituciones en esta categoría"
                description="Creá una institución con el botón de arriba."
              />
            </template>
          </AppTable>
        </div>
      </div>

      <UEmpty
        v-else
        icon="lucide:building-2"
        title="No hay categorías de instituciones"
        description="Creá la primera categoría para empezar a cargar instituciones."
      />
    </UPageBody>

    <ObservatorioInstitutionFormModal
      v-model:open="institutionFormOpen"
      :initial-values="editingInstitution"
      :categories="categories ?? []"
      @saved="refreshAll"
    />

    <ObservatorioInstitutionCategoryFormModal
      v-model:open="categoryFormOpen"
      :initial-values="editingCategory"
      @saved="refreshAll"
    />
  </div>
</template>
