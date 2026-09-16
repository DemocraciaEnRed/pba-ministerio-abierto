<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import type { AdminObservatoryVideoDTO } from '~~/server/utils/serializers/observatoryVideo'

definePageMeta({
  layout: 'observatorio-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Registro audiovisual - Observatorio')

const toast = useToast()

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()

const { data: videos, status, refresh } = await useAsyncData(
  'admin-observatory-videos',
  () => requestFetch<AdminObservatoryVideoDTO[]>('/api/observatory-videos')
)

const formOpen = ref(false)
const editingVideo = ref<AdminObservatoryVideoDTO | null>(null)

const confirmOpen = ref(false)
const deleteTarget = ref<AdminObservatoryVideoDTO | null>(null)
const deleting = ref(false)

function openCreate() {
  editingVideo.value = null
  formOpen.value = true
}

function openEdit(video: AdminObservatoryVideoDTO) {
  editingVideo.value = video
  formOpen.value = true
}

function askRemove(video: AdminObservatoryVideoDTO) {
  deleteTarget.value = video
  confirmOpen.value = true
}

async function toggleActive(video: AdminObservatoryVideoDTO) {
  try {
    await $fetch(`/api/observatory-videos/${video.id}`, {
      method: 'PATCH',
      body: { isActive: !video.isActive }
    })
    toast.add({
      title: video.isActive ? 'Video ocultado' : 'Video visible',
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
    await $fetch(`/api/observatory-videos/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Video eliminado', color: 'success' })
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
    label: 'Nuevo video',
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
      title="Registro audiovisual"
      description="Videos de YouTube que se muestran en el carrusel de la página pública. El borrado es definitivo."
      :links="pageActions"
    />
    <UPageBody>
      <UPageCard v-if="status === 'pending'">
        Cargando videos...
      </UPageCard>

      <AppTable
        v-else
        zebra
        align-last-right
        :empty="!videos || videos.length === 0"
      >
        <template #thead>
          <tr>
            <th class="text-center">
              Miniatura
            </th>
            <th>Título</th>
            <th class="text-center">
              Fecha
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
            v-for="video in videos || []"
            :key="video.id"
          >
            <td>
              <div class="flex justify-center">
                <img
                  v-if="video.thumbnailUrl"
                  :src="video.thumbnailUrl"
                  :alt="video.title"
                  class="h-12 w-auto max-w-24 rounded object-cover"
                  loading="lazy"
                >
                <UIcon
                  v-else
                  name="lucide:video-off"
                  class="size-4 text-muted"
                  title="Sin miniatura"
                />
              </div>
            </td>
            <td>
              {{ video.title }}
              <ULink
                :to="video.youtubeUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="block text-xs"
              >
                {{ video.youtubeUrl }}
              </ULink>
            </td>
            <td class="text-center">
              {{ video.videoDate ?? '—' }}
            </td>
            <td class="text-center">
              {{ video.displayOrder }}
            </td>
            <td class="text-center">
              <UBadge
                :label="video.isActive ? 'Visible' : 'Oculto'"
                :color="video.isActive ? 'success' : 'neutral'"
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
                  @click="openEdit(video)"
                />
                <UButton
                  :label="video.isActive ? 'Ocultar' : 'Mostrar'"
                  :icon="video.isActive ? 'lucide:eye-off' : 'lucide:eye'"
                  color="neutral"
                  variant="outline"
                  @click="toggleActive(video)"
                />
                <UButton
                  label="Eliminar"
                  icon="lucide:trash-2"
                  color="error"
                  variant="outline"
                  @click="askRemove(video)"
                />
              </UFieldGroup>
            </td>
          </tr>
        </template>

        <template #empty>
          <UEmpty
            icon="lucide:video"
            title="No hay videos"
            description="Agregá el primer video con el botón de arriba."
          />
        </template>
      </AppTable>
    </UPageBody>

    <ObservatorioVideoFormModal
      v-model:open="formOpen"
      :initial-values="editingVideo"
      @saved="refresh"
    />

    <ConfirmModal
      v-model:open="confirmOpen"
      title="Eliminar video"
      description="Esta acción es definitiva y no se puede deshacer."
      confirm-label="Eliminar"
      confirm-color="error"
      :loading="deleting"
      @confirm="confirmRemove"
    />
  </div>
</template>
