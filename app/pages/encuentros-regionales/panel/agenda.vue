<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import type { AdminAgendaItem } from '~/components/encuentrosRegionales/AgendaItemFormModal.vue'

definePageMeta({
  layout: 'encuentros-regionales-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Agenda - Encuentros Regionales')

const requestFetch = useRequestFetch()
const { data: items, status, refresh } = await useAsyncData('admin-agenda', () =>
  requestFetch<AdminAgendaItem[]>('/api/regional-meetings/agenda')
)

const formOpen = ref(false)
const editingItem = ref<AdminAgendaItem | null>(null)

function openEdit(item: AdminAgendaItem) {
  editingItem.value = item
  formOpen.value = true
}

const headerButtons = computed<ButtonProps[]>(() => [
  {
    label: 'Actualizar',
    icon: 'lucide:refresh-cw',
    color: 'neutral',
    variant: 'subtle',
    loading: status.value === 'pending',
    onClick: () => refresh()
  }
])
</script>

<template>
  <div>
    <UPageHeader
      title="Agenda"
      description="Editá la agenda de los Encuentros Regionales: lugar, fecha, año y si ya se celebró. Hay un ítem por región y no se pueden crear ni eliminar."
      :links="headerButtons"
    />
    <UPageBody>
      <UPageCard v-if="status === 'pending'">
        Cargando agenda...
      </UPageCard>

      <AppTable
        v-else
        zebra
        align-last-right
        :empty="!items || items.length === 0"
      >
        <template #thead>
          <tr>
            <th>Región</th>
            <th>Lugar</th>
            <th>Fecha</th>
            <th class="text-center">
              Año
            </th>
            <th class="text-center">
              Estado
            </th>
            <th>Acciones</th>
          </tr>
        </template>

        <template #tbody>
          <tr
            v-for="item in items || []"
            :key="item.id"
          >
            <td class="font-medium">
              {{ item.region.name }}
            </td>
            <td>{{ item.location }}</td>
            <td>{{ formatDateLong(item.heldAt) }}</td>
            <td class="text-center">
              {{ item.year ?? '—' }}
            </td>
            <td class="text-center">
              <UBadge
                :label="item.held ? 'Celebrado' : 'Pendiente'"
                :color="item.held ? 'success' : 'neutral'"
                variant="outline"
              />
            </td>
            <td>
              <UButton
                label="Editar"
                icon="lucide:pencil"
                color="neutral"
                variant="subtle"
                size="xs"
                @click="openEdit(item)"
              />
            </td>
          </tr>
        </template>

        <template #empty>
          <UEmpty
            icon="lucide:calendar-days"
            title="No hay ítems de agenda"
            description="Ejecutá el seed de agenda para poblar los encuentros por región."
          />
        </template>
      </AppTable>
    </UPageBody>

    <EncuentrosRegionalesAgendaItemFormModal
      v-model:open="formOpen"
      :initial-values="editingItem"
      @saved="refresh"
    />
  </div>
</template>
