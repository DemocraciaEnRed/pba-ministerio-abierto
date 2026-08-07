<script setup lang="ts">
import type { CommentMetricsRange, ConsultationCommentMetrics } from '~/types/consulta'

const props = defineProps<{ slug: string }>()

const range = ref<CommentMetricsRange>('14d')
const rangeOptions: { label: string, value: CommentMetricsRange }[] = [
  { label: 'Últimos 7 días', value: '7d' },
  { label: 'Últimos 14 días', value: '14d' },
  { label: 'Este mes', value: 'month' },
  { label: 'Siempre', value: 'all' }
]

// `useRequestFetch` reenvía la cookie de sesión durante el SSR: el endpoint es
// solo para gestores de la consulta.
const requestFetch = useRequestFetch()
const { data: metrics, status } = await useAsyncData(
  () => `admin-consultation-comment-metrics-${props.slug}-${range.value}`,
  () => requestFetch<ConsultationCommentMetrics>(
    `/api/consultations/${props.slug}/comment-metrics`,
    { query: { range: range.value } }
  ),
  { watch: [range, () => props.slug] }
)

const loading = computed(() => status.value === 'pending')
const delta = computed(() =>
  metrics.value ? formatDelta(metrics.value.deltaAbs, metrics.value.deltaPct) : null
)

const moderatedCount = computed(() => (metrics.value?.hidden ?? 0) + (metrics.value?.deleted ?? 0))

const repliesHint = computed(() => {
  const data = metrics.value
  if (!data || data.total === 0) return 'Sin comentarios en el período'
  return `${Math.round((data.replies / data.total) * 100)}% del total del período`
})

const periodLabel = computed(() =>
  range.value === 'all' ? 'histórico' : rangeOptions.find(option => option.value === range.value)?.label.toLowerCase() ?? ''
)
</script>

<template>
  <section class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="space-y-0.5">
        <h2 class="text-sm font-medium text-muted">
          Actividad
        </h2>
        <p
          v-if="metrics"
          class="text-xs text-muted"
        >
          {{ metrics.allTimeTotal }} {{ metrics.allTimeTotal === 1 ? 'comentario' : 'comentarios' }} desde el inicio
        </p>
      </div>
      <USelect
        v-model="range"
        :items="rangeOptions"
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
        :hint="`${metrics?.topLevel ?? 0} de primer nivel · ${metrics?.replies ?? 0} respuestas`"
        :to="`/consultas/${slug}/panel/comentarios`"
      >
        <div class="flex items-baseline gap-2">
          <span class="text-lg font-semibold text-highlighted">{{ loading ? '—' : metrics?.total ?? 0 }}</span>
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
        :value="loading ? '—' : metrics?.replies ?? 0"
        :hint="repliesHint"
      />

      <AdminPanelStat
        icon="i-lucide-shield-alert"
        label="Moderados"
        :value="loading ? '—' : moderatedCount"
        :color="moderatedCount > 0 ? 'warning' : 'neutral'"
        :hint="`${metrics?.hidden ?? 0} ocultos · ${metrics?.deleted ?? 0} eliminados`"
        :to="`/consultas/${slug}/panel/comentarios`"
      />

      <AdminPanelStat
        icon="i-lucide-activity"
        label="Última actividad"
        :value="metrics?.lastCommentAt ? formatDateShort(metrics.lastCommentAt) : 'Sin comentarios'"
        :hint="metrics?.lastCommentAt ? fromNow(metrics.lastCommentAt) : `Sin registros (${periodLabel})`"
      />
    </div>
  </section>
</template>
