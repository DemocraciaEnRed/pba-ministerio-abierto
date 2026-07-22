<script setup lang="ts">
import type { ButtonProps, DropdownMenuItem } from '@nuxt/ui'
import type { AdminLink } from '~/components/admin/LinkFormModal.vue'

definePageMeta({
  layout: 'consultas-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Enlaces')

const { slug } = useConsultationAdmin()
const toast = useToast()

const basePath = computed(() => `/api/consultations/${slug.value}/links`)

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()
const { data: links, status, refresh } = await useAsyncData(
  () => `admin-consultation-links-${slug.value}`,
  () => requestFetch<AdminLink[]>(basePath.value),
  { watch: [slug] }
)

const linkList = computed(() =>
  [...(links.value ?? [])].sort((a, b) => a.displayOrder - b.displayOrder)
)

const formOpen = ref(false)
const editing = ref<AdminLink | null>(null)

const confirmOpen = ref(false)
const deleteTarget = ref<AdminLink | null>(null)
const deleting = ref(false)

function openCreate() {
  editing.value = null
  formOpen.value = true
}

function openEdit(link: AdminLink) {
  editing.value = link
  formOpen.value = true
}

function askRemove(link: AdminLink) {
  deleteTarget.value = link
  confirmOpen.value = true
}

async function confirmRemove() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch(`${basePath.value}/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Enlace eliminado', color: 'success' })
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

function moreActions(link: AdminLink): DropdownMenuItem[] {
  return [
    {
      label: 'Eliminar',
      icon: 'lucide:trash-2',
      color: 'error',
      onClick: () => askRemove(link)
    }
  ]
}

const pageActions = computed<ButtonProps[]>(() => [
  {
    label: 'Nuevo enlace',
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
      title="Enlaces"
      description="Enlaces relacionados que la ciudadanía ve en la consulta."
      :links="pageActions"
    />

    <UPageBody>
      <UPageCard v-if="status === 'pending'">
        Cargando enlaces...
      </UPageCard>

      <AppTable
        v-else
        zebra
        align-last-right
        :empty="linkList.length === 0"
      >
        <template #thead>
          <tr>
            <th class="text-center">
              Orden
            </th>
            <th>Texto</th>
            <th>URL</th>
            <th>Acciones</th>
          </tr>
        </template>

        <template #tbody>
          <tr
            v-for="link in linkList"
            :key="link.id"
          >
            <td class="text-center">
              {{ link.displayOrder }}
            </td>
            <td class="font-medium">
              {{ link.label }}
            </td>
            <td>
              <ULink
                :to="link.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm text-primary hover:underline break-all"
              >
                {{ link.url }}
              </ULink>
            </td>
            <td>
              <UFieldGroup size="xs">
                <UButton
                  label="Editar"
                  icon="lucide:pencil"
                  color="neutral"
                  variant="subtle"
                  @click="openEdit(link)"
                />
                <UDropdownMenu
                  :items="moreActions(link)"
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
            icon="lucide:link"
            title="No hay enlaces"
            description="Agregá el primer enlace con el botón de arriba."
          />
        </template>
      </AppTable>
    </UPageBody>

    <AdminLinkFormModal
      v-model:open="formOpen"
      :base-path="basePath"
      :initial-values="editing"
      @saved="refresh"
    />

    <ConfirmModal
      v-model:open="confirmOpen"
      title="Eliminar enlace"
      :description="deleteTarget ? `¿Seguro que querés eliminar «${deleteTarget.label}»? Esta acción no se puede deshacer.` : ''"
      confirm-label="Eliminar"
      confirm-color="error"
      :loading="deleting"
      @confirm="confirmRemove"
    />
  </UPage>
</template>
