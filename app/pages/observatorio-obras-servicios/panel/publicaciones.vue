<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import type { AdminObservatoryPublicationDTO } from '~~/server/utils/serializers/observatoryPublication'

definePageMeta({
  layout: 'observatorio-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Publicaciones - Observatorio')

const toast = useToast()

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()

const { data: publications, status, refresh } = await useAsyncData(
  'admin-observatory-publications',
  () => requestFetch<AdminObservatoryPublicationDTO[]>('/api/observatory-publications')
)

const formOpen = ref(false)
const editingPublication = ref<AdminObservatoryPublicationDTO | null>(null)

const confirmOpen = ref(false)
const deleteTarget = ref<AdminObservatoryPublicationDTO | null>(null)
const deleting = ref(false)

function openCreate() {
  editingPublication.value = null
  formOpen.value = true
}

function openEdit(publication: AdminObservatoryPublicationDTO) {
  editingPublication.value = publication
  formOpen.value = true
}

function askRemove(publication: AdminObservatoryPublicationDTO) {
  deleteTarget.value = publication
  confirmOpen.value = true
}

async function toggleActive(publication: AdminObservatoryPublicationDTO) {
  try {
    await $fetch(`/api/observatory-publications/${publication.id}`, {
      method: 'PATCH',
      body: { isActive: !publication.isActive }
    })
    toast.add({
      title: publication.isActive ? 'Publicación ocultada' : 'Publicación visible',
      color: 'success'
    })
    await refresh()
  } catch (error) {
    toast.add({
      title: 'No se pudo actualizar',
      description: getErrorMessage(error),
      color: 'error'
    })
  }
}

async function confirmRemove() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch(`/api/observatory-publications/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Publicación eliminada', color: 'success' })
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

const pageActions = computed<ButtonProps[]>(() => [
  {
    label: 'Nueva publicación',
    icon: 'lucide:plus',
    color: 'primary',
    variant: 'solid',
    onClick: () => openCreate()
  }
])
</script>

<template>
  <div>
    <UPageHeader
      title="Publicaciones"
      description="Documentos del Observatorio que se listan en la página pública. El borrado es definitivo."
      :links="pageActions"
    />
    <UPageBody>
      <UPageCard v-if="status === 'pending'">
        Cargando publicaciones...
      </UPageCard>

      <AppTable
        v-else
        zebra
        align-last-right
        :empty="!publications || publications.length === 0"
      >
        <template #thead>
          <tr>
            <th class="text-center">
              Portada
            </th>
            <th>Título</th>
            <th class="text-center">
              Año
            </th>
            <th class="text-center">
              Descarga
            </th>
            <th class="text-center">
              Orden
            </th>
            <th class="text-center">
              Estado
            </th>
            <th>Acciones</th>
          </tr>
        </template>

        <template #tbody>
          <tr
            v-for="publication in publications || []"
            :key="publication.id"
          >
            <td>
              <div class="flex justify-center">
                <img
                  v-if="publication.coverUrl"
                  :src="publication.coverUrl"
                  :alt="publication.title"
                  class="h-12 w-auto max-w-20 rounded object-cover"
                  loading="lazy"
                >
                <UIcon
                  v-else
                  name="lucide:image-off"
                  class="size-4 text-muted"
                  title="Sin portada"
                />
              </div>
            </td>
            <td>{{ publication.title }}</td>
            <td class="text-center">
              {{ publication.publicationYear }}
            </td>
            <td class="text-center">
              <ULink
                v-if="publication.downloadUrl"
                :to="publication.downloadUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                <UIcon
                  name="lucide:download"
                  class="size-4"
                />
              </ULink>
              <span
                v-else
                class="text-muted"
              >—</span>
            </td>
            <td class="text-center">
              {{ publication.displayOrder }}
            </td>
            <td class="text-center">
              <UBadge
                :label="publication.isActive ? 'Visible' : 'Oculta'"
                :color="publication.isActive ? 'success' : 'neutral'"
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
                  @click="openEdit(publication)"
                />
                <UButton
                  :label="publication.isActive ? 'Ocultar' : 'Mostrar'"
                  :icon="publication.isActive ? 'lucide:eye-off' : 'lucide:eye'"
                  color="neutral"
                  variant="outline"
                  @click="toggleActive(publication)"
                />
                <UButton
                  label="Eliminar"
                  icon="lucide:trash-2"
                  color="error"
                  variant="outline"
                  @click="askRemove(publication)"
                />
              </UFieldGroup>
            </td>
          </tr>
        </template>

        <template #empty>
          <UEmpty
            icon="lucide:book-open"
            title="No hay publicaciones"
            description="Creá la primera publicación con el botón de arriba."
          />
        </template>
      </AppTable>
    </UPageBody>

    <ObservatorioPublicationFormModal
      v-model:open="formOpen"
      :initial-values="editingPublication"
      @saved="refresh"
    />

    <ConfirmModal
      v-model:open="confirmOpen"
      title="Eliminar publicación"
      description="Esta acción es definitiva y no se puede deshacer."
      confirm-label="Eliminar"
      confirm-color="error"
      :loading="deleting"
      @confirm="confirmRemove"
    />
  </div>
</template>
