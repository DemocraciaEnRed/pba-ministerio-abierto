<script setup lang="ts">
export interface TopicWindowChange {
  id: number
  title: string
  fromStart: string | null
  toStart: string | null
  fromEnd: string | null
  toEnd: string | null
}

export interface TopicInheritedEnd {
  id: number
  title: string
  fromEnd: string | null
  toEnd: string | null
}

const props = withDefaults(defineProps<{
  changes: TopicWindowChange[]
  inherited?: TopicInheritedEnd[]
}>(), {
  inherited: () => []
})

/** Un cambio de fecha es relevante solo si el valor efectivamente varía. */
function startChanged(change: TopicWindowChange): boolean {
  return change.fromStart !== change.toStart
}

function endChanged(change: TopicWindowChange): boolean {
  return change.fromEnd !== change.toEnd
}

function label(value: string | null): string {
  return value ? formatDate(value) : 'sin definir'
}

/** Cierre heredado: null se muestra como "indefinido". */
function endLabel(value: string | null): string {
  return value ? formatDate(value) : 'sin cierre (indefinido)'
}

const changeCount = computed(() => props.changes.length)
const inheritedCount = computed(() => props.inherited.length)
</script>

<template>
  <div class="space-y-3">
    <div
      v-if="changeCount > 0"
      class="space-y-3 rounded-lg border border-warning/40 bg-warning/10 p-3"
    >
      <div class="flex items-start gap-2">
        <UIcon
          name="i-lucide-triangle-alert"
          class="mt-0.5 shrink-0 text-warning"
        />
        <p class="text-sm text-toned">
          Con estas fechas, {{ changeCount }}
          {{ changeCount === 1 ? 'tema queda' : 'temas quedan' }} fuera de la ventana de la consulta.
          Se ajustarán así al guardar:
        </p>
      </div>

      <ul class="space-y-2 text-xs">
        <li
          v-for="change in changes"
          :key="change.id"
          class="rounded-md bg-default/60 px-2 py-1.5"
        >
          <p class="font-medium text-toned">
            {{ change.title }}
          </p>
          <p
            v-if="startChanged(change)"
            class="text-muted"
          >
            Inicio:
            <span class="line-through">{{ label(change.fromStart) }}</span>
            →
            <span class="text-toned">{{ label(change.toStart) }}</span>
          </p>
          <p
            v-if="endChanged(change)"
            class="text-muted"
          >
            Cierre:
            <span class="line-through">{{ label(change.fromEnd) }}</span>
            →
            <span class="text-toned">{{ label(change.toEnd) }}</span>
          </p>
        </li>
      </ul>
    </div>

    <div
      v-if="inheritedCount > 0"
      class="space-y-3 rounded-lg border border-info/40 bg-info/10 p-3"
    >
      <div class="flex items-start gap-2">
        <UIcon
          name="i-lucide-info"
          class="mt-0.5 shrink-0 text-info"
        />
        <p class="text-sm text-toned">
          {{ inheritedCount }}
          {{ inheritedCount === 1 ? 'tema hereda' : 'temas heredan' }} el cierre de la consulta
          y pasarán a cerrar en la nueva fecha:
        </p>
      </div>

      <ul class="space-y-2 text-xs">
        <li
          v-for="topic in inherited"
          :key="topic.id"
          class="rounded-md bg-default/60 px-2 py-1.5"
        >
          <p class="font-medium text-toned">
            {{ topic.title }}
          </p>
          <p class="text-muted">
            Cierre:
            <span class="line-through">{{ endLabel(topic.fromEnd) }}</span>
            →
            <span class="text-toned">{{ endLabel(topic.toEnd) }}</span>
          </p>
        </li>
      </ul>
    </div>
  </div>
</template>
