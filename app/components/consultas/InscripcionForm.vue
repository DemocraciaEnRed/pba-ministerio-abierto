<script setup lang="ts">
import type { Form, FormSubmitEvent } from '@nuxt/ui'
import {
  buildConsultationRegistrationSchema,
  type CreateConsultationRegistrationInput
} from '#shared/schemas/consultation-registrations'
import {
  REGISTRATION_CHARACTER_LABELS,
  REGISTRATION_PARTICIPATION_MODE_LABELS,
  REGISTRATION_PRIVACY_CONTACT_EMAIL,
  REGISTRATION_INSTITUTION_SOURCE_LABELS,
  REGISTRATION_ATTENDANCE_MODE_LABELS,
  type RegistrationConfirmation
} from '#shared/data/consultation-registrations'
import type { PublicConsultationRegistrationFormDTO } from '~~/server/utils/serializers/consultationRegistrationForm'
import type { SelfUserDTO } from '~~/server/utils/serializers/user'

defineOptions({ name: 'ConsultasInscripcionForm' })

const props = defineProps<{
  form: PublicConsultationRegistrationFormDTO
  consultationId: string
  /** URL pública canónica de la consulta (base de los enlaces de inscripción). */
  publicPath: string
}>()

type Schema = CreateConsultationRegistrationInput

// Instrumento de personería: PDF, Word o imagen escaneada, hasta 8 MB.
const PROOF_MAX_BYTES = 8 * 1024 * 1024
const PROOF_ACCEPT = '.pdf,.doc,.docx,.jpg,.jpeg,.png'
const PROOF_ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png'
]

const isHearing = computed(() => props.form.kind === 'hearing')
const isObservatory = computed(() => props.form.kind === 'observatory')

const schema = computed(() => buildConsultationRegistrationSchema(props.form.kind, props.form))
const confirmation = useState<RegistrationConfirmation | null>('registration-confirmation', () => null)
confirmation.value = null

interface InstitutionOption {
  id: number
  categoryId: number
  name: string
  isActive?: boolean
}
interface InstitutionCategoryOption {
  id: number
  isActive?: boolean
}
const { data: directory, error: directoryError, refresh: refreshDirectory } = await useAsyncData(
  () => `registration-directory-${props.consultationId}`,
  async () => {
    if (!isObservatory.value) return []
    const [institutions, categories] = await Promise.all([
      $fetch<InstitutionOption[]>('/api/observatory-institutions'),
      $fetch<InstitutionCategoryOption[]>('/api/observatory-institution-categories')
    ])
    const activeCategoryIds = new Set(categories.filter(category => category.isActive !== false).map(category => category.id))
    return institutions.filter(institution => institution.isActive !== false && activeCategoryIds.has(institution.categoryId))
  }
)
const institutionSources = computed(() =>
  (Object.keys(REGISTRATION_INSTITUTION_SOURCE_LABELS) as Array<keyof typeof REGISTRATION_INSTITUTION_SOURCE_LABELS>)
    .filter(value => value === 'directory'
      || (value === 'other' && props.form.admissionPolicy !== 'directory_only')
      || (value === 'individual' && props.form.admissionPolicy === 'open'))
    .map(value => ({ value, label: REGISTRATION_INSTITUTION_SOURCE_LABELS[value] }))
)
const attendanceModes = Object.entries(REGISTRATION_ATTENDANCE_MODE_LABELS).map(([value, label]) => ({ value, label }))

const { loggedIn } = useUserSession()
const toast = useToast()
const loading = ref(false)

const characterOptions = (Object.keys(REGISTRATION_CHARACTER_LABELS) as Array<keyof typeof REGISTRATION_CHARACTER_LABELS>)
  .map(value => ({ value, label: REGISTRATION_CHARACTER_LABELS[value] }))

const participationModeOptions = (Object.keys(REGISTRATION_PARTICIPATION_MODE_LABELS) as Array<keyof typeof REGISTRATION_PARTICIPATION_MODE_LABELS>)
  .map(value => ({ value, label: REGISTRATION_PARTICIPATION_MODE_LABELS[value] }))

const state = reactive<{
  firstName?: string
  lastName?: string
  dni?: string
  email?: string
  phone?: string
  character: 'individual' | 'legal_entity'
  entityName?: string
  entityAddress?: string
  entityEmail?: string
  entityPhone?: string
  proofUrl?: string
  hasProofFile: boolean
  participationMode: 'attendee' | 'speaker_request' | 'speaker_report' | undefined
  presentationSummary?: string
  documentationDetail?: string
  questions: string[]
  website?: string
  attendanceMode?: 'in_person' | 'virtual'
  institutionSource: 'directory' | 'other' | 'individual'
  institutionId?: number
  institutionName?: string
}>({
  firstName: undefined,
  lastName: undefined,
  dni: undefined,
  email: undefined,
  phone: undefined,
  character: 'individual',
  entityName: undefined,
  entityAddress: undefined,
  entityEmail: undefined,
  entityPhone: undefined,
  proofUrl: undefined,
  hasProofFile: false,
  participationMode: undefined,
  presentationSummary: undefined,
  documentationDetail: undefined,
  questions: [''],
  website: undefined,
  attendanceMode: undefined,
  institutionSource: 'directory',
  institutionId: undefined,
  institutionName: undefined
})

watch(() => props.form.eventMode, (mode) => {
  state.attendanceMode = mode === 'hybrid' ? undefined : mode
}, { immediate: true })
watch(() => state.institutionSource, () => {
  state.institutionId = undefined
  state.institutionName = undefined
})
onBeforeRouteLeave((to) => {
  if (to.path !== `${props.publicPath}/inscripcion/exito`) confirmation.value = null
})

const isLegalEntity = computed(() => !isObservatory.value && state.character === 'legal_entity')
const isSpeaker = computed(() =>
  isHearing.value && state.participationMode !== undefined && state.participationMode !== 'attendee'
)

onMounted(async () => {
  if (!loggedIn.value) return
  try {
    const me = await $fetch<SelfUserDTO>('/api/me')
    state.firstName = me.firstName ?? state.firstName
    state.lastName = me.lastName ?? state.lastName
    state.email = me.email ?? state.email
    // El teléfono se guarda como `+54XXXX`; el input muestra el `+54` aparte.
    state.phone = me.phone ? me.phone.replace(/^\+54/, '') : state.phone
  } catch (error) {
    toast.add({ title: 'No pudimos autocompletar tus datos', description: getErrorMessage(error), color: 'warning' })
  }
})

// --- Preguntas dinámicas ---
function addQuestion() {
  state.questions.push('')
}

function removeQuestion(index: number) {
  if (state.questions.length <= 1) return
  state.questions.splice(index, 1)
}

// --- Instrumento de personería ---
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

  if (!PROOF_ALLOWED_MIMES.includes(file.type)) {
    fileError.value = 'El archivo debe ser un PDF, un documento de Word (.doc/.docx) o una imagen (.jpg/.png).'
    input.value = ''
    return
  }
  if (file.size > PROOF_MAX_BYTES) {
    fileError.value = 'El archivo supera el máximo permitido de 8 MB.'
    input.value = ''
    return
  }

  selectedFile.value = file
  state.hasProofFile = true
}

function clearFile() {
  selectedFile.value = null
  state.hasProofFile = false
  fileError.value = null
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
  confirmation.value = null
  try {
    const formData = new FormData()
    formData.append('payload', JSON.stringify({ ...event.data, phone: state.phone }))
    if (selectedFile.value && isLegalEntity.value) {
      formData.append('file', selectedFile.value)
    }

    const response = await $fetch<{ success: boolean, confirmation?: RegistrationConfirmation }>(`/api/consultations/${props.consultationId}/registrations`, {
      method: 'POST',
      body: formData
    })
    confirmation.value = response.confirmation ?? null

    await navigateTo(`${props.publicPath}/inscripcion/exito`)
  } catch (error) {
    const e = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: e?.data?.message || e?.message || 'No se pudo enviar tu inscripción. Intentá de nuevo.',
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
    :schema="schema"
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
                Datos de la persona participante
              </h2>
              <p class="text-sm text-muted">
                Necesitamos estos datos para acreditar tu participación.
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
            label="DNI"
            name="dni"
            required
          >
            <UInput
              v-model="state.dni"
              inputmode="numeric"
              placeholder="Solo números, sin puntos"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Dirección de correo electrónico"
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
            label="Teléfono de contacto"
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

          <UFormField
            v-if="!isObservatory"
            label="Carácter en que participa"
            name="character"
            required
          >
            <URadioGroup
              v-model="state.character"
              :items="characterOptions"
              variant="card"
            />
          </UFormField>
        </div>
      </UCard>

      <UCard
        v-if="isObservatory"
        variant="subtle"
      >
        <template #header>
          <h2 class="text-lg font-semibold text-highlighted">
            Participación en la reunión
          </h2>
        </template>
        <div class="space-y-4">
          <UFormField
            label="Cómo participás"
            name="institutionSource"
            required
          >
            <URadioGroup
              v-model="state.institutionSource"
              :items="institutionSources"
              variant="card"
            />
          </UFormField>
          <template v-if="state.institutionSource === 'directory'">
            <UAlert
              v-if="directoryError"
              color="error"
              title="No pudimos cargar el directorio"
              :description="getErrorMessage(directoryError)"
              :actions="[{ label: 'Reintentar', onClick: () => refreshDirectory() }]"
            />
            <UFormField
              label="Institución"
              name="institutionId"
              required
            >
              <USelectMenu
                v-model="state.institutionId"
                :items="directory ?? []"
                label-key="name"
                value-key="id"
                placeholder="Buscá y elegí tu institución"
                class="w-full"
              />
            </UFormField>
            <p class="text-sm text-muted">
              La elección es declarativa y no verifica tu representación institucional.
            </p>
          </template>
          <UFormField
            v-else-if="state.institutionSource === 'other'"
            label="Nombre de la organización"
            name="institutionName"
            required
          >
            <UInput
              v-model="state.institutionName"
              :maxlength="191"
              class="w-full"
            />
            <template #help>
              La inscripción no incorpora la organización al directorio.
            </template>
          </UFormField>
          <UFormField
            v-if="form.eventMode === 'hybrid'"
            label="Modalidad de asistencia"
            name="attendanceMode"
            required
          >
            <URadioGroup
              v-model="state.attendanceMode"
              :items="attendanceModes"
              variant="card"
            />
          </UFormField>
          <p
            v-else
            class="text-sm"
          >
            Modalidad de asistencia: <strong>{{ REGISTRATION_ATTENDANCE_MODE_LABELS[form.eventMode] }}</strong>
          </p>
        </div>
      </UCard>

      <UCard
        v-if="isLegalEntity"
        variant="subtle"
      >
        <template #header>
          <div class="flex justify-between items-center gap-3">
            <div>
              <h2 class="text-lg font-semibold text-highlighted">
                Persona jurídica representada
              </h2>
              <p class="text-sm text-muted">
                Datos de la organización y el instrumento que acredita la personería.
              </p>
            </div>
            <UIcon
              name="lucide:building-2"
              class="size-5 shrink-0 text-muted"
            />
          </div>
        </template>

        <div class="space-y-4">
          <UFormField
            label="Denominación / Razón social"
            name="entityName"
            required
          >
            <UInput
              v-model="state.entityName"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Domicilio"
            name="entityAddress"
            required
          >
            <UInput
              v-model="state.entityAddress"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Dirección de correo electrónico"
            name="entityEmail"
            required
          >
            <UInput
              v-model="state.entityEmail"
              type="email"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Teléfono de contacto"
            name="entityPhone"
            required
          >
            <UInput
              v-model="state.entityPhone"
              type="tel"
              inputmode="tel"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Instrumento que acredita la personería invocada"
            name="proofUrl"
            help="Adjuntá un archivo (PDF, Word o imagen, hasta 8 MB) o pegá el enlace a un documento en la web."
            required
          >
            <div class="space-y-3">
              <div
                v-if="selectedFile"
                class="flex items-center justify-between gap-3 rounded-lg border border-default px-3 py-2"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <UIcon
                    name="lucide:paperclip"
                    class="size-4 shrink-0 text-muted"
                  />
                  <span class="truncate text-sm">{{ selectedFile.name }}</span>
                  <span class="text-xs text-muted shrink-0">{{ formatFileSize(selectedFile.size) }}</span>
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

              <input
                v-else
                ref="fileInput"
                type="file"
                :accept="PROOF_ACCEPT"
                class="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-elevated file:px-3 file:py-1.5 file:text-sm"
                @change="onFileChange"
              >

              <p
                v-if="fileError"
                class="text-sm text-error"
              >
                {{ fileError }}
              </p>

              <UInput
                v-model="state.proofUrl"
                type="url"
                placeholder="https://... (enlace al documento)"
                class="w-full"
              />
            </div>
          </UFormField>
        </div>
      </UCard>

      <UCard
        v-if="isHearing"
        variant="subtle"
      >
        <template #header>
          <div class="flex justify-between items-center gap-3">
            <div>
              <h2 class="text-lg font-semibold text-highlighted">
                Forma de participación
              </h2>
              <p class="text-sm text-muted">
                Indicá si vas a asistir o si solicitás el uso de la palabra.
              </p>
            </div>
            <UIcon
              name="lucide:megaphone"
              class="size-5 shrink-0 text-muted"
            />
          </div>
        </template>

        <UFormField
          name="participationMode"
          required
        >
          <URadioGroup
            v-model="state.participationMode"
            :items="participationModeOptions"
            variant="card"
          />
        </UFormField>
      </UCard>

      <UCard
        v-if="isSpeaker"
        variant="subtle"
      >
        <template #header>
          <div class="flex justify-between items-center gap-3">
            <div>
              <h2 class="text-lg font-semibold text-highlighted">
                Descripción de la exposición a realizar
              </h2>
              <p class="text-sm text-muted">
                Contanos qué vas a exponer y qué documentación acompañás.
              </p>
            </div>
            <UIcon
              name="lucide:file-text"
              class="size-5 shrink-0 text-muted"
            />
          </div>
        </template>

        <div class="space-y-4">
          <UFormField
            label="Descripción breve de la exposición"
            name="presentationSummary"
            required
          >
            <UTextarea
              v-model="state.presentationSummary"
              :rows="4"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Detalle de la documentación acompañada (título y tipo)"
            name="documentationDetail"
            help="Podés usar formato Markdown."
            required
          >
            <UTextarea
              v-model="state.documentationDetail"
              :rows="4"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Preguntas que formula"
            name="questions"
            help="Si formulás preguntas, incluilas acá. Podés agregar más de una."
            required
          >
            <div class="space-y-2">
              <div
                v-for="(_, index) in state.questions"
                :key="index"
                class="flex items-start gap-2"
              >
                <UInput
                  v-model="state.questions[index]"
                  :placeholder="`Pregunta ${index + 1}`"
                  class="w-full"
                />
                <UButton
                  v-if="state.questions.length > 1"
                  icon="lucide:x"
                  color="neutral"
                  variant="ghost"
                  aria-label="Quitar pregunta"
                  @click="removeQuestion(index)"
                />
              </div>

              <UButton
                label="Agregar pregunta"
                icon="lucide:plus"
                color="neutral"
                variant="subtle"
                size="sm"
                :disabled="state.questions.length >= 20"
                @click="addQuestion"
              />
            </div>
          </UFormField>
        </div>
      </UCard>

      <UAlert
        color="neutral"
        variant="subtle"
        icon="lucide:shield-check"
      >
        <template #description>
          Los datos personales recopilados mediante este formulario tienen como única finalidad organizar la
          participación y establecer el orden del día de manera eficiente. Usted tiene derecho a acceder,
          rectificar, actualizar y suprimir sus datos, así como a oponerse a su tratamiento, mediante
          comunicación a
          <ULink :to="`mailto:${REGISTRATION_PRIVACY_CONTACT_EMAIL}`">
            {{ REGISTRATION_PRIVACY_CONTACT_EMAIL }}
          </ULink>. El consentimiento es voluntario, y al continuar, usted consiente el tratamiento de sus
          datos conforme a la Ley 25.326 y normativa aplicable.
        </template>
      </UAlert>

      <div class="flex justify-end">
        <UButton
          label="Enviar inscripción"
          type="submit"
          size="lg"
          :loading="loading"
        />
      </div>
    </fieldset>
  </UForm>
</template>
