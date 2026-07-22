<script setup lang="ts">
import type { ButtonProps, DropdownMenuItem } from '@nuxt/ui'
import type { AdminCategory, CategorySectionOption } from '~/components/admin/CategoryFormModal.vue'

definePageMeta({
  layout: 'admin-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Categorías')

const toast = useToast()

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()
const { data: categories, status, refresh } = await useAsyncData('admin-categories', () =>
  requestFetch<AdminCategory[]>('/api/categories')
)

const { data: sections } = await useAsyncData('admin-categories-sections', () =>
  requestFetch<CategorySectionOption[]>('/api/sections')
)

const sectionNameById = computed(() =>
  new Map((sections.value ?? []).map(section => [section.id, section.name]))
)

const formOpen = ref(false)
const editingCategory = ref<AdminCategory | null>(null)

const confirmOpen = ref(false)
const deleteTarget = ref<AdminCategory | null>(null)
const deleting = ref(false)

function openCreate() {
  editingCategory.value = null
  formOpen.value = true
}

function openEdit(category: AdminCategory) {
  editingCategory.value = category
  formOpen.value = true
}

function askRemove(category: AdminCategory) {
  deleteTarget.value = category
  confirmOpen.value = true
}

async function confirmRemove() {
  if (!deleteTarget.value) return
  deleting.value = true

  try {
    await $fetch(`/api/categories/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.add({
      title: 'Categoría eliminada',
      color: 'success'
    })
    confirmOpen.value = false
    deleteTarget.value = null
    await refresh()
  } catch (error) {
    toast.add({
      title: 'No se pudo eliminar',
      description: getErrorMessage(error),
      color: 'error'
    })
  } finally {
    deleting.value = false
  }
}

function moreActions(category: AdminCategory): DropdownMenuItem[] {
  return [
    {
      label: 'Eliminar',
      icon: 'lucide:trash-2',
      color: 'error',
      onClick: () => askRemove(category)
    }
  ]
}

const pageActions = computed<ButtonProps[]>(() => [
  {
    label: 'Crear',
    icon: 'lucide:plus',
    color: 'primary',
    variant: 'solid',
    onClick: () => openCreate()
  }
])
</script>

<template>
  <UPage>
    <UPageHeader
      title="Categorías"
      description="Gestioná clasificación institucional y orden de visualización."
      :links="pageActions"
    />

    <UPageBody>
      <UPageCard v-if="status === 'pending'">
        Cargando categorías...
      </UPageCard>

      <AppTable
        v-else
        zebra
        align-last-right
        :empty="!categories || categories.length === 0"
      >
        <template #thead>
          <tr>
            <th class="text-center">
              Orden
            </th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th class="text-center">
              Sección
            </th>
            <th class="text-center">
              Slug
            </th>
            <th class="text-center">
              Estado
            </th>
            <th>Acciones</th>
          </tr>
        </template>

        <template #tbody>
          <tr
            v-for="category in categories || []"
            :key="category.id"
          >
            <td class="text-center">
              {{ category.displayOrder }}
            </td>
            <td>{{ category.name }}</td>
            <td class="text-xs">
              {{ category.description }}
            </td>
            <td class="text-center">
              {{ sectionNameById.get(category.sectionId) ?? '—' }}
            </td>
            <td class="text-center font-mono text-xs">
              {{ category.slug }}
            </td>
            <td class="text-center">
              <UBadge
                :label="category.isActive ? 'Activa' : 'Inactiva'"
                :color="category.isActive ? 'success' : 'neutral'"
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
                  @click="openEdit(category)"
                />
                <UDropdownMenu
                  :items="moreActions(category)"
                  :content="{
                    align: 'end',
                    side: 'bottom',
                    sideOffset: 8
                  }"
                  size="sm"
                >
                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="lucide:chevron-down"
                  />
                </UDropdownMenu>
              </UFieldGroup>
            </td>
          </tr>
        </template>

        <template #empty>
          <UEmpty
            icon="lucide:folder-open"
            title="No hay categorías"
            description="Creá la primera categoría con el botón de arriba."
          />
        </template>
      </AppTable>
    </UPageBody>

    <AdminCategoryFormModal
      v-model:open="formOpen"
      :initial-values="editingCategory"
      :sections="sections ?? []"
      @saved="refresh"
    />

    <ConfirmModal
      v-model:open="confirmOpen"
      title="Eliminar categoría"
      :description="deleteTarget ? `¿Seguro que querés eliminar «${deleteTarget.name}»? Esta acción no se puede deshacer.` : ''"
      confirm-label="Eliminar"
      confirm-color="error"
      :loading="deleting"
      @confirm="confirmRemove"
    />
  </UPage>
</template>
