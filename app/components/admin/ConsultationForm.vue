<script setup lang="ts">
import { isKnownConsultationTypeSlug } from '#shared/data/consultation-types'
import { CreateConsultationSchema, UpdateConsultationSchema } from '#shared/schemas/consultation'
import { slugifyConsultationName } from '#shared/utils/consultation-url'

type ConsultationFormat = 'single' | 'multiple'
type ResultsVisibility = 'hidden' | 'participants_only' | 'public'

export interface ConsultationFormInitialValues {
  id?: number | null
  slug: string
  title: string
  sectionId?: number | null
  sectionSlug?: string | null
  sectionName?: string | null
  summary: string | null
  body: string | null
  consultationFormat: ConsultationFormat
  startsAt: string | null
  endsAt: string | null
  closedMessage: string | null
  commentsEnabled: boolean
  commentsGuidance: string | null
  resultsVisibility: ResultsVisibility
}

export interface ConsultationFormPayload {
  /** Solo se envía si se personalizó la dirección; si falta, el servidor la genera o la conserva. */
  slug?: string
  title: string
  sectionId: number | null
  summary: string | null
  body: string | null
  consultationFormat: ConsultationFormat
  startsAt: string | null
  endsAt: string | null
  closedMessage: string | null
  commentsEnabled: boolean
  commentsGuidance: string | null
  resultsVisibility: ResultsVisibility
}

const props = withDefaults(defineProps<{
  mode: 'create' | 'edit'
  initialValues?: ConsultationFormInitialValues | null
  loading?: boolean
}>(), {
  initialValues: null,
  loading: false
})

const emit = defineEmits<{
  submit: [payload: ConsultationFormPayload]
  cancel: []
}>()

const form = reactive({
  slug: '',
  title: '',
  sectionId: undefined as number | undefined,
  summary: '',
  body: '' as string | null,
  consultationFormat: 'multiple' as ConsultationFormat,
  startsAt: null as string | null,
  endsAt: null as string | null,
  closedMessage: '' as string | null,
  commentsEnabled: true,
  commentsGuidance: '' as string | null,
  resultsVisibility: 'public' as ResultsVisibility
})

type FieldName = keyof ConsultationFormPayload
const errors = reactive<Partial<Record<FieldName, string>>>({})

// La dirección web se genera desde el título (alta) o se conserva (edición),
// salvo que quien administra elija personalizarla.
const customizeAddress = ref(false)
const toast = useToast()
const toAbsoluteUrl = useAbsoluteUrl()

const formatOptions = [
  { label: 'Única', value: 'single' },
  { label: 'Múltiple', value: 'multiple' }
] satisfies { label: string, value: ConsultationFormat }[]

const visibilityOptions = [
  { label: 'Ocultos', value: 'hidden' },
  { label: 'Solo participantes', value: 'participants_only' },
  { label: 'Públicos', value: 'public' }
] satisfies { label: string, value: ResultsVisibility }[]

// El tipo se elige una sola vez, en el alta: define qué estructura habilita la consulta.
const { data: sections } = useAsyncData<Array<{ id: number, slug: string, name: string }>>(
  'consultation-form-sections',
  () => $fetch<Array<{ id: number, slug: string, name: string }>>('/api/sections'),
  { default: () => [], immediate: props.mode === 'create' }
)

const sectionOptions = computed(() =>
  (sections.value ?? [])
    .filter(section => isKnownConsultationTypeSlug(section.slug))
    .map(section => ({ label: section.name, value: section.id }))
)

function hydrate(values: ConsultationFormInitialValues | null) {
  form.slug = values?.slug ?? ''
  form.title = values?.title ?? ''
  form.sectionId = values?.sectionId ?? undefined
  form.summary = values?.summary ?? ''
  form.body = values?.body ?? ''
  // Formato y visibilidad quedan fijos temporalmente (solo 'multiple'/'public' soportados).
  form.consultationFormat = 'multiple'
  form.startsAt = values?.startsAt ?? null
  form.endsAt = values?.endsAt ?? null
  form.closedMessage = values?.closedMessage ?? ''
  form.commentsEnabled = values?.commentsEnabled ?? true
  form.commentsGuidance = values?.commentsGuidance ?? ''
  form.resultsVisibility = 'public'
  customizeAddress.value = false
}

watch(() => props.initialValues, hydrate, { immediate: true })

// El campo se guarda como "comentarios habilitados"; la UI lo expresa al revés.
const commentsHidden = computed({
  get: () => !form.commentsEnabled,
  set: (value: boolean) => {
    form.commentsEnabled = !value
  }
})

// Nombre que se usará en la dirección si no se personaliza.
const automaticAddressName = computed(() =>
  props.mode === 'create'
    ? slugifyConsultationName(form.title) || 'consulta'
    : props.initialValues?.slug ?? ''
)

const selectedSectionSlug = computed(() => {
  if (props.mode === 'edit') return props.initialValues?.sectionSlug ?? null
  return sections.value?.find(section => section.id === form.sectionId)?.slug ?? null
})

// Vista previa de la dirección pública. En el alta el número todavía no existe.
const addressPreview = computed(() => {
  const name = (customizeAddress.value ? form.slug.trim() : automaticAddressName.value) || '…'
  const section = selectedSectionSlug.value ?? 'tipo-de-consulta'
  const id = props.initialValues?.id ?? 'número'
  return toAbsoluteUrl(`/${section}/${id}/${name}`)
})

// Dirección guardada (solo en edición): es la que conviene copiar y difundir.
const savedAddress = computed(() => {
  const values = props.initialValues
  if (props.mode !== 'edit' || !values?.id || !values.sectionSlug) return null
  return toAbsoluteUrl(consultationPublicPath({ id: values.id, slug: values.slug, section: { slug: values.sectionSlug } }))
})

function toggleCustomizeAddress() {
  customizeAddress.value = !customizeAddress.value
  form.slug = automaticAddressName.value
  errors.slug = undefined
}

async function copySavedAddress() {
  if (!savedAddress.value) return
  try {
    await navigator.clipboard.writeText(savedAddress.value)
    toast.add({ title: 'Enlace copiado', description: savedAddress.value, color: 'success' })
  } catch {
    toast.add({ title: 'No se pudo copiar el enlace', color: 'error' })
  }
}

function buildPayload(): ConsultationFormPayload {
  return {
    slug: customizeAddress.value ? form.slug.trim() : undefined,
    title: form.title.trim(),
    sectionId: form.sectionId ?? null,
    summary: form.summary.trim() || null,
    body: (form.body ?? '').trim() || null,
    consultationFormat: form.consultationFormat,
    startsAt: form.startsAt,
    endsAt: form.endsAt,
    closedMessage: (form.closedMessage ?? '').trim() || null,
    commentsEnabled: form.commentsEnabled,
    commentsGuidance: (form.commentsGuidance ?? '').trim() || null,
    resultsVisibility: form.resultsVisibility
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
        label="Dirección web"
        :description="mode === 'create'
          ? 'Se arma con el tipo de consulta, un número que se asigna al crearla y un nombre tomado del título.'
          : 'Cambiar el título no cambia la dirección. Los enlaces que ya difundiste siguen funcionando aunque la personalices.'"
        :error="errors.slug"
        class="md:col-span-2"
      >
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <code class="min-w-0 flex-1 break-all rounded-md bg-elevated px-3 py-2 text-sm">{{ addressPreview }}</code>
            <UButton
              v-if="savedAddress"
              label="Copiar enlace"
              icon="i-lucide-copy"
              color="neutral"
              variant="subtle"
              @click="copySavedAddress"
            />
            <UButton
              :label="customizeAddress ? 'Usar dirección automática' : 'Personalizar dirección'"
              :icon="customizeAddress ? 'i-lucide-undo-2' : 'i-lucide-pencil'"
              color="neutral"
              variant="ghost"
              @click="toggleCustomizeAddress"
            />
          </div>
          <UInput
            v-if="customizeAddress"
            v-model="form.slug"
            placeholder="plan-arbolado-urbano-2026"
            aria-label="Nombre de la dirección web"
            class="w-full"
          />
          <p
            v-if="customizeAddress"
            class="text-xs text-muted"
          >
            Solo minúsculas, números y guiones. Puede repetirse en otras consultas: el número identifica a cada una.
          </p>
        </div>
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
        label="Tipo de consulta"
        :description="mode === 'create'
          ? 'Define la estructura de la consulta y sus ejes de gestión. No se puede cambiar después.'
          : 'El tipo se fija al crear la consulta y no se puede modificar.'"
        :required="mode === 'create'"
        :error="errors.sectionId"
      >
        <USelect
          v-if="mode === 'create'"
          v-model="form.sectionId"
          :items="sectionOptions"
          value-key="value"
          placeholder="Elegí un tipo de consulta"
          class="w-full"
        />
        <UInput
          v-else
          :model-value="initialValues?.sectionName ?? 'Sin tipo asignado'"
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
        label="Sección de comentarios"
        description="Al ocultarla, la sección deja de mostrarse en la página pública y se deshabilita comentar, responder y reaccionar. Los comentarios ya publicados se conservan y se siguen viendo en el panel de moderación."
        :error="errors.commentsEnabled"
        class="md:col-span-2"
      >
        <USwitch
          v-model="commentsHidden"
          label="Ocultar la sección de comentarios"
        />
      </UFormField>

      <UFormField
        v-if="form.commentsEnabled"
        label="Guía para los comentarios"
        description="Texto opcional que se muestra debajo del título «Comentarios» para orientar la conversación (por ejemplo, preguntas disparadoras). Admite formato enriquecido (Markdown)."
        :error="errors.commentsGuidance"
        class="md:col-span-2"
      >
        <RichTextEditor
          v-model="form.commentsGuidance"
          placeholder="Ej.: ¿Qué obras priorizarías en tu barrio? Contános tu experiencia."
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
