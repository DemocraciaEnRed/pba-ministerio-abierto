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
      description="Editá la agenda de los Encuentros Regionales: lugar, fecha, año, estado y cómo se destaca en la timeline. Hay un ítem por región y no se pueden crear ni eliminar."
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
            <th class="text-center">
              Destacado
            </th>
            <th class="text-center">
              Inscripción
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
                :icon="agendaItemStateBadge(item.state).icon"
                :label="agendaItemStateBadge(item.state).label"
                :color="agendaItemStateBadge(item.state).color"
                variant="subtle"
              />
            </td>
            <td class="text-center">
              <UBadge
                v-if="item.highlighted"
                label="Destacado"
                color="secondary"
                variant="subtle"
              />
              <span v-else>—</span>
            </td>
            <td class="text-center">
              <UBadge
                v-if="item.registrationUrl"
                icon="lucide:link"
                label="Con enlace"
                color="primary"
                variant="subtle"
              />
              <span v-else>—</span>
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
