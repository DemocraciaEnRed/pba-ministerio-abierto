<script setup lang="ts">
import { CreateConsultationSchema, UpdateConsultationSchema } from '#shared/schemas/consultation'

type ConsultationFormat = 'single' | 'multiple'
type ResultsVisibility = 'hidden' | 'participants_only' | 'public'

export interface ConsultationFormInitialValues {
  slug: string
  title: string
  summary: string | null
  body: string | null
  consultationFormat: ConsultationFormat
  startsAt: string | null
  endsAt: string | null
  closedMessage: string | null
  resultsVisibility: ResultsVisibility
}

export interface ConsultationFormPayload {
  slug: string
  title: string
  summary: string | null
  body: string | null
  consultationFormat: ConsultationFormat
  startsAt: string | null
  endsAt: string | null
  closedMessage: string | null
  resultsVisibility: ResultsVisibility
  adjustTopics: boolean
}

/** Tema de la consulta, para previsualizar el ajuste de fechas al mover la ventana. */
export interface ConsultationFormTopic {
  id: number
  title: string
  participationStartsAt: string | null
  participationEndsAt: string | null
}

const props = withDefaults(defineProps<{
  mode: 'create' | 'edit'
  initialValues?: ConsultationFormInitialValues | null
  topics?: ConsultationFormTopic[] | null
  loading?: boolean
}>(), {
  initialValues: null,
  topics: null,
  loading: false
})

const emit = defineEmits<{
  submit: [payload: ConsultationFormPayload]
  cancel: []
}>()

const form = reactive({
  slug: '',
  title: '',
  summary: '',
  body: '' as string | null,
  consultationFormat: 'multiple' as ConsultationFormat,
  startsAt: null as string | null,
  endsAt: null as string | null,
  closedMessage: '' as string | null,
  resultsVisibility: 'public' as ResultsVisibility
})

type FieldName = keyof ConsultationFormPayload
const errors = reactive<Partial<Record<FieldName, string>>>({})

// El slug se autogenera desde el título hasta que el usuario lo edite a mano.
const slugTouched = ref(false)

const formatOptions = [
  { label: 'Única', value: 'single' },
  { label: 'Múltiple', value: 'multiple' }
] satisfies { label: string, value: ConsultationFormat }[]

const visibilityOptions = [
  { label: 'Ocultos', value: 'hidden' },
  { label: 'Solo participantes', value: 'participants_only' },
  { label: 'Públicos', value: 'public' }
] satisfies { label: string, value: ResultsVisibility }[]

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

function hydrate(values: ConsultationFormInitialValues | null) {
  form.slug = values?.slug ?? ''
  form.title = values?.title ?? ''
  form.summary = values?.summary ?? ''
  form.body = values?.body ?? ''
  // Formato y visibilidad quedan fijos temporalmente (solo 'multiple'/'public' soportados).
  form.consultationFormat = 'multiple'
  form.startsAt = values?.startsAt ?? null
  form.endsAt = values?.endsAt ?? null
  form.closedMessage = values?.closedMessage ?? ''
  form.resultsVisibility = 'public'
  slugTouched.value = Boolean(values?.slug)
}

watch(() => props.initialValues, hydrate, { immediate: true })

watch(() => form.title, (title) => {
  if (props.mode === 'create' && !slugTouched.value) {
    form.slug = slugify(title)
  }
})

function onSlugInput() {
  slugTouched.value = true
}

function buildPayload(): ConsultationFormPayload {
  return {
    slug: form.slug.trim(),
    title: form.title.trim(),
    summary: form.summary.trim() || null,
    body: (form.body ?? '').trim() || null,
    consultationFormat: form.consultationFormat,
    startsAt: form.startsAt,
    endsAt: form.endsAt,
    closedMessage: (form.closedMessage ?? '').trim() || null,
    resultsVisibility: form.resultsVisibility,
    // El ajuste no es opcional: si hay temas fuera de la ventana, se recortan al guardar.
    adjustTopics: topicChanges.value.length > 0
  }
}

function clearErrors() {
  for (const key of Object.keys(errors) as FieldName[]) {
    errors[key] = undefined
  }
}

function validate(payload: ConsultationFormPayload): boolean {
  clearErrors()
  const schema = props.mode === 'create' ? CreateConsultationSchema : UpdateConsultationSchema
  const result = schema.safeParse(payload)
  if (result.success) return true

  for (const issue of result.error.issues) {
    const field = issue.path[0] as FieldName | undefined
    if (field && !errors[field]) {
      errors[field] = issue.message
    }
  }
  return false
}

function onSubmit() {
  const payload = buildPayload()
  if (!validate(payload)) return
  emit('submit', payload)
}

// Fechas: además de las reglas Zod, validamos coherencia de rango en el cliente.
watch(() => [form.startsAt, form.endsAt], () => {
  if (form.startsAt && form.endsAt && new Date(form.endsAt) < new Date(form.startsAt)) {
    errors.endsAt = 'La fecha de fin no puede ser anterior al inicio.'
  } else if (errors.endsAt === 'La fecha de fin no puede ser anterior al inicio.') {
    errors.endsAt = undefined
  }
})

// La UI de fechas maneja precisión de minutos; truncamos segundos al comparar.
function floorMinute(date: Date): number {
  return Math.floor(date.getTime() / 60_000)
}

// Previsualiza cómo se recortarían las fechas de los temas que quedan fuera de la
// ventana elegida. Refleja la misma lógica de `clampTopicWindowToConsultation`.
const topicChanges = computed(() => {
  const list = props.topics ?? []
  const cStart = form.startsAt ? new Date(form.startsAt) : null
  const cEnd = form.endsAt ? new Date(form.endsAt) : null
  if (!cStart) return []

  return list.flatMap((topic) => {
    const tStart = topic.participationStartsAt ? new Date(topic.participationStartsAt) : null
    const tEnd = topic.participationEndsAt ? new Date(topic.participationEndsAt) : null
    let newStart = tStart
    let newEnd = tEnd
    let changed = false

    if (tStart && floorMinute(tStart) < floorMinute(cStart)) {
      newStart = cStart
      changed = true
    }
    if (tEnd && cEnd && floorMinute(tEnd) > floorMinute(cEnd)) {
      newEnd = cEnd
      changed = true
    }
    if (newStart && newEnd && floorMinute(newEnd) < floorMinute(newStart)) {
      newEnd = cEnd
      changed = true
    }

    if (!changed) return []
    return [{
      id: topic.id,
      title: topic.title,
      fromStart: topic.participationStartsAt,
      toStart: newStart ? newStart.toISOString() : null,
      fromEnd: topic.participationEndsAt,
      toEnd: newEnd ? newEnd.toISOString() : null
    }]
  })
})

/** Compara dos fechas ISO (nullables) a nivel de minuto. */
function sameMinute(a: string | null, b: string | null): boolean {
  if (a === null && b === null) return true
  if (a === null || b === null) return false
  return floorMinute(new Date(a)) === floorMinute(new Date(b))
}

// Temas que NO definen cierre propio: heredan el de la consulta. No requieren
// ajuste, pero si el cierre de la consulta cambia, su cierre efectivo cambia
// también; lo mostramos a modo informativo.
const inheritedEndChanges = computed(() => {
  const originalEnd = props.initialValues?.endsAt ?? null
  const newEnd = form.endsAt ?? null
  if (sameMinute(originalEnd, newEnd)) return []

  const adjustedIds = new Set(topicChanges.value.map(change => change.id))
  return (props.topics ?? [])
    .filter(topic => topic.participationEndsAt === null && !adjustedIds.has(topic.id))
    .map(topic => ({
      id: topic.id,
      title: topic.title,
      fromEnd: originalEnd,
      toEnd: newEnd
    }))
})

const titleMax = 180
</script>

<template>
  <form
    class="space-y-6"
    @submit.prevent="onSubmit"
  >
    <div class="grid gap-4 md:grid-cols-2">
      <UFormField
        label="Título"
        description="Nombre público de la consulta. Aparece en el listado y en la cabecera."
        required
        :error="errors.title"
        class="md:col-span-2"
        size="xl"
      >
        <template #hint>
          <span class="text-xs text-muted">{{ form.title.length }}/{{ titleMax }}</span>
        </template>
        <UInput
          v-model="form.title"
          :maxlength="titleMax"
          placeholder="Ej.: Plan de arbolado urbano 2026"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Slug"
        description="Identificador para la URL pública (/consultas/…). Solo minúsculas, números y guiones."
        required
        :error="errors.slug"
      >
        <template #hint>
          <UTooltip text="Se genera automáticamente desde el título, pero podés ajustarlo.">
            <UIcon
              name="i-lucide-info"
              class="text-muted"
            />
          </UTooltip>
        </template>
        <UInput
          v-model="form.slug"
          placeholder="plan-arbolado-urbano-2026"
          class="w-full"
          @input="onSlugInput"
        />
      </UFormField>

      <UFormField
        label="Formato"
        description="Única: un solo espacio de participación. Múltiple: varios temas dentro de la consulta."
        :error="errors.consultationFormat"
      >
        <USelect
          v-model="form.consultationFormat"
          :items="formatOptions"
          value-key="value"
          disabled
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Resumen"
        description="Texto breve que se muestra en el listado de consultas."
        :error="errors.summary"
        class="md:col-span-2"
      >
        <UTextarea
          v-model="form.summary"
          :rows="2"
          placeholder="Una o dos frases que resuman la consulta."
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Contenido"
        description="Cuerpo principal que lee la ciudadanía: presentación, antecedentes, motivación y detalle. Admite formato enriquecido (Markdown)."
        :error="errors.body"
        class="md:col-span-2"
      >
        <template #hint>
          <UTooltip text="Podés usar títulos, listas, negritas y enlaces.">
            <UIcon
              name="i-lucide-info"
              class="text-muted"
            />
          </UTooltip>
        </template>
        <RichTextEditor
          v-model="form.body"
          placeholder="Escribí el contenido de la consulta…"
        />
      </UFormField>

      <UFormField
        label="Inicio de participación"
        description="Fecha y hora en que se habilita la participación."
        required
        :error="errors.startsAt"
      >
        <DateTimeField
          v-model="form.startsAt"
          placeholder="Sin definir"
        />
      </UFormField>

      <UFormField
        label="Cierre de participación"
        description="Fecha y hora en que finaliza la participación. Opcional."
        :error="errors.endsAt"
      >
        <DateTimeField
          v-model="form.endsAt"
          placeholder="Sin definir"
        />
      </UFormField>

      <div
        v-if="mode === 'edit' && (topicChanges.length > 0 || inheritedEndChanges.length > 0)"
        class="md:col-span-2"
      >
        <AdminConsultationTopicWindowPreview
          :changes="topicChanges"
          :inherited="inheritedEndChanges"
        />
      </div>

      <UFormField
        label="Mensaje de cierre"
        description="Mensaje que se muestra en la página pública cuando la consulta está cerrada. Admite formato enriquecido (Markdown)."
        :error="errors.closedMessage"
        class="md:col-span-2"
      >
        <RichTextEditor
          v-model="form.closedMessage"
          placeholder="Ej.: ¡Gracias por participar! Los resultados se publicarán próximamente."
        />
      </UFormField>

      <UFormField
        label="Visibilidad de resultados"
        description="Quién puede ver los resultados de la consulta."
        :error="errors.resultsVisibility"
      >
        <USelect
          v-model="form.resultsVisibility"
          :items="visibilityOptions"
          value-key="value"
          disabled
          class="w-full"
        />
      </UFormField>
    </div>

    <div class="flex justify-end gap-2">
      <UButton
        label="Cancelar"
        color="neutral"
        variant="ghost"
        :disabled="props.loading"
        @click="emit('cancel')"
      />
      <UButton
        type="submit"
        :label="props.mode === 'create' ? 'Crear consulta' : 'Guardar cambios'"
        icon="i-lucide-save"
        :loading="props.loading"
      />
    </div>
  </form>
</template>
