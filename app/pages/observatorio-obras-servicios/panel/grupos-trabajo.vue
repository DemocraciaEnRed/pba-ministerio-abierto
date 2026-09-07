<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

interface AdminObservatoryWorkGroup {
  id: number
  slug: string
  name: string
  description: string | null
  color: string
  iconColor: string
  icon: string
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

definePageMeta({
  layout: 'observatorio-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Grupos de trabajo - Observatorio')

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()
const { data: workGroups, status, refresh } = await useAsyncData('admin-observatory-work-groups-list', () =>
  requestFetch<AdminObservatoryWorkGroup[]>('/api/observatory-work-groups')
)

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
      title="Grupos de trabajo"
      description="Catálogo fijo de grupos de trabajo del Observatorio. No se pueden crear, editar ni eliminar porque afectaría al uso del sistema."
      :links="headerButtons"
    />
    <UPageBody>
      <UPageCard v-if="status === 'pending'">
        Cargando grupos de trabajo...
      </UPageCard>

      <AppTable
        v-else
        zebra
        :empty="!workGroups || workGroups.length === 0"
      >
        <template #thead>
          <tr>
            <th class="text-center">
              Ícono
            </th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th class="text-center">
              Slug
            </th>
          </tr>
        </template>

        <template #tbody>
          <tr
            v-for="group in workGroups || []"
            :key="group.id"
          >
            <td class="text-center">
              <span
                class="inline-flex size-9 items-center justify-center rounded-lg"
                :style="{ backgroundColor: group.color }"
                :title="group.color"
              >
                <UIcon
                  :name="group.icon"
                  class="size-5"
                  :style="{ color: group.iconColor }"
                />
              </span>
            </td>
            <td>{{ group.name }}</td>
            <td class="text-sm text-muted">
              {{ group.description }}
            </td>
            <td class="text-center font-mono text-xs">
              {{ group.slug }}
            </td>
          </tr>
        </template>

        <template #empty>
          <UEmpty
            icon="lucide:users"
            title="No hay grupos de trabajo"
            description="Ejecutá el seed de grupos de trabajo para poblar el catálogo."
          />
        </template>
      </AppTable>
    </UPageBody>
  </div>
</template>
