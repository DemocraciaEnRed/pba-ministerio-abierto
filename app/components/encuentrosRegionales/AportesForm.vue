<script setup lang="ts">
import type { Form, FormSubmitEvent, TreeItem } from '@nuxt/ui'
import {
  CreateRegionalMeetingSubmissionSchema,
  type CreateRegionalMeetingSubmissionInput,
  type RegionalMeetingSubmissionLinkInput
} from '#shared/schemas/regional-meetings'
import { EJES_TEMATICOS, type EjeTematicoNode } from '#shared/data/regional-meetings-ejes'
import {
  BUENOS_AIRES,
  PROVINCES,
  BUENOS_AIRES_MUNICIPALITIES,
  type Province,
  type BuenosAiresMunicipality
} from '#shared/data/argentina'
import type { SelfUserDTO } from '~~/server/utils/serializers/user'

defineOptions({ name: 'EncuentrosRegionalesAportesForm' })

type Schema = CreateRegionalMeetingSubmissionInput

interface EjeTematicoTreeItem extends TreeItem {
  value: string
  children?: EjeTematicoTreeItem[]
}

const ejesTematicosTree = EJES_TEMATICOS as EjeTematicoTreeItem[]

const { loggedIn } = useUserSession()
const toast = useToast()
const loading = ref(false)

const provinceOptions = [...PROVINCES]
const municipalityOptions = [...BUENOS_AIRES_MUNICIPALITIES]

const institutionOptions = [
  { label: 'Sí', value: true },
  { label: 'No', value: false }
]

const state = reactive<{
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  provincia: Province
  municipio?: BuenosAiresMunicipality
  representsInstitution: boolean
  organization?: string
  ejeTematico?: string
  subejeTematico: string | null
  ideaProyecto?: string
  comentarios?: string
  enlaces: RegionalMeetingSubmissionLinkInput[]
  website?: string
}>({
  firstName: undefined,
  lastName: undefined,
  email: undefined,
  phone: undefined,
  provincia: BUENOS_AIRES,
  municipio: undefined,
  representsInstitution: false,
  organization: undefined,
  ejeTematico: undefined,
  subejeTematico: null,
  ideaProyecto: undefined,
  comentarios: undefined,
  enlaces: [],
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
    if (me.organization) {
      state.representsInstitution = true
      state.organization = me.organization
    }
  } catch {
    // Si falla el prefill, el formulario sigue funcionando vacío.
  }
})

// --- Selección del eje temático ---
const ejeTematicoSeleccionado = ref<EjeTematicoTreeItem>()

// Eje padre al que pertenece la selección (o la misma selección si es un eje).
const ejePadreSeleccionado = computed<EjeTematicoNode | undefined>(() => {
  const seleccion = ejeTematicoSeleccionado.value
  if (!seleccion) return undefined
  return EJES_TEMATICOS.find(
    eje => eje.value === seleccion.value || eje.children?.some(sub => sub.value === seleccion.value)
  )
})

// Sincronizamos la selección del árbol con el estado del formulario (labels).
watch(ejeTematicoSeleccionado, (seleccion) => {
  const padre = ejePadreSeleccionado.value
  if (!seleccion || !padre) {
    state.ejeTematico = undefined
    state.subejeTematico = null
    return
  }
  if (padre.value === seleccion.value) {
    state.ejeTematico = padre.label
    state.subejeTematico = null
  } else {
    state.ejeTematico = padre.label
    state.subejeTematico = seleccion.label ?? null
  }
})

// --- Enlaces en la nube ---
const linkModalOpen = ref(false)

function addLink(link: RegionalMeetingSubmissionLinkInput) {
  state.enlaces.push(link)
}

function removeLink(index: number) {
  state.enlaces.splice(index, 1)
}

// --- Archivos adjuntos ---
const files = ref<File[]>([])

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
    for (const file of files.value) {
      formData.append('files', file)
    }

    await $fetch('/api/regional-meetings/submissions', {
      method: 'POST',
      body: formData
    })

    await navigateTo('/encuentros-regionales/formulario/exito')
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
    :schema="CreateRegionalMeetingSubmissionSchema"
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
                Contanos quién sos para poder identificar tu aporte.
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
            label="¿Representás alguna institución u organización?"
            name="representsInstitution"
            required
          >
            <URadioGroup
              v-model="state.representsInstitution"
              :items="institutionOptions"
              orientation="horizontal"
              variant="card"
            />
          </UFormField>

          <UFormField
            v-if="state.representsInstitution"
            label="Nombre de la institución u organización"
            name="organization"
            required
          >
            <UInput
              v-model="state.organization"
              placeholder="Nombre de la institución u organización"
              class="w-full"
            />
          </UFormField>
        </div>
      </UCard>

      <UCard variant="subtle">
        <template #header>
          <div class="flex justify-between items-center gap-3">
            <div>
              <h2 class="text-lg font-semibold text-highlighted">
                Aportes al Plan Estratégico de Infraestructura
              </h2>
              <p class="text-sm text-muted">
                Compartinos tus ideas, proyectos y comentarios.
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
            name="ejeTematico"
            label="¿A qué eje temático querés sumar aportes?"
            help="Desplegá un eje y elegí el subtema al que corresponde tu aporte, o marcá que tu aporte es para todo el Plan."
            required
          >
            <UTree
              v-model="ejeTematicoSeleccionado"
              :items="ejesTematicosTree"
              :get-key="(item) => (item as EjeTematicoTreeItem).value"
              color="primary"
              class="w-full border border-accented rounded-md p-2 bg-white dark:bg-neutral-900"
            />
          </UFormField>

          <div
            v-if="ejeTematicoSeleccionado"
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
                {{ ejeTematicoSeleccionado.label }}
              </p>
              <p
                v-if="ejePadreSeleccionado && ejePadreSeleccionado.value !== ejeTematicoSeleccionado.value"
                class="text-muted"
              >
                Eje temático: {{ ejePadreSeleccionado.label }}
              </p>
            </div>
          </div>

          <UFormField
            label="¿Tenés alguna idea y/o proyecto que quisieras compartirnos?"
            name="ideaProyecto"
          >
            <UTextarea
              v-model="state.ideaProyecto"
              :rows="4"
              autoresize
              placeholder="Contanos tu idea o proyecto"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Si querés ampliar alguna información o dejarnos otros comentarios/aportes, podés hacerlo acá."
            name="comentarios"
          >
            <UTextarea
              v-model="state.comentarios"
              :rows="4"
              autoresize
              placeholder="Comentarios o aportes adicionales"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Enlaces en la nube"
            help="Compartí archivos mediante enlaces públicos (Google Drive, Dropbox, etc.)."
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
            label="Archivos adjuntos"
            name="files"
          >
            <AttachmentsPicker
              v-model="files"
              :disabled="loading"
            />
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

    <EncuentrosRegionalesSubmissionLinkModal
      v-model:open="linkModalOpen"
      @add="addLink"
    />
  </UForm>
</template>
