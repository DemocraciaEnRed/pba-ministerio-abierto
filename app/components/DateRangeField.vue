<script setup lang="ts">
import { parseDate, type DateValue } from '@internationalized/date'

/**
 * Selector de rango de días (`YYYY-MM-DD`) con el estilo de Nuxt UI: campos
 * editables + calendario de dos meses en un popover. El calendario impide
 * elegir rangos invertidos.
 */
const props = withDefaults(defineProps<{
  ariaLabel?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  ariaLabel: 'Rango de fechas',
  size: 'md'
})

const from = defineModel<string>('from', { default: '' })
const to = defineModel<string>('to', { default: '' })

const inputDate = useTemplateRef('inputDate')

function toCalendarDate(value: string) {
  if (!value) return undefined
  try {
    return parseDate(value)
  } catch {
    return undefined
  }
}

const range = computed(() => ({
  start: toCalendarDate(from.value),
  end: toCalendarDate(to.value)
}))

function toDay(value: DateValue | null | undefined): string {
  if (!value) return ''
  return `${String(value.year).padStart(4, '0')}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`
}

function onUpdate(value: unknown): void {
  const next = (value ?? {}) as { start?: DateValue | null, end?: DateValue | null }
  from.value = toDay(next.start)
  to.value = toDay(next.end)
}

const hasValue = computed(() => Boolean(from.value || to.value))

function clear(): void {
  from.value = ''
  to.value = ''
}
</script>

<template>
  <UInputDate
    ref="inputDate"
    :model-value="range"
    range
    locale="es-AR"
    :size="size"
    :aria-label="props.ariaLabel"
    :ui="{ base: hasValue ? 'pe-16' : 'pe-10' }"
    @update:model-value="onUpdate"
  >
    <template #trailing>
      <div class="flex items-center gap-0.5">
        <UButton
          v-if="hasValue"
          color="neutral"
          variant="link"
          size="sm"
          icon="i-lucide-x"
          aria-label="Quitar fechas"
          class="px-0"
          @click="clear"
        />
        <UPopover :reference="inputDate?.inputsRef[0]?.$el">
          <UButton
            color="neutral"
            variant="link"
            size="sm"
            icon="i-lucide-calendar"
            aria-label="Elegir rango de fechas"
            class="px-0"
          />

          <template #content>
            <UCalendar
              :model-value="range"
              class="p-2"
              :number-of-months="2"
              range
              locale="es-AR"
              @update:model-value="onUpdate"
            />
          </template>
        </UPopover>
      </div>
    </template>
  </UInputDate>
</template>
