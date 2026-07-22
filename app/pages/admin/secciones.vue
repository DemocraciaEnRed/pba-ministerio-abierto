<script setup lang="ts">
import type { ButtonProps, DropdownMenuItem } from '@nuxt/ui'
import type { AdminSection } from '~/components/admin/SectionFormModal.vue'

definePageMeta({
  layout: 'admin-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Secciones')

const toast = useToast()

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()
const { data: sections, status, refresh } = await useAsyncData('admin-sections', () =>
  requestFetch<AdminSection[]>('/api/sections')
)

const formOpen = ref(false)
const editingSection = ref<AdminSection | null>(null)

const confirmOpen = ref(false)
const deleteTarget = ref<AdminSection | null>(null)
const deleting = ref(false)

function openCreate() {
  editingSection.value = null
  formOpen.value = true
}

function openEdit(section: AdminSection) {
  editingSection.value = section
  formOpen.value = true
}

function askRemove(section: AdminSection) {
  deleteTarget.value = section
  confirmOpen.value = true
}

async function confirmRemove() {
  if (!deleteTarget.value) return
  deleting.value = true

  try {
    await $fetch(`/api/sections/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.add({
      title: 'Sección eliminada',
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

function moreActions(section: AdminSection): DropdownMenuItem[] {
  return [
    {
      label: 'Eliminar',
      icon: 'lucide:trash-2',
      color: 'error',
      onClick: () => askRemove(section)
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
      title="Secciones"
      description="Contenedores de nivel superior que agrupan consultas y sus categorías."
      :links="pageActions"
    />

    <UPageBody>
      <UPageCard v-if="status === 'pending'">
        Cargando secciones...
      </UPageCard>

      <AppTable
        v-else
        zebra
        align-last-right
        :empty="!sections || sections.length === 0"
      >
        <template #thead>
          <tr>
            <th class="text-center">
              Orden
            </th>
            <th>Nombre</th>
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
            v-for="section in sections || []"
            :key="section.id"
          >
            <td class="text-center">
              {{ section.displayOrder }}
            </td>
            <td>{{ section.name }}</td>
            <td class="text-center font-mono text-xs">
              {{ section.slug }}
            </td>
            <td class="text-center">
              <UBadge
                :label="section.isActive ? 'Activa' : 'Inactiva'"
                :color="section.isActive ? 'success' : 'neutral'"
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
                  @click="openEdit(section)"
                />
                <UDropdownMenu
                  :items="moreActions(section)"
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
            icon="lucide:layout-grid"
            title="No hay secciones"
            description="Creá la primera sección con el botón de arriba."
          />
        </template>
      </AppTable>
    </UPageBody>

    <AdminSectionFormModal
      v-model:open="formOpen"
      :initial-values="editingSection"
      @saved="refresh"
    />

    <ConfirmModal
      v-model:open="confirmOpen"
      title="Eliminar sección"
      :description="deleteTarget ? `¿Seguro que querés eliminar «${deleteTarget.name}»? Esta acción no se puede deshacer.` : ''"
      confirm-label="Eliminar"
      confirm-color="error"
      :loading="deleting"
      @confirm="confirmRemove"
    />
  </UPage>
</template>
