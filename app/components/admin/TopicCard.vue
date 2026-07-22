<script setup lang="ts">
import type { MechanismType, ParticipationState, Visibility } from '~/types/consulta'

interface AdminTopicListItem {
  id: number
  consultationId: number
  slug: string
  title: string
  summary: string | null
  displayOrder: number
  visibility: Visibility
  participationState: ParticipationState
  mechanismType: MechanismType | null
  participationOpen: boolean
  participationStartsAt: string | null
  participationEndsAt: string | null
}

const props = defineProps<{
  consultationSlug: string
  topic: AdminTopicListItem
}>()

const estadoBadge = computed(() =>
  topicStateBadge(props.topic.visibility, props.topic.participationState)
)

const mechanismLabels: Record<MechanismType, string> = {
  support: 'Apoyo',
  vote: 'Votación',
  survey: 'Encuesta'
}

const mechanismLabel = computed(() =>
  props.topic.mechanismType ? mechanismLabels[props.topic.mechanismType] : 'Sin método'
)

// La ventana de participación puede no estar definida (sin fechas propias).
const startLabel = computed(() =>
  props.topic.participationStartsAt ? formatDateShort(props.topic.participationStartsAt) : 'Sin fecha de inicio'
)

const endLabel = computed(() =>
  props.topic.participationEndsAt ? formatDateShort(props.topic.participationEndsAt) : 'Abierta indefinidamente'
)

const panelTo = computed(() => `/consultas/${props.consultationSlug}/panel/temas/${props.topic.slug}`)
const editTo = computed(() => `${panelTo.value}/editar`)
</script>

<template>
  <div class="rounded-lg border border-accented bg-elevated/30 transition-colors hover:border-primary/50">
    <!-- Cabecera: orden, título, estado y acciones -->
    <div class="flex items-start justify-between gap-3 p-4">
      <div class="flex min-w-0 items-start gap-3">
        <span
          class="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-elevated text-xs font-medium text-muted"
          aria-hidden="true"
        >
          {{ topic.displayOrder }}
        </span>
        <div class="min-w-0 space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <ULink
              :to="panelTo"
              class="truncate text-lg font-semibold text-highlighted hover:text-primary"
            >
              {{ topic.title }}
            </ULink>
            <UBadge
              :label="estadoBadge.label"
              :color="estadoBadge.color"
              :icon="estadoBadge.icon"
              variant="subtle"
            />
          </div>
          <p class="text-xs text-muted">
            {{ topic.slug }}
          </p>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <UButton
          label="Editar"
          icon="i-lucide-pencil"
          color="neutral"
          variant="outline"
          size="sm"
          :to="editTo"
        />
        <UButton
          label="Abrir panel"
          icon="i-lucide-layout-dashboard"
          color="primary"
          variant="soft"
          size="sm"
          :to="panelTo"
        />
      </div>
    </div>

    <USeparator />

    <!-- Cuerpo: resumen + metadatos -->
    <div class="space-y-2 p-4">
      <p class="line-clamp-2 text-xs text-muted">
        {{ topic.summary || 'Sin resumen.' }}
      </p>

      <!-- Ventana de participación -->
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span class="inline-flex items-center gap-1">
          <UIcon
            name="i-lucide-calendar-plus"
            class="size-3.5"
          />
          Inicio: <span class="text-toned">{{ startLabel }}</span>
        </span>
        <span class="inline-flex items-center gap-1">
          <UIcon
            name="i-lucide-calendar-x"
            class="size-3.5"
          />
          Cierre: <span class="text-toned">{{ endLabel }}</span>
        </span>
      </div>

      <!-- Metadatos: método y participación -->
      <div class="flex flex-wrap items-center gap-1.5">
        <UBadge
          :label="mechanismLabel"
          icon="i-lucide-sliders-horizontal"
          :color="topic.mechanismType ? 'neutral' : 'error'"
          variant="outline"
          size="sm"
        />
        <UBadge
          :label="topic.participationOpen ? 'Participación abierta' : 'Participación cerrada'"
          :icon="topic.participationOpen ? 'i-lucide-circle-play' : 'i-lucide-circle-x'"
          :color="topic.participationOpen ? 'success' : 'neutral'"
          variant="subtle"
          size="sm"
        />
      </div>
    </div>
  </div>
</template>
