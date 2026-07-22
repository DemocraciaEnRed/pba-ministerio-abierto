<script setup lang="ts">
import { CalendarDate, Time, DateFormatter, getLocalTimeZone, type DateValue } from '@internationalized/date'

const props = withDefaults(defineProps<{
  modelValue: string | null
  placeholder?: string
  disabled?: boolean
}>(), {
  placeholder: 'Elegí una fecha',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const calendarValue = shallowRef<CalendarDate | null>(null)
const timeValue = shallowRef<Time | null>(null)

const dateFormatter = new DateFormatter('es-AR', { dateStyle: 'long' })

const buttonLabel = computed(() => {
  if (!calendarValue.value) return props.placeholder
  return dateFormatter.format(calendarValue.value.toDate(getLocalTimeZone()))
})

function parseModel(iso: string | null): { date: CalendarDate | null, time: Time | null } {
  if (!iso) return { date: null, time: null }
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return { date: null, time: null }
  return {
    date: new CalendarDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate()),
    time: new Time(parsed.getHours(), parsed.getMinutes())
  }
}

function emitValue() {
  const date = calendarValue.value
  if (!date) {
    emit('update:modelValue', null)
    return
  }
  const time = timeValue.value ?? new Time(0, 0)
  const local = new Date(date.year, date.month - 1, date.day, time.hour, time.minute, 0, 0)
  emit('update:modelValue', local.toISOString())
}

function onCalendarUpdate(value: unknown) {
  if (value && typeof value === 'object' && 'year' in value && 'month' in value && 'day' in value) {
    const date = value as DateValue
    calendarValue.value = new CalendarDate(date.year, date.month, date.day)
    if (!timeValue.value) {
      timeValue.value = new Time(0, 0)
    }
  } else {
    calendarValue.value = null
  }
  emitValue()
}

function onTimeUpdate(value: unknown) {
  timeValue.value = value instanceof Time ? value : null
  emitValue()
}

function clear() {
  calendarValue.value = null
  timeValue.value = null
  emit('update:modelValue', null)
}

watch(() => props.modelValue, (iso) => {
  const { date, time } = parseModel(iso)
  calendarValue.value = date
  timeValue.value = time
}, { immediate: true })
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <UPopover>
      <UButton
        icon="i-lucide-calendar"
        color="neutral"
        variant="outline"
        :disabled="disabled"
        :label="buttonLabel"
      />
      <template #content>
        <UCalendar
          :model-value="calendarValue ?? undefined"
          class="p-2"
          @update:model-value="onCalendarUpdate"
        />
      </template>
    </UPopover>

    <UInputTime
      :model-value="timeValue ?? undefined"
      :disabled="disabled || !calendarValue"
      :hour-cycle="24"
      icon="i-lucide-clock"
      @update:model-value="onTimeUpdate"
    />

    <UButton
      v-if="calendarValue"
      icon="i-lucide-x"
      color="neutral"
      variant="ghost"
      size="sm"
      :disabled="disabled"
      aria-label="Quitar fecha"
      @click="clear"
    />
  </div>
</template>
