<script setup lang="ts">
import type { Form, FormSubmitEvent, TreeItem } from '@nuxt/ui'
import {
  CreateObservatoryContributionSchema,
  type CreateObservatoryContributionInput,
  type ObservatoryContributionLinkInput
} from '#shared/schemas/observatory'
import { isContributionWorkGroupSlug } from '#shared/data/observatory-work-groups'
import {
  BUENOS_AIRES,
  PROVINCES,
  BUENOS_AIRES_MUNICIPALITIES,
  type Province,
  type BuenosAiresMunicipality
} from '#shared/data/argentina'
import type { PublicObservatoryInstitutionDTO, PublicObservatoryInstitutionCategoryDTO } from '~~/server/utils/serializers/observatoryInstitution'
import type { SelfUserDTO } from '~~/server/utils/serializers/user'

defineOptions({ name: 'ObservatorioAportesForm' })

type Schema = CreateObservatoryContributionInput

interface WorkGroupOption {
  id: number
  slug: string
  name: string
  description: string | null
}

interface CatalogTreeItem extends TreeItem {
  value: string
  children?: CatalogTreeItem[]
}

// Adjunto: un documento PDF o Word, hasta 8 MB.
const ATTACHMENT_MAX_BYTES = 8 * 1024 * 1024
const ATTACHMENT_ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const ATTACHMENT_ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

const { loggedIn } = useUserSession()
const toast = useToast()
const loading = ref(false)

const provinceOptions = [...PROVINCES]
const municipalityOptions = [...BUENOS_AIRES_MUNICIPALITIES]

const { data: institutions } = await useAsyncData('observatory-institutions-form', () =>
  $fetch<PublicObservatoryInstitutionDTO[]>('/api/observatory-institutions')
)

const { data: institutionCategories } = await useAsyncData('observatory-institution-categories-form', () =>
  $fetch<PublicObservatoryInstitutionCategoryDTO[]>('/api/observatory-institution-categories')
)

const { data: workGroups } = await useAsyncData('observatory-work-groups-form', () =>
  $fetch<WorkGroupOption[]>('/api/observatory-work-groups')
)

// Las reuniones plenarias no reciben aportes: son instancias de consenso general.
const contributionWorkGroups = computed(() =>
  (workGroups.value ?? []).filter(group => isContributionWorkGroupSlug(group.slug))
)

const state = reactive<{
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  provincia: Province
  municipio?: BuenosAiresMunicipality
  institutionId?: number
  workGroupSlug?: string
  description?: string
  enlaces: ObservatoryContributionLinkInput[]
  hasAttachment: boolean
  website?: string
}>({
  firstName: undefined,
  lastName: undefined,
  email: undefined,
  phone: undefined,
  provincia: BUENOS_AIRES,
  municipio: undefined,
  institutionId: undefined,
  workGroupSlug: undefined,
  description: undefined,
  enlaces: [],
  hasAttachment: false,
  website: undefined
})

const isBuenosAires = computed(() => state.provincia === BUENOS_AIRES)

// Al cambiar de provincia limpiamos el municipio: solo aplica a Buenos Aires.
watch(
  () => state.provincia,
  () => {
    if (!isBuenosAires.value) state.municipio = undefined
  }
)

// --- Autocompletado con los datos del usuario logueado ---
onMounted(async () => {
  if (!loggedIn.value) return
  try {
    const me = await $fetch<SelfUserDTO>('/api/me')
    state.firstName = me.firstName ?? state.firstName
    state.lastName = me.lastName ?? state.lastName
    state.email = me.email ?? state.email
    // El teléfono se guarda como `+54XXXX`; el input muestra el `+54` aparte.
    state.phone = me.phone ? me.phone.replace(/^\+54/, '') : state.phone
    if (me.provincia && (PROVINCES as readonly string[]).includes(me.provincia)) {
      state.provincia = me.provincia as Province
    }
    if (
      me.municipio
      && (BUENOS_AIRES_MUNICIPALITIES as readonly string[]).includes(me.municipio)
    ) {
      state.municipio = me.municipio as BuenosAiresMunicipality
    }
  } catch {
    // Si falla el prefill, el formulario sigue funcionando vacío.
  }
})

// --- Selección de la institución (árbol: categoría › institución) ---
const institutionsTree = computed<CatalogTreeItem[]>(() => {
  const byCategory = new Map<number, CatalogTreeItem[]>()
  for (const institution of institutions.value ?? []) {
    const children = byCategory.get(institution.categoryId) ?? []
    children.push({ value: `institucion-${institution.id}`, label: institution.name })
    byCategory.set(institution.categoryId, children)
  }

  return (institutionCategories.value ?? [])
    .map(category => ({
      value: `categoria-${category.id}`,
      label: category.name,
      children: byCategory.get(category.id) ?? []
    }))
    .filter(category => category.children.length > 0)
})

const institucionSeleccionada = ref<CatalogTreeItem>()

const institucionElegida = computed(() => {
  const value = institucionSeleccionada.value?.value
  if (!value?.startsWith('institucion-')) return undefined
  const id = Number(value.replace('institucion-', ''))
  return (institutions.value ?? []).find(institution => institution.id === id)
})

const categoriaDeLaInstitucion = computed(() => {
  const institution = institucionElegida.value
  if (!institution) return undefined
  return (institutionCategories.value ?? []).find(category => category.id === institution.categoryId)
})

// Solo las hojas del árbol son instituciones: elegir una categoría no vale.
watch(institucionElegida, (institution) => {
  state.institutionId = institution?.id
})

// --- Selección del eje de trabajo ---
const ejeTrabajoTree = computed<CatalogTreeItem[]>(() =>
  contributionWorkGroups.value.map(group => ({ value: group.slug, label: group.name }))
)

const ejeTrabajoSeleccionado = ref<CatalogTreeItem>()

watch(ejeTrabajoSeleccionado, (seleccion) => {
  state.workGroupSlug = seleccion?.value
})

// --- Enlaces en la nube ---
const linkModalOpen = ref(false)

function addLink(link: ObservatoryContributionLinkInput) {
  state.enlaces.push(link)
}

function removeLink(index: number) {
  state.enlaces.splice(index, 1)
}

// --- Archivo adjunto ---
const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const fileError = ref<string | null>(null)

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function onFileChange(event: Event) {
  fileError.value = null
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!ATTACHMENT_ALLOWED_MIMES.includes(file.type)) {
    fileError.value = 'El archivo debe ser un PDF o un documento de Word (.doc/.docx).'
    input.value = ''
    return
  }
  if (file.size > ATTACHMENT_MAX_BYTES) {
    fileError.value = 'El archivo supera el máximo permitido de 8 MB.'
    input.value = ''
    return
  }

  selectedFile.value = file
  // El archivo viaja fuera del JSON: el flag permite validar en el formulario
  // que el aporte tenga al menos un contenido.
  state.hasAttachment = true
}

function clearFile() {
  selectedFile.value = null
  fileError.value = null
  state.hasAttachment = false
  if (fileInput.value) fileInput.value.value = ''
}

const formRef = ref<Form<Schema>>()

function handleValidationError() {
  toast.add({
    title: 'Revisá el formulario',
    description: 'Hay campos obligatorios sin completar o con errores. Corregilos e intentá nuevamente.',
    icon: 'lucide:alert-circle',
    color: 'error'
  })
}

async function handleSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    const formData = new FormData()
    formData.append('payload', JSON.stringify(event.data))
    if (selectedFile.value) {
      formData.append('file', selectedFile.value)
    }

    await $fetch('/api/observatory-contributions', {
      method: 'POST',
      body: formData
    })

    await navigateTo('/observatorio-obras-servicios/formulario/exito')
  } catch (error) {
    const e = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: e?.data?.message || e?.message || 'No se pudo enviar tu aporte. Intentá de nuevo.',
      icon: 'lucide:alert-circle',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UForm
    ref="formRef"
    :schema="CreateObservatoryContributionSchema"
    :state="state"
    class="space-y-6"
    @submit="handleSubmit"
    @error="handleValidationError"
  >
    <fieldset
      :disabled="loading"
      :class="['space-y-6', loading ? 'opacity-60 pointer-events-none' : '']"
    >
      <!-- Honeypot anti-spam: oculto para personas, tentador para bots. -->
      <div
        class="absolute -left-[9999px] h-0 w-0 overflow-hidden"
        aria-hidden="true"
      >
        <label>
          No completar
          <input
            v-model="state.website"
            type="text"
            name="website"
            tabindex="-1"
            autocomplete="off"
          >
        </label>
      </div>

      <UCard variant="subtle">
        <template #header>
          <div class="flex justify-between items-center gap-3">
            <div>
              <h2 class="text-lg font-semibold text-highlighted">
                Tus datos
              </h2>
              <p class="text-sm text-muted">
                Contanos quién sos y a qué institución representás.
              </p>
            </div>
            <UIcon
              name="lucide:user"
              class="size-5 shrink-0 text-muted"
            />
          </div>
        </template>

        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField
              label="Nombre"
              name="firstName"
              required
            >
              <UInput
                v-model="state.firstName"
                placeholder="Nombre"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Apellido"
              name="lastName"
              required
            >
              <UInput
                v-model="state.lastName"
                placeholder="Apellido"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField
            label="Correo electrónico"
            name="email"
            required
          >
            <UInput
              v-model="state.email"
              type="email"
              placeholder="tu@email.com"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Número de teléfono"
            name="phone"
            hint="Código de área y número, sin el 0 ni el 15"
            required
          >
            <UFieldGroup class="w-full">
              <UBadge
                color="neutral"
                variant="subtle"
                label="+54"
                class="rounded-r-none"
              />
              <UInput
                v-model="state.phone"
                type="tel"
                inputmode="tel"
                placeholder="11 12345678"
                class="w-full"
              />
            </UFieldGroup>
          </UFormField>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField
              label="Provincia"
              name="provincia"
              required
            >
              <USelectMenu
                v-model="state.provincia"
                :items="provinceOptions"
                placeholder="Elegí tu provincia"
                class="w-full"
              />
            </UFormField>

            <UFormField
              v-if="isBuenosAires"
              label="Municipio"
              name="municipio"
              required
            >
              <USelectMenu
                v-model="state.municipio"
                :items="municipalityOptions"
                placeholder="Elegí tu municipio"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField
            name="institutionId"
            label="Institución"
            help="Desplegá una categoría y elegí la institución que representás."
            required
          >
            <UTree
              v-model="institucionSeleccionada"
              :items="institutionsTree"
              :get-key="(item) => (item as CatalogTreeItem).value"
              color="primary"
              class="w-full border border-accented rounded-md p-2 bg-white dark:bg-neutral-900"
            />
          </UFormField>

          <div
            v-if="institucionElegida"
            class="flex items-start gap-3 rounded-md border border-accented bg-elevated/50 p-4"
          >
            <UIcon
              name="lucide:check-circle"
              class="mt-0.5 size-5 shrink-0 text-primary"
            />
            <div class="text-sm leading-6">
              <p class="text-muted">
                Elegiste:
              </p>
              <p class="font-semibold text-highlighted">
                {{ institucionElegida.name }}
              </p>
              <p
                v-if="categoriaDeLaInstitucion"
                class="text-muted"
              >
                {{ categoriaDeLaInstitucion.name }}
              </p>
            </div>
          </div>
        </div>
      </UCard>

      <UCard variant="subtle">
        <template #header>
          <div class="flex justify-between items-center gap-3">
            <div>
              <h2 class="text-lg font-semibold text-highlighted">
                Presentá tu aporte
              </h2>
              <p class="text-sm text-muted">
                Compartinos el aporte de tu institución al Observatorio.
              </p>
            </div>
            <UIcon
              name="lucide:form"
              class="size-5 shrink-0 text-muted"
            />
          </div>
        </template>

        <div class="space-y-6">
          <UFormField
            name="workGroupSlug"
            label="¿A qué eje de trabajo querés sumar aportes?"
            required
          >
            <UTree
              v-model="ejeTrabajoSeleccionado"
              :items="ejeTrabajoTree"
              :get-key="(item) => (item as CatalogTreeItem).value"
              color="primary"
              class="w-full border border-accented rounded-md p-2 bg-white dark:bg-neutral-900"
            />
          </UFormField>

          <UAlert
            title="Contanos tu aporte"
            description="Podés escribir la descripción, adjuntar un archivo o compartir un enlace. Al menos una de las tres es obligatoria."
            color="neutral"
            variant="subtle"
            icon="lucide:info"
          />

          <UFormField
            label="Descripción del aporte"
            name="description"
          >
            <UTextarea
              v-model="state.description"
              :rows="6"
              autoresize
              placeholder="Contanos el aporte de tu institución"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Documentación adjunta"
            help="Opcional. Compartí archivos mediante enlaces públicos (Google Drive, Dropbox, etc.)."
          >
            <div class="space-y-3">
              <div
                v-if="state.enlaces.length"
                class="space-y-2"
              >
                <div
                  v-for="(link, index) in state.enlaces"
                  :key="index"
                  class="flex items-start justify-between gap-3 rounded-md border border-accented p-3"
                >
                  <div class="min-w-0">
                    <p
                      v-if="link.title"
                      class="text-sm font-medium text-highlighted truncate"
                    >
                      {{ link.title }}
                    </p>
                    <a
                      :href="link.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-sm text-primary break-all hover:underline"
                    >
                      {{ link.url }}
                    </a>
                  </div>
                  <UButton
                    icon="lucide:x"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    aria-label="Quitar enlace"
                    @click="removeLink(index)"
                  />
                </div>
              </div>

              <UButton
                label="Agregar un enlace"
                icon="lucide:plus"
                color="neutral"
                variant="subtle"
                @click="linkModalOpen = true"
              />
            </div>
          </UFormField>

          <UFormField
            label="Archivo adjunto (PDF o Word)"
            name="file"
            help="Opcional, hasta 8 MB."
          >
            <div class="space-y-2">
              <input
                ref="fileInput"
                type="file"
                :accept="ATTACHMENT_ACCEPT"
                class="hidden"
                @change="onFileChange"
              >

              <div
                v-if="selectedFile"
                class="flex items-center justify-between gap-3 rounded-md border border-accented p-3"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <UIcon
                    name="lucide:file-text"
                    class="size-5 shrink-0 text-muted"
                  />
                  <div class="min-w-0">
                    <p class="text-sm text-highlighted truncate">
                      {{ selectedFile.name }}
                    </p>
                    <p class="text-xs text-muted">
                      {{ formatFileSize(selectedFile.size) }}
                    </p>
                  </div>
                </div>
                <UButton
                  icon="lucide:x"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  aria-label="Quitar archivo"
                  @click="clearFile"
                />
              </div>

              <UButton
                v-else
                label="Adjuntar archivo"
                icon="lucide:paperclip"
                color="neutral"
                variant="subtle"
                @click="fileInput?.click()"
              />

              <p
                v-if="fileError"
                class="text-sm text-error"
              >
                {{ fileError }}
              </p>
            </div>
          </UFormField>
        </div>
      </UCard>

      <div class="flex justify-end">
        <UButton
          type="submit"
          label="Enviar aporte"
          icon="lucide:send"
          size="xl"
          block
          :loading="loading"
        />
      </div>
    </fieldset>

    <ObservatorioContributionLinkModal
      v-model:open="linkModalOpen"
      @add="addLink"
    />
  </UForm>
</template>
