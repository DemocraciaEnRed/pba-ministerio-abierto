<script setup lang="ts">
import type { ButtonProps, DropdownMenuItem } from '@nuxt/ui'
import type { AdminGalleryImage } from '~/components/admin/GalleryImageFormModal.vue'

definePageMeta({
  layout: 'tema-consulta-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Galería del tema')

const { consultationSlug, topicSlug } = useTopicAdmin()
const toast = useToast()

const basePath = computed(() =>
  `/api/consultations/${consultationSlug.value}/topics/${topicSlug.value}/gallery`
)

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()
const { data: images, status, refresh } = await useAsyncData(
  () => `admin-topic-gallery-${consultationSlug.value}-${topicSlug.value}`,
  () => requestFetch<AdminGalleryImage[]>(basePath.value),
  { watch: [consultationSlug, topicSlug] }
)

const imageList = computed(() =>
  [...(images.value ?? [])].sort((a, b) => a.displayOrder - b.displayOrder)
)

const formOpen = ref(false)
const editing = ref<AdminGalleryImage | null>(null)

const confirmOpen = ref(false)
const deleteTarget = ref<AdminGalleryImage | null>(null)
const deleting = ref(false)

function openCreate() {
  editing.value = null
  formOpen.value = true
}

function openEdit(image: AdminGalleryImage) {
  editing.value = image
  formOpen.value = true
}

function askRemove(image: AdminGalleryImage) {
  deleteTarget.value = image
  confirmOpen.value = true
}

async function confirmRemove() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch(`${basePath.value}/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Imagen eliminada', color: 'success' })
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

function moreActions(image: AdminGalleryImage): DropdownMenuItem[] {
  return [
    {
      label: 'Eliminar',
      icon: 'lucide:trash-2',
      color: 'error',
      onClick: () => askRemove(image)
    }
  ]
}

const pageActions = computed<ButtonProps[]>(() => [
  {
    label: 'Subir imagen',
    icon: 'lucide:upload',
    color: 'primary',
    variant: 'solid',
    onClick: () => openCreate()
  }
])
</script>

<template>
  <UPage>
    <UPageHeader
      title="Galería"
      description="Imágenes que se muestran en un carrusel en la página pública de este tema."
      :links="pageActions"
    />

    <UPageBody>
      <UPageCard v-if="status === 'pending'">
        Cargando galería...
      </UPageCard>

      <AppTable
        v-else
        zebra
        align-last-right
        :empty="imageList.length === 0"
      >
        <template #thead>
          <tr>
            <th class="text-center">
              Orden
            </th>
            <th>Imagen</th>
            <th>Epígrafe</th>
            <th>Texto alternativo</th>
            <th class="text-center">
              Visible
            </th>
            <th>Acciones</th>
          </tr>
        </template>

        <template #tbody>
          <tr
            v-for="image in imageList"
            :key="image.id"
          >
            <td class="text-center">
              {{ image.displayOrder }}
            </td>
            <td>
              <img
                v-if="image.url"
                :src="image.url"
                :alt="image.altText || image.title || `Imagen #${image.id}`"
                class="h-12 w-16 rounded border border-default bg-elevated object-contain"
              >
              <span
                v-else
                class="text-xs text-muted"
              >Sin vista previa</span>
            </td>
            <td>{{ image.title || '—' }}</td>
            <td class="max-w-xs truncate text-sm text-muted">
              {{ image.altText || '—' }}
            </td>
            <td class="text-center">
              <UBadge
                :label="image.isPublic ? 'Pública' : 'Oculta'"
                :color="image.isPublic ? 'success' : 'neutral'"
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
                  @click="openEdit(image)"
                />
                <UDropdownMenu
                  :items="moreActions(image)"
                  :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
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
            icon="lucide:images"
            title="No hay imágenes"
            description="Subí la primera imagen con el botón de arriba."
          />
        </template>
      </AppTable>
    </UPageBody>

    <AdminGalleryImageFormModal
      v-model:open="formOpen"
      :base-path="basePath"
      :initial-values="editing"
      @saved="refresh"
    />

    <ConfirmModal
      v-model:open="confirmOpen"
      title="Eliminar imagen"
      :description="deleteTarget ? `¿Seguro que querés eliminar «${deleteTarget.title || deleteTarget.filename || `imagen #${deleteTarget.id}`}»? Esta acción no se puede deshacer.` : ''"
      confirm-label="Eliminar"
      confirm-color="error"
      :loading="deleting"
      @confirm="confirmRemove"
    />
  </UPage>
</template>
