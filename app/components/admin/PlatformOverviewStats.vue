<script setup lang="ts">
import type { CommentMetrics, CommentMetricsRange } from '~/types/consulta'

interface OverviewResponse {
  range: CommentMetricsRange
  users: { total: number, inRange: number }
  consultations: { total: number, scheduled: number, open: number, closed: number, hidden: number, archived: number }
  activity: CommentMetrics
}

const range = ref<CommentMetricsRange>('14d')

// `useRequestFetch` reenvía la cookie de sesión durante el SSR: el endpoint es
// solo para administradores de plataforma.
const requestFetch = useRequestFetch()
const { data: overview, status } = await useAsyncData(
  () => `admin-platform-overview-${range.value}`,
  () => requestFetch<OverviewResponse>('/api/admin/overview', { query: { range: range.value } }),
  { watch: [range] }
)

const loading = computed(() => status.value === 'pending')
const activity = computed(() => overview.value?.activity)
const delta = computed(() =>
  activity.value ? formatDelta(activity.value.deltaAbs, activity.value.deltaPct) : null
)

const moderatedCount = computed(() => (activity.value?.hidden ?? 0) + (activity.value?.deleted ?? 0))
const periodLabel = computed(() => commentMetricsPeriodLabel(range.value))

const newUsersHint = computed(() =>
  range.value === 'all' ? 'Desde el inicio' : `Registros ${periodLabel.value}`
)

const consultationsTotalHint = computed(() => {
  const consultations = overview.value?.consultations
  if (!consultations) return undefined
  return `${consultations.total} ${consultations.total === 1 ? 'consulta' : 'consultas'} en total`
})

const repliesHint = computed(() => {
  const data = activity.value
  if (!data || data.total === 0) return 'Sin comentarios en el período'
  return `${Math.round((data.replies / data.total) * 100)}% del total del período`
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-xs text-muted">
        Los indicadores por período usan el rango seleccionado.
      </p>
      <USelect
        v-model="range"
        :items="COMMENT_METRICS_RANGE_OPTIONS"
        size="sm"
        icon="i-lucide-calendar-range"
        class="w-44"
        aria-label="Rango del período"
      />
    </div>

    <section class="space-y-3">
      <h2 class="text-sm font-medium text-muted">
        Usuarios
      </h2>

      <div class="grid gap-3 sm:grid-cols-2">
        <AdminPanelStat
          icon="i-lucide-users"
          label="Usuarios registrados"
          color="primary"
          :value="loading ? '—' : overview?.users.total ?? 0"
          hint="Total de cuentas en la plataforma"
          to="/admin/usuarios"
        />

        <AdminPanelStat
          icon="i-lucide-user-plus"
          label="Nuevos registros"
          :value="loading ? '—' : overview?.users.inRange ?? 0"
          :hint="newUsersHint"
          to="/admin/usuarios"
        />
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="text-sm font-medium text-muted">
        Consultas
      </h2>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <AdminPanelStat
          icon="i-lucide-calendar-clock"
          label="Programadas"
          :value="loading ? '—' : overview?.consultations.scheduled ?? 0"
          :hint="consultationsTotalHint"
          to="/admin/consultas"
        />

        <AdminPanelStat
          icon="i-lucide-play-circle"
          label="Abiertas"
          :color="(overview?.consultations.open ?? 0) > 0 ? 'success' : 'neutral'"
          :value="loading ? '—' : overview?.consultations.open ?? 0"
          hint="Reciben participación"
          to="/admin/consultas"
        />

        <AdminPanelStat
          icon="i-lucide-check-circle-2"
          label="Realizadas"
          :value="loading ? '—' : overview?.consultations.closed ?? 0"
          hint="Participación cerrada"
          to="/admin/consultas"
        />

        <AdminPanelStat
          icon="i-lucide-eye-off"
          label="Ocultas"
          :color="(overview?.consultations.hidden ?? 0) > 0 ? 'warning' : 'neutral'"
          :value="loading ? '—' : overview?.consultations.hidden ?? 0"
          hint="No visibles al público"
          to="/admin/consultas"
        />

        <AdminPanelStat
          icon="i-lucide-archive"
          label="Archivadas"
          :value="loading ? '—' : overview?.consultations.archived ?? 0"
          hint="Fuera del listado público"
          to="/admin/consultas"
        />
      </div>
    </section>

    <section class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="space-y-0.5">
          <h2 class="text-sm font-medium text-muted">
            Actividad
          </h2>
          <p
            v-if="activity"
            class="text-xs text-muted"
          >
            {{ activity.allTimeTotal }} {{ activity.allTimeTotal === 1 ? 'comentario' : 'comentarios' }} desde el inicio
          </p>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminPanelStat
          icon="i-lucide-message-square"
          label="Comentarios nuevos"
          :hint="`${activity?.topLevel ?? 0} de primer nivel · ${activity?.replies ?? 0} respuestas`"
        >
          <div class="flex items-baseline gap-2">
            <span class="text-lg font-semibold text-highlighted">{{ loading ? '—' : activity?.total ?? 0 }}</span>
            <span
              v-if="delta && !loading"
              class="inline-flex items-center gap-0.5 text-xs font-medium"
              :class="delta.class"
            >
              <UIcon
                :name="delta.icon"
                class="size-3.5"
              />
              {{ delta.label }}
            </span>
          </div>
        </AdminPanelStat>

        <AdminPanelStat
          icon="i-lucide-corner-down-right"
          label="Respuestas"
          :value="loading ? '—' : activity?.replies ?? 0"
          :hint="repliesHint"
        />

        <AdminPanelStat
          icon="i-lucide-shield-alert"
          label="Moderados"
          :value="loading ? '—' : moderatedCount"
          :color="moderatedCount > 0 ? 'warning' : 'neutral'"
          :hint="`${activity?.hidden ?? 0} ocultos · ${activity?.deleted ?? 0} eliminados`"
        />

        <AdminPanelStat
          icon="i-lucide-activity"
          label="Última actividad"
          :value="activity?.lastCommentAt ? formatDateShort(activity.lastCommentAt) : 'Sin comentarios'"
          :hint="activity?.lastCommentAt ? fromNow(activity.lastCommentAt) : `Sin registros (${periodLabel})`"
        />
      </div>
    </section>
  </div>
</template>
