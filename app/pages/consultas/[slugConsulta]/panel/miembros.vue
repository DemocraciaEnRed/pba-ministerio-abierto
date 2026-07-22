<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import type { ConsultationMember } from '~/components/admin/ConsultationMemberFormModal.vue'

definePageMeta({
  layout: 'consultas-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Miembros')

const { slug } = useConsultationAdmin()
const { user } = useUserSession()
const toast = useToast()

interface MembersResponse {
  consultation: { id: number, title: string }
  items: ConsultationMember[]
}

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()
const { data, status, refresh } = await useAsyncData(
  `consultation-members-${slug.value}`,
  () => requestFetch<MembersResponse>(`/api/consultations/${slug.value}/members`),
  { watch: [slug] }
)

const members = computed(() => data.value?.items ?? [])
const currentUserId = computed(() => user.value?.id ?? null)
const adminCount = computed(() =>
  members.value.filter(member => member.role === 'consultation_admin').length
)

const formOpen = ref(false)

const confirmOpen = ref(false)
const removeTarget = ref<ConsultationMember | null>(null)
const removing = ref(false)

function openCreate() {
  formOpen.value = true
}

function memberName(member: ConsultationMember): string {
  return member.user.displayName
    || [member.user.firstName, member.user.lastName].filter(Boolean).join(' ')
    || member.user.email
}

function roleLabel(role: string): string {
  if (role === 'consultation_admin') return 'Administrador'
  return role
}

function isSelf(member: ConsultationMember): boolean {
  return member.userId === currentUserId.value
}

function isLastAdmin(member: ConsultationMember): boolean {
  return member.role === 'consultation_admin' && adminCount.value === 1
}

function canRemove(member: ConsultationMember): boolean {
  return !isSelf(member) && !isLastAdmin(member)
}

function removeReason(member: ConsultationMember): string | undefined {
  if (isSelf(member)) return 'No podés quitarte a vos mismo de la consulta.'
  if (isLastAdmin(member)) return 'No podés quitar al último administrador de la consulta.'
  return undefined
}

function askRemove(member: ConsultationMember) {
  removeTarget.value = member
  confirmOpen.value = true
}

async function confirmRemove() {
  if (!removeTarget.value) return
  removing.value = true

  try {
    await $fetch(`/api/consultations/${slug.value}/members/${removeTarget.value.userId}`, {
      method: 'DELETE'
    })
    toast.add({
      title: 'Miembro quitado',
      color: 'success'
    })
    confirmOpen.value = false
    removeTarget.value = null
    await refresh()
  } catch (error) {
    toast.add({
      title: 'No se pudo quitar el miembro',
      description: getErrorMessage(error),
      color: 'error'
    })
  } finally {
    removing.value = false
  }
}

const pageActions = computed<ButtonProps[]>(() => [
  {
    label: 'Agregar miembro',
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
      title="Miembros y roles"
      description="Gestioná las personas que administran esta consulta."
      :links="pageActions"
    />

    <UPageBody>
      <UPageCard v-if="status === 'pending'">
        Cargando miembros...
      </UPageCard>

      <AppTable
        v-else
        zebra
        align-last-right
        :empty="members.length === 0"
      >
        <template #thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th class="text-center">
              Rol
            </th>
            <th>Asignado por</th>
            <th class="text-center">
              Fecha
            </th>
            <th>Acciones</th>
          </tr>
        </template>

        <template #tbody>
          <tr
            v-for="member in members"
            :key="member.id"
          >
            <td>
              <div class="flex items-center gap-2">
                <span>{{ memberName(member) }}</span>
                <UBadge
                  v-if="isSelf(member)"
                  label="Vos"
                  color="primary"
                  variant="subtle"
                  size="sm"
                />
                <UBadge
                  v-if="member.user.roles.isPlatformAdmin"
                  label="Admin de plataforma"
                  color="neutral"
                  variant="subtle"
                  size="sm"
                />
              </div>
            </td>
            <td class="text-xs">
              {{ member.user.email }}
            </td>
            <td class="text-center">
              <UBadge
                :label="roleLabel(member.role)"
                color="primary"
                variant="outline"
              />
            </td>
            <td class="text-xs">
              {{ member.assignedBy ? (member.assignedBy.displayName || member.assignedBy.email) : '—' }}
            </td>
            <td class="text-center text-xs">
              {{ formatDateShort(member.assignedAt) }}
            </td>
            <td>
              <UTooltip
                :text="removeReason(member)"
                :disabled="canRemove(member)"
              >
                <UButton
                  label="Quitar"
                  icon="lucide:user-minus"
                  color="error"
                  variant="subtle"
                  size="xs"
                  :disabled="!canRemove(member)"
                  @click="askRemove(member)"
                />
              </UTooltip>
            </td>
          </tr>
        </template>

        <template #empty>
          <UEmpty
            icon="lucide:users"
            title="No hay miembros"
            description="Agregá administradores para esta consulta con el botón de arriba."
          />
        </template>
      </AppTable>
    </UPageBody>

    <AdminConsultationMemberFormModal
      v-model:open="formOpen"
      :consultation-slug="slug"
      @saved="refresh"
    />

    <ConfirmModal
      v-model:open="confirmOpen"
      title="Quitar miembro"
      :description="removeTarget ? `¿Seguro que querés quitar a «${memberName(removeTarget)}» de esta consulta?` : ''"
      confirm-label="Quitar"
      confirm-color="error"
      :loading="removing"
      @confirm="confirmRemove"
    />
  </UPage>
</template>
