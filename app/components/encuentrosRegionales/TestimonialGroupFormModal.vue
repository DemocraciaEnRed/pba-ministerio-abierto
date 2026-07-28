<script setup lang="ts">
import type { Form } from '@nuxt/ui'
import type { CreateTestimonialGroupInput } from '#shared/schemas/regional-meetings'
import { BUENOS_AIRES_MUNICIPALITIES } from '#shared/data/argentina'

export interface AdminTestimonial {
  id: number
  body: string
  authorName: string
  municipality: string
}

export interface AdminTestimonialGroup {
  id: number
  name: string
  municipality: string
  heldAt: string
  regionId: number | null
  testimonials: AdminTestimonial[]
}

interface RegionOption {
  id: number
  slug: string
  name: string
}

const props = withDefaults(defineProps<{
  open: boolean
  initialValues?: AdminTestimonialGroup | null
}>(), {
  initialValues: null
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const MAX_TESTIMONIALS = 3

const toast = useToast()
const formId = useId()
const formRef = ref<Form<CreateTestimonialGroupInput>>()

const saving = ref(false)

const { data: regions, status: regionsStatus } = await useAsyncData('admin-regions-options', () =>
  $fetch<RegionOption[]>('/api/regions')
)

const regionItems = computed(() => [
  { label: 'Sin región', value: 0 },
  ...(regions.value ?? []).map(region => ({ label: region.name, value: region.id }))
])

const municipalityOptions: string[] = [...BUENOS_AIRES_MUNICIPALITIES]

interface TestimonialRow {
  body: string
  authorName: string
  municipality: string
}

interface GroupFormState {
  name: string
  municipality: string
  heldAt: string | null
  regionId: number | null
  testimonials: TestimonialRow[]
}

const state = reactive<GroupFormState>({
  name: '',
  municipality: '',
  heldAt: null,
  regionId: null,
  testimonials: []
})

const selectedRegionId = ref<number>(0)

watch(selectedRegionId, (value) => {
  state.regionId = value === 0 ? null : value
})

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const isEdit = computed(() => props.initialValues != null)

const canAddTestimonial = computed(() => state.testimonials.length < MAX_TESTIMONIALS)

function addTestimonial() {
  if (!canAddTestimonial.value) return
  state.testimonials.push({ body: '', authorName: '', municipality: '' })
}

function removeTestimonial(index: number) {
  state.testimonials.splice(index, 1)
}

function hydrate() {
  const values = props.initialValues
  state.name = values?.name ?? ''
  state.municipality = values?.municipality ?? ''
  state.heldAt = values?.heldAt ?? null
  state.regionId = values?.regionId ?? null
  selectedRegionId.value = values?.regionId ?? 0
  state.testimonials = (values?.testimonials ?? []).map(testimonial => ({
    body: testimonial.body,
    authorName: testimonial.authorName,
    municipality: testimonial.municipality
  }))
  formRef.value?.clear()
}

watch(() => props.open, (open) => {
  if (open) hydrate()
})

async function onSubmit() {
  saving.value = true

  const body = {
    name: state.name,
    municipality: state.municipality,
    heldAt: state.heldAt,
    regionId: state.regionId,
    testimonials: state.testimonials
  }

  try {
    if (isEdit.value && props.initialValues) {
      await $fetch(`/api/regional-meetings/testimonials/${props.initialValues.id}`, {
        method: 'PATCH',
        body
      })
    } else {
      await $fetch('/api/regional-meetings/testimonials', {
        method: 'POST',
        body
      })
    }

    toast.add({
      title: isEdit.value ? 'Testimonios actualizados' : 'Testimonios creados',
      color: 'success'
    })

    isOpen.value = false
    emit('saved')
  } catch (error) {
    if (!applyServerErrors(formRef.value, error)) {
      toast.add({
        title: 'No se pudo guardar',
        description: getErrorMessage(error),
        color: 'error'
      })
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    :title="isEdit ? 'Editar encuentro de testimonios' : 'Nuevo encuentro de testimonios'"
    description="Un encuentro agrupa hasta 3 testimonios de participantes. La región es opcional y define el color en la vista pública."
    :dismissible="!saving"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <UForm
        :id="formId"
        ref="formRef"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Nombre del encuentro"
          name="name"
          required
        >
          <UInput
            v-model="state.name"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Municipio"
          name="municipality"
          required
        >
          <USelectMenu
            v-model="state.municipality"
            :items="municipalityOptions"
            placeholder="Elegí un municipio"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Fecha"
          name="heldAt"
          required
        >
          <DateTimeField v-model="state.heldAt" />
        </UFormField>

        <UFormField
          label="Región"
          name="regionId"
          help="Opcional. Define el color y el título en la vista pública."
        >
          <USelect
            v-model="selectedRegionId"
            :items="regionItems"
            value-key="value"
            :loading="regionsStatus === 'pending'"
            class="w-full"
          />
        </UFormField>

        <div class="space-y-3 pt-2">
          <div class="flex items-center justify-between">
            <p class="font-medium text-sm">
              Testimonios ({{ state.testimonials.length }}/{{ MAX_TESTIMONIALS }})
            </p>
            <UButton
              label="Agregar testimonio"
              icon="lucide:plus"
              size="xs"
              color="neutral"
              variant="subtle"
              :disabled="!canAddTestimonial"
              @click="addTestimonial"
            />
          </div>

          <UCard
            v-for="(testimonial, index) in state.testimonials"
            :key="index"
            :ui="{ body: 'space-y-3' }"
          >
            <div class="flex items-center justify-between">
              <p class="text-sm text-muted">
                Testimonio {{ index + 1 }}
              </p>
              <UButton
                icon="lucide:trash-2"
                size="xs"
                color="error"
                variant="ghost"
                @click="removeTestimonial(index)"
              />
            </div>

            <UFormField
              label="Testimonio"
              :name="`testimonials.${index}.body`"
              required
            >
              <UTextarea
                v-model="testimonial.body"
                :rows="3"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Nombre"
              :name="`testimonials.${index}.authorName`"
              required
            >
              <UInput
                v-model="testimonial.authorName"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Municipio"
              :name="`testimonials.${index}.municipality`"
              required
            >
              <USelectMenu
                v-model="testimonial.municipality"
                :items="municipalityOptions"
                placeholder="Elegí un municipio"
                class="w-full"
              />
            </UFormField>
          </UCard>

          <p
            v-if="state.testimonials.length === 0"
            class="text-sm text-muted"
          >
            Todavía no agregaste testimonios.
          </p>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          label="Cancelar"
          color="neutral"
          variant="ghost"
          :disabled="saving"
          @click="isOpen = false"
        />
        <UButton
          label="Guardar"
          color="primary"
          type="submit"
          :form="formId"
          :loading="saving"
        />
      </div>
    </template>
  </USlideover>
</template>
