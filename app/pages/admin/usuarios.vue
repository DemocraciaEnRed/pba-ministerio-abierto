<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

definePageMeta({
  layout: 'admin-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Usuarios')

interface AdminUserItem {
  id: number
  email: string
  displayName: string | null
  firstName: string | null
  lastName: string | null
  status: 'active' | 'inactive' | 'suspended'
  roles: {
    isPlatformAdmin: boolean
    isCollaborator: boolean
  }
}

interface UsersResponse {
  items: AdminUserItem[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

const toast = useToast()

const filters = reactive({
  q: '',
  status: '',
  role: '',
  page: 1,
  perPage: 20
})

const queryParams = computed(() => ({
  ...(filters.q ? { q: filters.q } : {}),
  ...(filters.status ? { status: filters.status } : {}),
  ...(filters.role ? { role: filters.role } : {}),
  page: filters.page,
  perPage: filters.perPage
}))

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()
const { data, status, refresh } = await useAsyncData(
  'admin-users',
  () => requestFetch<UsersResponse>('/api/users', { query: queryParams.value }),
  { watch: [queryParams] }
)

function nextPage() {
  if (!data.value) return
  if (filters.page < data.value.pagination.totalPages) {
    filters.page += 1
  }
}

function prevPage() {
  if (filters.page > 1) {
    filters.page -= 1
  }
}

function applyFilters() {
  filters.page = 1
}

function userLabel(user: AdminUserItem) {
  return user.displayName
    || `${user.firstName || ''} ${user.lastName || ''}`.trim()
    || 'Sin nombre'
}

const statusMeta: Record<AdminUserItem['status'], { label: string, color: 'success' | 'error' | 'neutral' }> = {
  active: { label: 'Activo', color: 'success' },
  inactive: { label: 'Inactivo', color: 'neutral' },
  suspended: { label: 'Suspendido', color: 'error' }
}

// Confirmación genérica: una sola ConfirmModal para todas las acciones de fila.
type ConfirmColor = 'success' | 'error' | 'primary' | 'neutral'

const confirmOpen = ref(false)
const confirmLoading = ref(false)
const confirmConfig = reactive({
  title: '',
  description: '',
  confirmLabel: 'Confirmar',
  confirmColor: 'primary' as ConfirmColor
})

let pendingAction: (() => Promise<void>) | null = null

function requestConfirm(
  config: { title: string, description: string, confirmLabel: string, confirmColor: ConfirmColor },
  action: () => Promise<void>
) {
  Object.assign(confirmConfig, config)
  pendingAction = action
  confirmOpen.value = true
}

async function onConfirm() {
  if (!pendingAction) return
  confirmLoading.value = true

  try {
    await pendingAction()
    confirmOpen.value = false
    pendingAction = null
    await refresh()
  } catch (error) {
    const e = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'No se pudo completar la acción',
      description: e.data?.message || e.message || 'Ocurrió un error inesperado.',
      color: 'error'
    })
  } finally {
    confirmLoading.value = false
  }
}

function askUpdateStatus(user: AdminUserItem, nextStatus: 'active' | 'suspended') {
  const name = userLabel(user)
  requestConfirm(
    nextStatus === 'active'
      ? {
          title: 'Activar usuario',
          description: `¿Seguro que querés activar la cuenta de «${name}»?`,
          confirmLabel: 'Activar',
          confirmColor: 'success'
        }
      : {
          title: 'Suspender usuario',
          description: `¿Seguro que querés suspender la cuenta de «${name}»? No podrá iniciar sesión hasta que la reactives.`,
          confirmLabel: 'Suspender',
          confirmColor: 'error'
        },
    async () => {
      await $fetch(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        body: { status: nextStatus }
      })
      toast.add({ title: 'Estado actualizado', color: 'success' })
    }
  )
}

function askTogglePlatformAdmin(user: AdminUserItem) {
  const name = userLabel(user)
  const removing = user.roles.isPlatformAdmin
  requestConfirm(
    removing
      ? {
          title: 'Quitar administrador',
          description: `¿Seguro que querés quitarle el rol de administrador a «${name}»?`,
          confirmLabel: 'Quitar admin',
          confirmColor: 'error'
        }
      : {
          title: 'Hacer administrador',
          description: `¿Seguro que querés darle el rol de administrador de plataforma a «${name}»?`,
          confirmLabel: 'Hacer admin',
          confirmColor: 'primary'
        },
    async () => {
      if (removing) {
        await $fetch(`/api/users/${user.id}/platform-roles/platform_admin`, { method: 'DELETE' })
      } else {
        await $fetch(`/api/users/${user.id}/platform-roles`, {
          method: 'POST',
          body: { role: 'platform_admin' }
        })
      }
      toast.add({ title: 'Roles actualizados', color: 'success' })
    }
  )
}

function askToggleCollaborator(user: AdminUserItem) {
  const name = userLabel(user)
  const removing = user.roles.isCollaborator
  requestConfirm(
    removing
      ? {
          title: 'Quitar colaborador/a',
          description: `¿Seguro que querés quitarle el rol de colaborador/a a «${name}»?`,
          confirmLabel: 'Quitar colaborador/a',
          confirmColor: 'error'
        }
      : {
          title: 'Hacer colaborador/a',
          description: `¿Seguro que querés darle el rol de colaborador/a a «${name}»?`,
          confirmLabel: 'Hacer colaborador/a',
          confirmColor: 'primary'
        },
    async () => {
      if (removing) {
        await $fetch(`/api/users/${user.id}/platform-roles/collaborator`, { method: 'DELETE' })
      } else {
        await $fetch(`/api/users/${user.id}/platform-roles`, {
          method: 'POST',
          body: { role: 'collaborator' }
        })
      }
      toast.add({ title: 'Roles actualizados', color: 'success' })
    }
  )
}

function rowActions(user: AdminUserItem): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = []

  if (user.status !== 'active') {
    items.push({
      label: 'Activar',
      icon: 'lucide:circle-check',
      color: 'success',
      onClick: () => askUpdateStatus(user, 'active')
    })
  }

  if (user.status !== 'suspended') {
    items.push({
      label: 'Suspender',
      icon: 'lucide:circle-slash',
      color: 'error',
      onClick: () => askUpdateStatus(user, 'suspended')
    })
  }

  items.push({
    label: user.roles.isPlatformAdmin ? 'Quitar admin' : 'Hacer admin',
    icon: 'lucide:shield',
    onClick: () => askTogglePlatformAdmin(user)
  })

  if (!user.roles.isPlatformAdmin) {
    items.push({
      label: user.roles.isCollaborator ? 'Quitar colaborador/a' : 'Hacer colaborador/a',
      icon: 'lucide:users',
      onClick: () => askToggleCollaborator(user)
    })
  }

  return items
}
</script>

<template>
  <UPage>
    <UPageHeader
      title="Usuarios"
      description="Administrá estado de cuenta y roles de plataforma."
    />

    <UPageBody>
      <UPageCard class="space-y-4">
        <div class="grid gap-3 md:grid-cols-4">
          <UInput
            v-model="filters.q"
            placeholder="Buscar por email o nombre"
            class="w-full md:col-span-2"
            @keydown.enter="applyFilters"
          />

          <select
            v-model="filters.status"
            class="border border-default rounded-md px-3 py-2 bg-default"
          >
            <option value="">
              Todos los estados
            </option>
            <option value="active">
              Activo
            </option>
            <option value="inactive">
              Inactivo
            </option>
            <option value="suspended">
              Suspendido
            </option>
          </select>

          <select
            v-model="filters.role"
            class="border border-default rounded-md px-3 py-2 bg-default"
          >
            <option value="">
              Todos los roles
            </option>
            <option value="platform_admin">
              Platform admin
            </option>
            <option value="collaborator">
              Colaborador/a
            </option>
          </select>
        </div>

        <div class="flex justify-end">
          <UButton
            label="Aplicar filtros"
            icon="i-lucide-filter"
            @click="applyFilters"
          />
        </div>
      </UPageCard>

      <UPageCard v-if="status === 'pending'">
        Cargando usuarios...
      </UPageCard>

      <template v-else>
        <AppTable
          zebra
          align-last-right
          :empty="!data || data.items.length === 0"
        >
          <template #thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th class="text-center">
                Estado
              </th>
              <th class="text-center">
                Rol plataforma
              </th>
              <th>Acciones</th>
            </tr>
          </template>

          <template #tbody>
            <tr
              v-for="user in data?.items || []"
              :key="user.id"
            >
              <td>{{ userLabel(user) }}</td>
              <td class="text-toned">
                {{ user.email }}
              </td>
              <td class="text-center">
                <UBadge
                  :label="statusMeta[user.status].label"
                  :color="statusMeta[user.status].color"
                  variant="subtle"
                />
              </td>
              <td class="text-center">
                <div class="flex flex-wrap justify-center gap-1">
                  <UBadge
                    v-if="user.roles.isPlatformAdmin"
                    label="Admin"
                    color="primary"
                    variant="subtle"
                  />
                  <UBadge
                    v-if="user.roles.isCollaborator"
                    label="Colaborador/a"
                    color="info"
                    variant="subtle"
                  />
                  <UBadge
                    v-if="!user.roles.isPlatformAdmin && !user.roles.isCollaborator"
                    label="Ciudadano/a"
                    color="neutral"
                    variant="subtle"
                  />
                </div>
              </td>
              <td>
                <UDropdownMenu
                  :items="rowActions(user)"
                  :content="{
                    align: 'end',
                    side: 'bottom',
                    sideOffset: 8
                  }"
                  size="sm"
                >
                  <UButton
                    label="Acciones"
                    icon="lucide:chevron-down"
                    color="neutral"
                    variant="subtle"
                    size="xs"
                    trailing
                  />
                </UDropdownMenu>
              </td>
            </tr>
          </template>

          <template #empty>
            <UEmpty
              icon="lucide:users"
              title="No hay usuarios"
              description="Ajustá los filtros para ver más resultados."
            />
          </template>
        </AppTable>

        <div class="flex items-center justify-between mt-4">
          <p class="text-sm text-toned">
            {{ data?.pagination.total || 0 }} usuarios
          </p>

          <div class="flex gap-2">
            <UButton
              label="Anterior"
              color="neutral"
              variant="ghost"
              :disabled="!data || data.pagination.page <= 1"
              @click="prevPage"
            />
            <UButton
              label="Siguiente"
              color="neutral"
              variant="ghost"
              :disabled="!data || data.pagination.page >= data.pagination.totalPages"
              @click="nextPage"
            />
          </div>
        </div>
      </template>
    </UPageBody>

    <ConfirmModal
      v-model:open="confirmOpen"
      :title="confirmConfig.title"
      :description="confirmConfig.description"
      :confirm-label="confirmConfig.confirmLabel"
      :confirm-color="confirmConfig.confirmColor"
      :loading="confirmLoading"
      @confirm="onConfirm"
    />
  </UPage>
</template>
