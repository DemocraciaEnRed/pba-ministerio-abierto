<script setup lang="ts">
import type { AdminSection } from '~/components/admin/SectionFormModal.vue'

definePageMeta({
  layout: 'admin-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Tipos de consulta')

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()
const { data: sections, status, refresh } = await useAsyncData('admin-sections', () =>
  requestFetch<AdminSection[]>('/api/sections')
)

const formOpen = ref(false)
const editingSection = ref<AdminSection | null>(null)

function openEdit(section: AdminSection) {
  editingSection.value = section
  formOpen.value = true
}
</script>

<template>
  <UPage>
    <UPageHeader
      title="Tipos de consulta"
      description="Catálogo base del sistema: define la estructura de cada consulta y agrupa sus ejes de gestión. No se crean ni se eliminan; sí podés ajustar cómo se presentan."
    />

    <UPageBody>
      <UPageCard v-if="status === 'pending'">
        Cargando tipos de consulta...
      </UPageCard>

      <AppTable
        v-else
        zebra
        align-last-right
        :empty="!sections || sections.length === 0"
      >
        <template #thead>
          <tr>
            <th class="text-center">
              Orden
            </th>
            <th>Nombre</th>
            <th class="text-center">
              Slug
            </th>
            <th class="text-center">
              Estado
            </th>
            <th>Acciones</th>
          </tr>
        </template>

        <template #tbody>
          <tr
            v-for="section in sections || []"
            :key="section.id"
          >
            <td class="text-center">
              {{ section.displayOrder }}
            </td>
            <td>{{ section.name }}</td>
            <td class="text-center font-mono text-xs">
              {{ section.slug }}
            </td>
            <td class="text-center">
              <UBadge
                :label="section.isActive ? 'Activa' : 'Inactiva'"
                :color="section.isActive ? 'success' : 'neutral'"
                variant="outline"
              />
            </td>
            <td>
              <UButton
                size="xs"
                label="Editar"
                icon="lucide:pencil"
                color="neutral"
                variant="subtle"
                @click="openEdit(section)"
              />
            </td>
          </tr>
        </template>

        <template #empty>
          <UEmpty
            icon="lucide:layout-grid"
            title="No hay tipos de consulta"
            description="Corré el seed base para cargar el catálogo del sistema."
          />
        </template>
      </AppTable>
    </UPageBody>

    <AdminSectionFormModal
      v-model:open="formOpen"
      :initial-values="editingSection"
      @saved="refresh"
    />
  </UPage>
</template>
