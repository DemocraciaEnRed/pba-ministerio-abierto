<script setup lang="ts">
type StatColor = 'primary' | 'neutral' | 'success' | 'warning' | 'error'

const props = withDefaults(defineProps<{
  icon: string
  label: string
  value?: string | number
  hint?: string
  to?: string
  color?: StatColor
}>(), {
  color: 'neutral'
})

// Clases de color explícitas para el contenedor del icono (Tailwind no admite
// clases dinámicas por interpolación, así que las mapeamos).
const iconClasses: Record<StatColor, string> = {
  primary: 'bg-primary/10 text-primary',
  neutral: 'bg-elevated text-muted',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error'
}

const iconClass = computed(() => iconClasses[props.color])
const as = computed(() => (props.to ? resolveComponent('ULink') : 'div'))
</script>

<template>
  <component
    :is="as"
    :to="to"
    class="flex items-start gap-3 rounded-lg border border-default bg-elevated/30 p-3 transition-colors"
    :class="to ? 'hover:border-primary/50' : ''"
  >
    <span
      class="inline-flex size-9 shrink-0 items-center justify-center rounded-md"
      :class="iconClass"
    >
      <UIcon
        :name="icon"
        class="size-5"
      />
    </span>

    <div class="min-w-0 flex-1 space-y-0.5">
      <p class="text-xs font-medium text-muted">
        {{ label }}
      </p>
      <slot>
        <p class="truncate text-lg font-semibold text-highlighted">
          {{ value }}
        </p>
      </slot>
      <p
        v-if="hint"
        class="truncate text-xs text-muted"
      >
        {{ hint }}
      </p>
    </div>
  </component>
</template>
