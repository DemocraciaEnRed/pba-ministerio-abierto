<script setup lang="ts">
import type { CommentMetrics, CommentMetricsRange } from '~/types/consulta'

defineOptions({ name: 'ObservatorioPanelOverviewStats' })

interface WorkGroupCount {
  id: number
  slug: string
  name: string
  color: string
  iconColor: string
  icon: string
  consultationsCount: number
}

interface OverviewResponse {
  range: CommentMetricsRange
  consultations: { total: number, scheduled: number, open: number, closed: number }
  workGroups: { withoutWorkGroup: number, items: WorkGroupCount[] }
  activity: CommentMetrics
  since: string | null
}

const range = ref<CommentMetricsRange>('14d')

// `useRequestFetch` reenvía la cookie de sesión durante el SSR: el endpoint es
// solo para administradores de plataforma.
const requestFetch = useRequestFetch()
const { data: overview, status } = await useAsyncData(
  () => `admin-observatory-overview-${range.value}`,
  () => requestFetch<OverviewResponse>('/api/admin/observatory/overview', {
    query: { range: range.value }
  }),
  { watch: [range] }
)

const loading = computed(() => status.value === 'pending')
const activity = computed(() => overview.value?.activity)
const delta = computed(() =>
  activity.value ? formatDelta(activity.value.deltaAbs, activity.value.deltaPct) : null
)

const moderatedCount = computed(() => (activity.value?.hidden ?? 0) + (activity.value?.deleted ?? 0))
const periodLabel = computed(() => commentMetricsPeriodLabel(range.value))
const workGroups = computed(() => overview.value?.workGroups.items ?? [])

const consultationsHint = computed(() => {
  const consultations = overview.value?.consultations
  if (!consultations) return undefined
  const published = consultations.scheduled + consultations.open + consultations.closed
  const unpublished = consultations.total - published
  return unpublished > 0
    ? `${consultations.total} en total · ${unpublished} sin publicar`
    : `${consultations.total} en total`
})

const withoutWorkGroupHint = computed(() => {
  const withoutWorkGroup = overview.value?.workGroups.withoutWorkGroup ?? 0
  return withoutWorkGroup > 0
    ? `${withoutWorkGroup} sin grupo de trabajo asignado`
    : 'Todas tienen grupo de trabajo'
})

const repliesHint = computed(() => {
  const data = activity.value
  if (!data || data.total === 0) return 'Sin comentarios en el período'
  return `${Math.round((data.replies / data.total) * 100)}% del total del período`
})
</script>

<template>
  <div class="space-y-6">
    <section class="space-y-3">
      <h2 class="text-sm font-medium text-muted">
        Resumen
      </h2>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminPanelStat
          icon="i-lucide-message-square"
          label="Consultas del Observatorio"
          color="primary"
          :value="loading ? '—' : overview?.consultations.total ?? 0"
          :hint="withoutWorkGroupHint"
          to="/observatorio-obras-servicios/panel/consultas"
        />

        <AdminPanelStat
          icon="i-lucide-calendar-clock"
          label="Programadas"
          :value="loading ? '—' : overview?.consultations.scheduled ?? 0"
          :hint="consultationsHint"
          to="/observatorio-obras-servicios/panel/consultas"
        />

        <AdminPanelStat
          icon="i-lucide-play-circle"
          label="Abiertas"
          :color="(overview?.consultations.open ?? 0) > 0 ? 'success' : 'neutral'"
          :value="loading ? '—' : overview?.consultations.open ?? 0"
          hint="Reciben participación en este momento"
          to="/observatorio-obras-servicios/panel/consultas"
        />

        <AdminPanelStat
          icon="i-lucide-check-circle-2"
          label="Cerradas"
          :value="loading ? '—' : overview?.consultations.closed ?? 0"
          hint="Con la participación ya cerrada"
          to="/observatorio-obras-servicios/panel/consultas"
        />
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="text-sm font-medium text-muted">
        Consultas por grupo de trabajo
      </h2>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="group in workGroups"
          :key="group.id"
          class="flex items-center gap-3 rounded-lg p-3"
          :style="{ backgroundColor: group.color }"
        >
          <UIcon
            :name="group.icon"
            class="size-7 shrink-0"
            :style="{ color: group.iconColor }"
          />
          <div :style="{ color: group.iconColor }">
            <p class="text-lg font-semibold leading-none">
              {{ loading ? '—' : group.consultationsCount }}
            </p>
            <p class="text-xs leading-tight opacity-90">
              {{ group.name }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="space-y-0.5">
          <h2 class="text-sm font-medium text-muted">
            Actividad general
          </h2>
          <p
            v-if="activity"
            class="text-xs text-muted"
          >
            {{ activity.allTimeTotal }} {{ activity.allTimeTotal === 1 ? 'comentario' : 'comentarios' }} desde el inicio
          </p>
        </div>
        <USelect
          v-model="range"
          :items="COMMENT_METRICS_RANGE_OPTIONS"
          size="sm"
          icon="i-lucide-calendar-range"
          class="w-44"
          aria-label="Rango de actividad"
        />
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
