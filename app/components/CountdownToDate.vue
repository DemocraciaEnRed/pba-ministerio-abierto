<script setup lang="ts">
export interface CountdownValue {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
}

const props = withDefaults(defineProps<{
  targetDate: string | Date | number
  intervalMs?: number
}>(), {
  intervalMs: 1000
})

const remaining = ref<CountdownValue | undefined>(undefined)
let timer: ReturnType<typeof setInterval> | undefined

function resolveTargetDate(value: string | Date | number): Date | undefined {
  const target = value instanceof Date ? value : new Date(value)
  return Number.isNaN(target.getTime()) ? undefined : target
}

function buildCountdown(diffMs: number): CountdownValue {
  const totalSeconds = Math.floor(diffMs / 1000)
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs: diffMs
  }
}

function updateRemaining() {
  const target = resolveTargetDate(props.targetDate)
  if (!target) {
    remaining.value = undefined
    return
  }

  const diffMs = target.getTime() - Date.now()
  remaining.value = diffMs > 0 ? buildCountdown(diffMs) : undefined
}

function clearTimer() {
  if (!timer) return
  clearInterval(timer)
  timer = undefined
}

function startTimer() {
  clearTimer()
  updateRemaining()

  if (remaining.value === undefined) return
  timer = setInterval(() => {
    updateRemaining()
    if (remaining.value === undefined) {
      clearTimer()
    }
  }, props.intervalMs)
}

watch(() => props.targetDate, startTimer)
watch(() => props.intervalMs, startTimer)

onMounted(startTimer)
onBeforeUnmount(clearTimer)

defineExpose({ remaining })
</script>

<template>
  <slot :remaining="remaining">
    <span v-if="remaining">
      {{ remaining.days }}d {{ remaining.hours }}h {{ remaining.minutes }}m {{ remaining.seconds }}s
    </span>
  </slot>
</template>
