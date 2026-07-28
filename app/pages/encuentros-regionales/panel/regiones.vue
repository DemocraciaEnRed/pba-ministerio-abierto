<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

interface AdminRegion {
  id: number
  slug: string
  name: string
  createdAt: string
  updatedAt: string
}

definePageMeta({
  layout: 'encuentros-regionales-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Regiones - Encuentros Regionales')

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()
const { data: regions, status, refresh } = await useAsyncData('admin-regions-list', () =>
  requestFetch<AdminRegion[]>('/api/regions')
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
      title="Regiones"
      description="Catálogo fijo de regiones de la Provincia de Buenos Aires. No se pueden crear, editar ni eliminar porque afectaría al uso del sistema."
      :links="headerButtons"
    />
    <UPageBody>
      <UPageCard v-if="status === 'pending'">
        Cargando regiones...
      </UPageCard>

      <AppTable
        v-else
        zebra
        :empty="!regions || regions.length === 0"
      >
        <template #thead>
          <tr>
            <th>Nombre</th>
            <th class="text-center">
              Slug
            </th>
          </tr>
        </template>

        <template #tbody>
          <tr
            v-for="region in regions || []"
            :key="region.id"
          >
            <td>{{ region.name }}</td>
            <td class="text-center font-mono text-xs">
              {{ region.slug }}
            </td>
          </tr>
        </template>

        <template #empty>
          <UEmpty
            icon="lucide:map-pinned"
            title="No hay regiones"
            description="Ejecutá el seed de regiones para poblar el catálogo."
          />
        </template>
      </AppTable>
    </UPageBody>
  </div>
</template>
