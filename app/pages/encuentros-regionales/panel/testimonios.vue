<script setup lang="ts">
import type { ButtonProps, DropdownMenuItem } from '@nuxt/ui'
import type { AdminTestimonialGroup } from '~/components/encuentrosRegionales/TestimonialGroupFormModal.vue'

definePageMeta({
  layout: 'encuentros-regionales-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Testimonios - Encuentros Regionales')

const toast = useToast()

const requestFetch = useRequestFetch()
const { data: groups, status, refresh } = await useAsyncData('admin-testimonials', () =>
  requestFetch<AdminTestimonialGroup[]>('/api/regional-meetings/testimonials')
)

const formOpen = ref(false)
const editingGroup = ref<AdminTestimonialGroup | null>(null)

const confirmOpen = ref(false)
const deleteTarget = ref<AdminTestimonialGroup | null>(null)
const deleting = ref(false)

function openCreate() {
  editingGroup.value = null
  formOpen.value = true
}

function openEdit(group: AdminTestimonialGroup) {
  editingGroup.value = group
  formOpen.value = true
}

function askRemove(group: AdminTestimonialGroup) {
  deleteTarget.value = group
  confirmOpen.value = true
}

async function confirmRemove() {
  if (!deleteTarget.value) return
  deleting.value = true

  try {
    await $fetch(`/api/regional-meetings/testimonials/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.add({
      title: 'Encuentro eliminado',
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

function moreActions(group: AdminTestimonialGroup): DropdownMenuItem[] {
  return [
    {
      label: 'Eliminar',
      icon: 'lucide:trash-2',
      color: 'error',
      onClick: () => askRemove(group)
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
  <div>
    <UPageHeader
      title="Testimonios"
      description="Administrá los encuentros y sus testimonios (hasta 3 por encuentro) que se muestran en la página pública de Encuentros Regionales."
      :links="pageActions"
    />
    <UPageBody>
      <UPageCard v-if="status === 'pending'">
        Cargando testimonios...
      </UPageCard>

      <AppTable
        v-else
        zebra
        align-last-right
        :empty="!groups || groups.length === 0"
      >
        <template #thead>
          <tr>
            <th>Encuentro</th>
            <th>Municipio</th>
            <th>Fecha</th>
            <th class="text-center">
              Testimonios
            </th>
            <th>Acciones</th>
          </tr>
        </template>

        <template #tbody>
          <tr
            v-for="group in groups || []"
            :key="group.id"
          >
            <td class="font-medium">
              {{ group.name }}
            </td>
            <td>{{ group.municipality }}</td>
            <td>{{ formatDateLong(group.heldAt) }}</td>
            <td class="text-center">
              {{ group.testimonials.length }}
            </td>
            <td>
              <UFieldGroup size="xs">
                <UButton
                  label="Editar"
                  icon="lucide:pencil"
                  color="neutral"
                  variant="subtle"
                  @click="openEdit(group)"
                />
                <UDropdownMenu
                  :items="moreActions(group)"
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
            icon="lucide:quote"
            title="No hay testimonios"
            description="Creá el primer encuentro con el botón de arriba."
          />
        </template>
      </AppTable>
    </UPageBody>

    <EncuentrosRegionalesTestimonialGroupFormModal
      v-model:open="formOpen"
      :initial-values="editingGroup"
      @saved="refresh"
    />

    <ConfirmModal
      v-model:open="confirmOpen"
      title="Eliminar encuentro"
      :description="deleteTarget ? `¿Seguro que querés eliminar «${deleteTarget.name}» y sus testimonios? Esta acción no se puede deshacer.` : ''"
      confirm-label="Eliminar"
      confirm-color="error"
      :loading="deleting"
      @confirm="confirmRemove"
    />
  </div>
</template>
