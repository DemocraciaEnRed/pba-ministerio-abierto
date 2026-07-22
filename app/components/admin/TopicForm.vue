<script setup lang="ts">
import { CreateTopicSchema, UpdateTopicSchema } from '#shared/schemas/topic'

type MechanismType = 'support' | 'vote' | 'survey'

export interface TopicFormInitialValues {
  slug: string
  title: string
  summary: string | null
  body: string | null
  mechanismType: MechanismType | null
  participationStartsAt: string | null
  participationEndsAt: string | null
  publishResultsWhenParticipationEnds: boolean
  displayOrder: number
}

export interface TopicFormPayload {
  slug: string
  title: string
  summary: string | null
  body: string | null
  mechanismType: MechanismType | null
  participationStartsAt: string | null
  participationEndsAt: string | null
  publishResultsWhenParticipationEnds: boolean
  displayOrder: number
}

/** Fechas de la consulta padre: sirven de referencia y de límite para el tema. */
export interface TopicFormConsultation {
  startsAt: string | null
  endsAt: string | null
}

const props = withDefaults(defineProps<{
  mode: 'create' | 'edit'
  initialValues?: TopicFormInitialValues | null
  consultation?: TopicFormConsultation | null
  loading?: boolean
}>(), {
  initialValues: null,
  consultation: null,
  loading: false
})

const emit = defineEmits<{
  submit: [payload: TopicFormPayload]
  cancel: []
}>()

const form = reactive({
  slug: '',
  title: '',
  summary: '',
  body: '' as string | null,
  mechanismType: null as MechanismType | null,
  participationStartsAt: null as string | null,
  participationEndsAt: null as string | null,
  publishResultsWhenParticipationEnds: true,
  // No se edita desde el formulario; se arrastra el valor para el update.
  displayOrder: 0
})

type FieldName = keyof TopicFormPayload
const errors = reactive<Partial<Record<FieldName, string>>>({})

// El slug se autogenera desde el título hasta que el usuario lo edite a mano.
const slugTouched = ref(false)

const mechanismOptions = [
  { label: 'Sin método (definir luego)', value: null },
  { label: 'Apoyo', value: 'support' },
  { label: 'Votación', value: 'vote' },
  { label: 'Encuesta', value: 'survey' }
] satisfies { label: string, value: MechanismType | null }[]

const mechanismLabels: Record<MechanismType, string> = {
  support: 'Apoyo',
  vote: 'Votación',
  survey: 'Encuesta'
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

function hydrate(values: TopicFormInitialValues | null) {
  form.slug = values?.slug ?? ''
  form.title = values?.title ?? ''
  form.summary = values?.summary ?? ''
  form.body = values?.body ?? ''
  form.mechanismType = values?.mechanismType ?? null
  form.participationStartsAt = values?.participationStartsAt ?? null
  form.participationEndsAt = values?.participationEndsAt ?? null
  // Fijo temporalmente en 'publicar automáticamente' hasta confirmar la implementación.
  form.publishResultsWhenParticipationEnds = true
  form.displayOrder = values?.displayOrder ?? 0
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

function buildPayload(): TopicFormPayload {
  return {
    slug: form.slug.trim(),
    title: form.title.trim(),
    summary: (form.summary ?? '').trim() || null,
    body: (form.body ?? '').trim() || null,
    mechanismType: form.mechanismType,
    participationStartsAt: form.participationStartsAt,
    participationEndsAt: form.participationEndsAt,
    publishResultsWhenParticipationEnds: form.publishResultsWhenParticipationEnds,
    displayOrder: form.displayOrder
  }
}

function clearErrors() {
  for (const key of Object.keys(errors) as FieldName[]) {
    errors[key] = undefined
  }
}

function validate(payload: TopicFormPayload): boolean {
  clearErrors()
  const schema = props.mode === 'create' ? CreateTopicSchema : UpdateTopicSchema
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

// Permite que la página vuelque errores de validación del servidor (422) sobre los campos.
function applyServerErrors(serverErrors: { field: string, message: string }[]) {
  for (const { field, message } of serverErrors) {
    if (field && field in form && !errors[field as FieldName]) {
      errors[field as FieldName] = message
    }
  }
}

defineExpose({ applyServerErrors })

// Referencia de la ventana de la consulta padre.
const consultationStartLabel = computed(() =>
  props.consultation?.startsAt ? formatDate(props.consultation.startsAt) : null
)
const consultationEndLabel = computed(() =>
  props.consultation?.endsAt ? formatDate(props.consultation.endsAt) : null
)
const consultationOpenEnded = computed(() =>
  Boolean(props.consultation?.startsAt) && !props.consultation?.endsAt
)
const canCopyConsultationDates = computed(() => Boolean(props.consultation?.startsAt))

// Descripción dinámica del campo de cierre: si el tema no define cierre propio,
// hereda el de la consulta (o queda indefinido solo si la consulta también lo está).
const endFieldHint = computed(() => {
  if (form.participationEndsAt) {
    return 'Fecha y hora en que finaliza la participación en este tema. No puede superar el cierre de la consulta.'
  }
  if (props.consultation?.endsAt) {
    return `Sin fecha propia: se usa el cierre de la consulta (${formatDate(props.consultation.endsAt)}).`
  }
  if (props.consultation?.startsAt) {
    return 'Sin fecha: la participación queda indefinida (la consulta no tiene cierre).'
  }
  return 'Opcional: si no se define, hereda el cierre de la consulta.'
})

// Vuelca las fechas de la consulta sobre el tema (por defecto, misma ventana).
function copyConsultationDates() {
  if (!props.consultation?.startsAt) return
  form.participationStartsAt = props.consultation.startsAt
  form.participationEndsAt = props.consultation.endsAt ?? null
}

// La UI de fechas maneja precisión de minutos; comparamos truncando segundos para
// no marcar como inválido un valor equivalente al de la consulta (guardado con segundos).
function floorMinute(date: Date): number {
  return Math.floor(date.getTime() / 60_000)
}

// Fechas: además de las reglas Zod, validamos coherencia de rango en el cliente
// y que la ventana del tema quede dentro de la de la consulta.
watch(() => [form.participationStartsAt, form.participationEndsAt], () => {
  const start = form.participationStartsAt ? new Date(form.participationStartsAt) : null
  const end = form.participationEndsAt ? new Date(form.participationEndsAt) : null
  const consultationStart = props.consultation?.startsAt ? new Date(props.consultation.startsAt) : null
  const consultationEnd = props.consultation?.endsAt ? new Date(props.consultation.endsAt) : null

  if (start && consultationStart && floorMinute(start) < floorMinute(consultationStart)) {
    errors.participationStartsAt = 'No puede ser anterior al inicio de la consulta.'
  } else {
    errors.participationStartsAt = undefined
  }

  if (end && start && floorMinute(end) < floorMinute(start)) {
    errors.participationEndsAt = 'La fecha de cierre no puede ser anterior al inicio.'
  } else if (end && consultationEnd && floorMinute(end) > floorMinute(consultationEnd)) {
    errors.participationEndsAt = 'No puede ser posterior al cierre de la consulta.'
  } else {
    errors.participationEndsAt = undefined
  }
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
        description="Nombre del tema. Aparece en el listado de temas y en su página pública."
        required
        :error="errors.title"
        class="md:col-span-2"
      >
        <template #hint>
          <span class="text-xs text-muted">{{ form.title.length }}/{{ titleMax }}</span>
        </template>
        <UInput
          v-model="form.title"
          :maxlength="titleMax"
          placeholder="Ej.: Ampliación de la ciclovía de Av. Costanera"
          class="w-full"
          size="xl"
        />
      </UFormField>

      <UFormField
        label="Slug"
        description="Identificador para la URL del tema. Solo minúsculas, números y guiones. Único dentro de la consulta."
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
          placeholder="ampliacion-ciclovia-costanera"
          class="w-full"
          @input="onSlugInput"
        />
      </UFormField>

      <UFormField
        label="Mecanismo de participación"
        :description="props.mode === 'create'
          ? 'Cómo participa la ciudadanía en este tema. Apoyo: un botón de adhesión. Votación: a favor/abstención/en contra. Encuesta: opciones de elección múltiple.'
          : 'El mecanismo se cambia desde una sección aparte para evitar perder datos de participación.'"
        :error="errors.mechanismType"
      >
        <USelect
          v-if="props.mode === 'create'"
          v-model="form.mechanismType"
          :items="mechanismOptions"
          value-key="value"
          class="w-full"
        />
        <div
          v-else
          class="flex items-center gap-2"
        >
          <UBadge
            :label="form.mechanismType ? mechanismLabels[form.mechanismType] : 'Sin método'"
            color="neutral"
            variant="outline"
          />
          <span class="text-xs text-muted">Se cambia desde otra sección</span>
        </div>
      </UFormField>

      <UFormField
        label="Resumen"
        description="Texto breve que se muestra en el listado de temas."
        :error="errors.summary"
        class="md:col-span-2"
      >
        <UTextarea
          v-model="form.summary"
          :rows="2"
          placeholder="Una o dos frases que resuman el tema."
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Contenido"
        description="Presentación del tema que ve la ciudadanía. Admite formato enriquecido (Markdown)."
        :error="errors.body"
        class="md:col-span-2"
      >
        <RichTextEditor
          v-model="form.body"
          placeholder="Escribí el contenido del tema…"
        />
      </UFormField>

      <div class="md:col-span-2 space-y-2 rounded-lg border border-default bg-elevated/50 p-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-xs text-muted">
            <template v-if="consultationOpenEnded">
              Ventana de la consulta: desde
              <span class="text-toned">{{ consultationStartLabel }}</span>,
              <span class="text-toned">abierta indefinidamente</span>.
            </template>
            <template v-else-if="consultationStartLabel">
              Ventana de la consulta:
              <span class="text-toned">{{ consultationStartLabel }}</span>
              a
              <span class="text-toned">{{ consultationEndLabel ?? 'sin definir' }}</span>.
            </template>
            <template v-else>
              La participación del tema debe quedar dentro de la ventana de la consulta.
            </template>
          </p>
          <UButton
            v-if="canCopyConsultationDates"
            label="Usar fechas de la consulta"
            icon="i-lucide-copy"
            color="neutral"
            variant="subtle"
            size="xs"
            @click="copyConsultationDates"
          />
        </div>
      </div>

      <UFormField
        label="Inicio de participación"
        description="Fecha y hora en que se habilita la participación en este tema. No puede ser anterior al inicio de la consulta."
        required
        :error="errors.participationStartsAt"
      >
        <DateTimeField
          v-model="form.participationStartsAt"
          placeholder="Sin definir"
        />
      </UFormField>

      <UFormField
        label="Cierre de participación"
        :description="endFieldHint"
        :error="errors.participationEndsAt"
      >
        <DateTimeField
          v-model="form.participationEndsAt"
          placeholder="Sin definir"
        />
      </UFormField>

      <UFormField
        label="Publicar resultados al cerrar la participación"
        description="Si está activo, los resultados se publican automáticamente cuando termina la ventana de participación. Si no, quedan visibles solo para administración."
        :error="errors.publishResultsWhenParticipationEnds"
        class="md:col-span-2"
      >
        <USwitch
          v-model="form.publishResultsWhenParticipationEnds"
          label="Publicar automáticamente"
          disabled
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
        :label="props.mode === 'create' ? 'Crear tema' : 'Guardar cambios'"
        icon="i-lucide-save"
        :loading="props.loading"
      />
    </div>
  </form>
</template>
