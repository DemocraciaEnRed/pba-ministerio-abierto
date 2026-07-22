<script setup lang="ts">
import type { ButtonProps, DropdownMenuItem } from '@nuxt/ui'
import type { AdminAttachment } from '~/components/admin/AttachmentFormModal.vue'

definePageMeta({
  layout: 'consultas-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Archivos')

const { slug } = useConsultationAdmin()
const toast = useToast()

const basePath = computed(() => `/api/consultations/${slug.value}/attachments`)

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()
const { data: attachments, status, refresh } = await useAsyncData(
  () => `admin-consultation-attachments-${slug.value}`,
  () => requestFetch<AdminAttachment[]>(basePath.value),
  { watch: [slug] }
)

const attachmentList = computed(() =>
  [...(attachments.value ?? [])].sort((a, b) => a.displayOrder - b.displayOrder)
)

const formOpen = ref(false)
const editing = ref<AdminAttachment | null>(null)

const confirmOpen = ref(false)
const deleteTarget = ref<AdminAttachment | null>(null)
const deleting = ref(false)

function formatBytes(value: number | null): string {
  if (!value || value <= 0) return '—'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function openCreate() {
  editing.value = null
  formOpen.value = true
}

function openEdit(attachment: AdminAttachment) {
  editing.value = attachment
  formOpen.value = true
}

function askRemove(attachment: AdminAttachment) {
  deleteTarget.value = attachment
  confirmOpen.value = true
}

async function confirmRemove() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch(`${basePath.value}/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Archivo eliminado', color: 'success' })
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

function moreActions(attachment: AdminAttachment): DropdownMenuItem[] {
  return [
    {
      label: 'Eliminar',
      icon: 'lucide:trash-2',
      color: 'error',
      onClick: () => askRemove(attachment)
    }
  ]
}

const pageActions = computed<ButtonProps[]>(() => [
  {
    label: 'Subir archivo',
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
      title="Archivos"
      description="Documentos y recursos que la ciudadanía puede descargar en la consulta."
      :links="pageActions"
    />

    <UPageBody>
      <UPageCard v-if="status === 'pending'">
        Cargando archivos...
      </UPageCard>

      <AppTable
        v-else
        zebra
        align-last-right
        :empty="attachmentList.length === 0"
      >
        <template #thead>
          <tr>
            <th class="text-center">
              Orden
            </th>
            <th>Título</th>
            <th>Archivo</th>
            <th class="text-center">
              Tamaño
            </th>
            <th class="text-center">
              Visible
            </th>
            <th>Acciones</th>
          </tr>
        </template>

        <template #tbody>
          <tr
            v-for="attachment in attachmentList"
            :key="attachment.id"
          >
            <td class="text-center">
              {{ attachment.displayOrder }}
            </td>
            <td>{{ attachment.title || '—' }}</td>
            <td>
              <ULink
                v-if="attachment.url"
                :to="attachment.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-sm"
              >
                <UIcon name="i-lucide-file" />
                <span class="font-mono text-xs">{{ attachment.filename || `#${attachment.assetId}` }}</span>
              </ULink>
              <span
                v-else
                class="font-mono text-xs text-muted"
              >{{ attachment.filename || `#${attachment.assetId}` }}</span>
            </td>
            <td class="text-center text-xs">
              {{ formatBytes(attachment.sizeBytes) }}
            </td>
            <td class="text-center">
              <UBadge
                :label="attachment.isPublic ? 'Pública' : 'Oculta'"
                :color="attachment.isPublic ? 'success' : 'neutral'"
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
                  @click="openEdit(attachment)"
                />
                <UDropdownMenu
                  :items="moreActions(attachment)"
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
            icon="lucide:paperclip"
            title="No hay archivos"
            description="Subí el primer archivo con el botón de arriba."
          />
        </template>
      </AppTable>
    </UPageBody>

    <AdminAttachmentFormModal
      v-model:open="formOpen"
      :base-path="basePath"
      :initial-values="editing"
      @saved="refresh"
    />

    <ConfirmModal
      v-model:open="confirmOpen"
      title="Eliminar archivo"
      :description="deleteTarget ? `¿Seguro que querés eliminar «${deleteTarget.title || deleteTarget.filename}»? Esta acción no se puede deshacer.` : ''"
      confirm-label="Eliminar"
      confirm-color="error"
      :loading="deleting"
      @confirm="confirmRemove"
    />
  </UPage>
</template>
