<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'
import type { CalendarDate, DateValue } from '@internationalized/date'
import { getLocalTimeZone, today } from '@internationalized/date'
import type { PublicConsultationListItem } from '~/types/consulta'
import type { AgendaMilestoneKind } from '~/utils/agenda'
import {
  AGENDA_DAYS,
  buildAgendaMilestones,
  computeAgendaStats,
  formatAgendaDay,
  formatAgendaRelativeDay,
  formatAgendaTime,
  getAgendaWindow,
  groupMilestonesByDay
} from '~/utils/agenda'
import { getConsultationType } from '#shared/data/consultation-types'

interface ConsultationsResponse {
  items: PublicConsultationListItem[]
}

const INITIAL_VISIBLE_DAYS = 5

const now = new Date()
const { from, to } = getAgendaWindow(now)

const { data, status } = await useAsyncData(
  'home-agenda-consultations',
  () => $fetch<ConsultationsResponse>('/api/consultations', {
    query: {
      activeFrom: from.toISOString(),
      activeTo: to.toISOString(),
      perPage: 100
    }
  }),
  {
    server: false,
    lazy: true
  }
)

const consultations = computed(() => data.value?.items ?? [])
const milestones = computed(() => buildAgendaMilestones(consultations.value, from, to))
const days = computed(() => groupMilestonesByDay(milestones.value))
const stats = computed(() => computeAgendaStats(consultations.value, now, to))

// Indicadores: al hacer clic preseleccionan el estado del explorador y bajan hasta él.
const explorerState = useHomeExplorerState()
const explorerRegistrationOpen = useHomeExplorerRegistrationOpen()

const kpis = computed(() => [
  {
    key: 'open',
    value: stats.value.openNow,
    label: stats.value.openNow === 1 ? 'instancia abierta ahora' : 'instancias abiertas ahora',
    icon: 'lucide:circle-play',
    state: 'open' as const
  },
  {
    key: 'opens',
    value: stats.value.opensSoon,
    label: `${stats.value.opensSoon === 1 ? 'abre' : 'abren'} en los próximos ${AGENDA_DAYS} días`,
    icon: 'lucide:calendar-plus',
    state: 'scheduled' as const
  },
  {
    key: 'closes',
    value: stats.value.closesThisWeek,
    label: `${stats.value.closesThisWeek === 1 ? 'cierra' : 'cierran'} en los próximos 7 días`,
    icon: 'lucide:alarm-clock',
    state: 'open' as const
  },
  {
    key: 'registration',
    value: stats.value.registrationOpen,
    label: stats.value.registrationOpen === 1 ? 'instancia con inscripción presencial abierta' : 'instancias con inscripción presencial abierta',
    icon: 'lucide:ticket',
    state: 'all' as const,
    registrationOpen: true
  }
])

function goToExplorer(kpi: { state: 'all' | 'open' | 'scheduled', registrationOpen?: boolean }) {
  explorerState.value = kpi.state
  explorerRegistrationOpen.value = kpi.registrationOpen ?? false
  document.getElementById('explorador')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Calendario (solo desktop): seleccionar un día filtra la lista de hitos.
const tz = getLocalTimeZone()
const minDate = today(tz)
const maxDate = minDate.add({ days: AGENDA_DAYS })
const selectedDay = shallowRef<CalendarDate | undefined>()

const kindsByDay = computed(() => {
  const map = new Map<string, Set<AgendaMilestoneKind>>()
  for (const milestone of milestones.value) {
    const kinds = map.get(milestone.dayKey) ?? new Set<AgendaMilestoneKind>()
    kinds.add(milestone.kind)
    map.set(milestone.dayKey, kinds)
  }
  return map
})

/** Categorías visuales del calendario: un punto por categoría presente en el día. */
const dotCategories = [
  { key: 'opens', label: 'Abre la participación', kinds: ['opens'], class: 'bg-success' },
  { key: 'closes', label: 'Cierra la participación', kinds: ['closes'], class: 'bg-warning' },
  { key: 'registration', label: 'Inscripción presencial', kinds: ['registration_opens', 'registration_closes'], class: 'bg-info' },
  { key: 'event', label: 'Encuentro presencial', kinds: ['event'], class: 'bg-primary' }
] as const satisfies readonly { key: string, label: string, kinds: readonly AgendaMilestoneKind[], class: string }[]

/** Solo se pueden elegir los días que tienen hitos. */
function isDateWithoutMilestones(date: DateValue) {
  return !kindsByDay.value.has(date.toString())
}

function dayDots(dayKey: string) {
  const kinds = kindsByDay.value.get(dayKey)
  if (!kinds) return []
  return dotCategories.filter(category => category.kinds.some(kind => kinds.has(kind)))
}

const showAll = ref(false)

const visibleDays = computed(() => {
  if (selectedDay.value) {
    const key = selectedDay.value.toString()
    return days.value.filter(day => day.dayKey === key)
  }
  return showAll.value ? days.value : days.value.slice(0, INITIAL_VISIBLE_DAYS)
})

const hiddenDaysCount = computed(() =>
  selectedDay.value || showAll.value ? 0 : Math.max(days.value.length - INITIAL_VISIBLE_DAYS, 0)
)

const listTitle = computed(() =>
  selectedDay.value
    ? capitalize(formatAgendaDay(selectedDay.value.toDate(tz)))
    : 'Próximos hitos'
)

const milestoneBadge: Record<AgendaMilestoneKind, BadgeProps> = {
  opens: { label: 'Abre', color: 'success', variant: 'subtle', icon: 'lucide:door-open' },
  closes: { label: 'Cierra', color: 'warning', variant: 'subtle', icon: 'lucide:door-closed' },
  registration_opens: { label: 'Abre la inscripción', color: 'info', variant: 'subtle', icon: 'lucide:ticket' },
  registration_closes: { label: 'Cierra la inscripción', color: 'info', variant: 'subtle', icon: 'lucide:ticket-x' },
  event: { label: 'Encuentro presencial', color: 'primary', variant: 'solid', icon: 'lucide:users' }
}

type Milestone = (typeof milestones.value)[number]

/** Los hitos de inscripción llevan a la página de inscripción; el resto, a la instancia. */
function milestoneLink(milestone: Milestone) {
  const registration = milestone.item.registration
  if (registration && (milestone.kind === 'registration_opens' || milestone.kind === 'registration_closes')) {
    return registration.path
  }
  return milestone.item.publicPath
}

function eventDetails(milestone: Milestone) {
  const registration = milestone.item.registration
  if (milestone.kind !== 'event' || !registration) return null
  const venue = [registration.venueName, registration.venueCity].filter(Boolean).join(', ')
  return `${formatAgendaTime(milestone.date)} h${venue ? ` · ${venue}` : ''}`
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function dayParts(date: Date) {
  const formatter = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-AR', options).format(date)
  return {
    day: date.getDate(),
    month: formatter({ month: 'short' }).replace('.', ''),
    weekday: formatter({ weekday: 'short' }).replace('.', '')
  }
}
</script>

<template>
  <UPageSection
    id="agenda"
    title="Agenda próxima"
    :description="`Lo que abre, cierra y se encuentra en persona en los próximos ${AGENDA_DAYS} días.`"
  >
    <div
      v-if="status === 'idle' || status === 'pending'"
      role="status"
      class="space-y-6"
    >
      <span class="sr-only">Cargando agenda...</span>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <USkeleton
          v-for="n in 4"
          :key="n"
          class="h-28 w-full"
        />
      </div>
      <USkeleton class="h-80 w-full" />
    </div>

    <div
      v-else
      class="space-y-8"
    >
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button
          v-for="kpi in kpis"
          :key="kpi.key"
          type="button"
          class="group flex items-center gap-4 rounded-lg bg-elevated/50 p-5 text-left ring ring-default transition hover:ring-primary focus-visible:outline-2 focus-visible:outline-primary"
          @click="goToExplorer(kpi)"
        >
          <span class="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UIcon
              :name="kpi.icon"
              class="size-6"
            />
          </span>
          <span class="min-w-0">
            <span class="block text-4xl font-bold leading-none text-highlighted">{{ kpi.value }}</span>
            <span class="mt-1 block text-sm text-muted">{{ kpi.label }}</span>
            <span class="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-80 group-hover:opacity-100">
              Ver en el explorador
              <UIcon
                name="lucide:arrow-down"
                class="size-3"
              />
            </span>
          </span>
        </button>
      </div>

      <div class="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div class="hidden h-fit rounded-lg p-4 ring ring-default lg:block">
          <UCalendar
            v-model="selectedDay"
            :min-value="minDate"
            :max-value="maxDate"
            :is-date-disabled="isDateWithoutMilestones"
            :week-starts-on="1"
            weekday-format="short"
            :year-controls="false"
            size="lg"
          >
            <template #week-day="{ day }">
              <span class="capitalize">{{ day.replace('.', '') }}</span>
            </template>
            <template #day="{ day }">
              <span
                class="relative flex size-full items-center justify-center"
                :class="{ 'font-bold text-highlighted': dayDots(day.toString()).length }"
              >
                {{ day.day }}
                <span
                  v-if="dayDots(day.toString()).length"
                  class="absolute inset-x-0 -bottom-0.5 flex justify-center gap-0.5"
                  aria-hidden="true"
                >
                  <span
                    v-for="dot in dayDots(day.toString())"
                    :key="dot.key"
                    class="size-1.5 rounded-full"
                    :class="dot.class"
                  />
                </span>
              </span>
            </template>
          </UCalendar>
          <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-default pt-3 text-xs text-muted">
            <span
              v-for="dot in dotCategories"
              :key="dot.key"
              class="inline-flex items-center gap-1.5"
            ><span
              class="size-2 rounded-full"
              :class="dot.class"
            />{{ dot.label }}</span>
          </div>
        </div>

        <div class="min-w-0 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-lg font-semibold text-highlighted">
              {{ listTitle }}
            </h3>
            <UButton
              v-if="selectedDay"
              label="Ver todas las fechas"
              icon="lucide:x"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="selectedDay = undefined"
            />
          </div>

          <ol
            v-if="visibleDays.length"
            class="space-y-3"
          >
            <li
              v-for="day in visibleDays"
              :key="day.dayKey"
              class="flex gap-4 rounded-lg bg-elevated/50 p-3 ring ring-default"
            >
              <div class="flex w-16 shrink-0 flex-col items-center justify-center rounded-md bg-primary/10 py-2 text-primary">
                <span class="text-xs font-medium uppercase">{{ dayParts(day.date).weekday }}</span>
                <span class="text-3xl font-bold leading-none">{{ dayParts(day.date).day }}</span>
                <span class="text-xs font-medium uppercase">{{ dayParts(day.date).month }}</span>
              </div>

              <ul class="min-w-0 flex-1 divide-y divide-default">
                <li
                  v-for="milestone in day.milestones"
                  :key="`${milestone.item.id}-${milestone.kind}`"
                  class="py-2 first:pt-0 last:pb-0"
                >
                  <NuxtLink
                    :to="milestoneLink(milestone)"
                    class="group flex items-start gap-3 rounded-md"
                  >
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <UBadge
                          v-bind="milestoneBadge[milestone.kind]"
                          size="sm"
                        />
                        <span class="text-xs text-muted">{{ formatAgendaRelativeDay(milestone.date, now) }}</span>
                      </div>
                      <p class="mt-1 line-clamp-2 font-medium text-highlighted group-hover:text-primary group-hover:underline">
                        {{ milestone.item.title }}
                      </p>
                      <p
                        v-if="eventDetails(milestone)"
                        class="mt-0.5 flex items-center gap-1 text-sm text-toned"
                      >
                        <UIcon
                          name="lucide:map-pin"
                          class="size-3.5 shrink-0 text-primary"
                        />
                        {{ eventDetails(milestone) }}
                      </p>
                      <p
                        v-if="milestone.item.section"
                        class="text-xs text-muted"
                      >
                        {{ milestone.item.section.name }}<template v-if="milestone.item.region">
                          · {{ milestone.item.region.name }}
                        </template>
                      </p>
                    </div>
                    <UIcon
                      :name="getConsultationType(milestone.item.section?.slug)?.icon ?? 'lucide:folder'"
                      class="size-10 shrink-0 self-center text-primary"
                      aria-hidden="true"
                    />
                  </NuxtLink>
                </li>
              </ul>
            </li>
          </ol>

          <UEmpty
            v-else
            :title="selectedDay ? 'Sin hitos este día' : 'Sin hitos próximos'"
            :description="selectedDay
              ? 'Elegí otro día marcado en el calendario.'
              : `No hay aperturas, cierres ni encuentros en los próximos ${AGENDA_DAYS} días.`"
            icon="lucide:calendar"
          />

          <div
            v-if="hiddenDaysCount > 0"
            class="flex justify-center"
          >
            <UButton
              :label="`Mostrar ${hiddenDaysCount} fecha${hiddenDaysCount === 1 ? '' : 's'} más`"
              icon="lucide:chevron-down"
              color="neutral"
              variant="soft"
              @click="showAll = true"
            />
          </div>
        </div>
      </div>
    </div>
  </UPageSection>
</template>
