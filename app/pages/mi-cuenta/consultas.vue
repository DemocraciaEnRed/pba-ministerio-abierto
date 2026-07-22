<script setup lang="ts">
import { consultationStateBadge } from '~/utils/estados'
import { formatDate } from '~/utils/dates'
import type { ParticipationState, Visibility } from '~/types/consulta'

definePageMeta({
  layout: 'mi-cuenta-control-panel',
  middleware: ['auth', 'collaborator']
})

usePrivatePageSeo('Mis consultas')

type ConsultationRole = 'consultation_admin'

interface MyConsultationItem {
  id: number
  slug: string
  title: string
  summary: string | null
  visibility: Visibility
  participationState: ParticipationState
  startsAt: string | null
  endsAt: string | null
  membership: {
    role: ConsultationRole
    assignedAt: string
  }
}

interface MyConsultationsResponse {
  items: MyConsultationItem[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

const roleLabels: Record<ConsultationRole, string> = {
  consultation_admin: 'Administrador/a'
}

const filters = reactive({
  page: 1,
  perPage: 20
})

const queryParams = computed(() => ({
  page: filters.page,
  perPage: filters.perPage
}))

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista del usuario logueado.
const requestFetch = useRequestFetch()
const { data, status } = await useAsyncData(
  'mi-cuenta-consultas',
  () => requestFetch<MyConsultationsResponse>('/api/me/consultations', { query: queryParams.value }),
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
</script>

<template>
  <UPageBody>
    <UPageHeader
      title="Mis consultas"
      description="Consultas en las que tenés un rol de gestión (administración o moderación)."
    />

    <UPageCard v-if="status === 'pending'">
      Cargando consultas…
    </UPageCard>

    <template v-else>
      <UPageCard v-if="!data || data.items.length === 0">
        <p class="text-sm text-muted">
          Todavía no tenés consultas asignadas para gestionar.
        </p>
      </UPageCard>

      <template v-else>
        <UPageCard
          v-for="item in data.items"
          :key="item.id"
          :to="`/consultas/${item.slug}/panel`"
          class="space-y-2"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1">
              <p class="font-medium">
                {{ item.title }}
              </p>
              <p
                v-if="item.summary"
                class="text-sm text-muted line-clamp-2"
              >
                {{ item.summary }}
              </p>
            </div>
            <div class="flex flex-col items-end gap-1 shrink-0">
              <UBadge
                :label="consultationStateBadge(item.visibility, item.participationState).label"
                :color="consultationStateBadge(item.visibility, item.participationState).color"
                variant="subtle"
              />
              <UBadge
                :label="roleLabels[item.membership.role]"
                color="info"
                variant="subtle"
              />
            </div>
          </div>

          <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span v-if="item.startsAt">Inicio: {{ formatDate(item.startsAt) }}</span>
            <span v-if="item.endsAt">Cierre: {{ formatDate(item.endsAt) }}</span>
          </div>
        </UPageCard>

        <div class="flex items-center justify-between mt-2">
          <p class="text-sm text-toned">
            {{ data.pagination.total }} consultas
          </p>

          <div class="flex gap-2">
            <UButton
              label="Anterior"
              color="neutral"
              variant="ghost"
              :disabled="data.pagination.page <= 1"
              @click="prevPage"
            />
            <UButton
              label="Siguiente"
              color="neutral"
              variant="ghost"
              :disabled="data.pagination.page >= data.pagination.totalPages"
              @click="nextPage"
            />
          </div>
        </div>
      </template>
    </template>
  </UPageBody>
</template>
