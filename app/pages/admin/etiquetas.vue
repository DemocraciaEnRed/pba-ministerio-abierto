<script setup lang="ts">
import type { ButtonProps, DropdownMenuItem } from '@nuxt/ui'
import type { AdminTag } from '~/components/admin/TagFormModal.vue'

definePageMeta({
  layout: 'admin-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Etiquetas')

const toast = useToast()

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()
const { data: tags, status, refresh } = await useAsyncData('admin-tags', () =>
  requestFetch<AdminTag[]>('/api/tags')
)

const formOpen = ref(false)
const editingTag = ref<AdminTag | null>(null)

const confirmOpen = ref(false)
const deleteTarget = ref<AdminTag | null>(null)
const deleting = ref(false)

function openCreate() {
  editingTag.value = null
  formOpen.value = true
}

function openEdit(tag: AdminTag) {
  editingTag.value = tag
  formOpen.value = true
}

function askRemove(tag: AdminTag) {
  deleteTarget.value = tag
  confirmOpen.value = true
}

async function confirmRemove() {
  if (!deleteTarget.value) return
  deleting.value = true

  try {
    await $fetch(`/api/tags/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.add({
      title: 'Etiqueta eliminada',
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

function moreActions(tag: AdminTag): DropdownMenuItem[] {
  return [
    {
      label: 'Eliminar',
      icon: 'lucide:trash-2',
      color: 'error',
      onClick: () => askRemove(tag)
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
      title="Etiquetas"
      description="Gestioná etiquetas compartidas para consultas y temas."
      :links="pageActions"
    />

    <UPageBody>
      <UPageCard v-if="status === 'pending'">
        Cargando etiquetas...
      </UPageCard>

      <AppTable
        v-else
        zebra
        align-last-right
        :empty="!tags || tags.length === 0"
      >
        <template #thead>
          <tr>
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
            v-for="tag in tags || []"
            :key="tag.id"
          >
            <td>{{ tag.name }}</td>
            <td class="text-center font-mono text-xs">
              {{ tag.slug }}
            </td>
            <td class="text-center">
              <UBadge
                :label="tag.isActive ? 'Activa' : 'Inactiva'"
                :color="tag.isActive ? 'success' : 'neutral'"
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
                  @click="openEdit(tag)"
                />
                <UDropdownMenu
                  :items="moreActions(tag)"
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
            icon="lucide:tags"
            title="No hay etiquetas"
            description="Creá la primera etiqueta con el botón de arriba."
          />
        </template>
      </AppTable>
    </UPageBody>

    <AdminTagFormModal
      v-model:open="formOpen"
      :initial-values="editingTag"
      @saved="refresh"
    />

    <ConfirmModal
      v-model:open="confirmOpen"
      title="Eliminar etiqueta"
      :description="deleteTarget ? `¿Seguro que querés eliminar «${deleteTarget.name}»? Esta acción no se puede deshacer.` : ''"
      confirm-label="Eliminar"
      confirm-color="error"
      :loading="deleting"
      @confirm="confirmRemove"
    />
  </UPage>
</template>
