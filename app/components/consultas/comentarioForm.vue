<script setup lang="ts">
import type { Form, FormSubmitEvent } from '@nuxt/ui'
import { CreateCommentSchema, type CreateCommentInput } from '#shared/schemas/comment'
import type { PublicComment } from '~/types/consulta'

const props = withDefaults(
  defineProps<{
    /** Endpoint de creación (consulta o tema). */
    basePath: string
    /** Si se responde a un comentario principal, su id; null para nivel raíz. */
    parentCommentId?: number | null
    /** Habilita el toggle "comentar como institución" (solo gestores/admins). */
    canManage?: boolean
    /** Ventana de participación abierta. */
    commentingOpen: boolean
    /** Variante compacta para el formulario de respuesta. */
    compact?: boolean
    /** Muestra un botón para cancelar (en respuestas). */
    cancelable?: boolean
  }>(),
  {
    parentCommentId: null,
    canManage: false,
    compact: false,
    cancelable: false
  }
)

const emit = defineEmits<{
  created: [comment: PublicComment]
  cancel: []
}>()

const { loggedIn } = useUserSession()
const route = useRoute()
const toast = useToast()

const loginLink = computed(() => `/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)

const formRef = ref<Form<CreateCommentInput>>()
const submitting = ref(false)

// Adjunto opcional (un solo archivo, ≤ 10 MB). Se valida acá en cliente y otra
// vez en el servidor; solo lo descargan gestores/admins desde el panel.
const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024
const ATTACHMENT_ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/webp'
]
const ATTACHMENT_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.webp'

const selectedFile = ref<File | null>(null)
const fileError = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function onFileChange(event: Event): void {
  fileError.value = null
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!ATTACHMENT_ALLOWED_MIMES.includes(file.type)) {
    fileError.value = 'El archivo debe ser un PDF, un documento de Office, texto o una imagen (.jpg/.png/.webp).'
    input.value = ''
    return
  }
  if (file.size > ATTACHMENT_MAX_BYTES) {
    fileError.value = 'El archivo supera el máximo permitido de 10 MB.'
    input.value = ''
    return
  }

  selectedFile.value = file
}

function clearFile(): void {
  selectedFile.value = null
  fileError.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const state = reactive<{ body: string, authorMode: 'citizen' | 'institution' }>({
  body: '',
  authorMode: 'citizen'
})

const asInstitution = computed({
  get: () => state.authorMode === 'institution',
  set: (value: boolean) => {
    state.authorMode = value ? 'institution' : 'citizen'
  }
})

async function onSubmit(event: FormSubmitEvent<CreateCommentInput>): Promise<void> {
  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('body', event.data.body)
    if (props.parentCommentId !== null && props.parentCommentId !== undefined) {
      formData.append('parentCommentId', String(props.parentCommentId))
    }
    formData.append('authorMode', props.canManage ? state.authorMode : 'citizen')
    if (selectedFile.value) {
      formData.append('file', selectedFile.value)
    }

    const created = await $fetch<PublicComment>(props.basePath, {
      method: 'POST',
      body: formData
    })
    toast.add({
      title: props.parentCommentId ? 'Respuesta publicada' : 'Comentario publicado',
      color: 'success'
    })
    emit('created', created)
    state.body = ''
    state.authorMode = 'citizen'
    clearFile()
  } catch (error) {
    if (!applyServerErrors(formRef.value, error)) {
      toast.add({
        title: 'No se pudo publicar el comentario',
        description: getErrorMessage(error),
        color: 'error'
      })
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UCard
    v-if="!loggedIn"
    variant="subtle"
    :ui="{ body: 'text-center' }"
    color="primary"
  >
    <p class="text-lg text-primary">
      No te quedes afuera
    </p>
    <p class="text-sm text-muted mb-4">
      Iniciá sesión para poder comentar y participar.
    </p>
    <UButton
      :to="loginLink"
      label="Iniciar sesión"
      icon="i-lucide-log-in"
      color="primary"
      variant="subtle"
    />
  </UCard>

  <UForm
    v-else
    ref="formRef"
    :schema="CreateCommentSchema"
    :state="state"
    class="space-y-3"
    @submit="onSubmit"
  >
    <UFormField name="body">
      <UTextarea
        v-model="state.body"
        :rows="compact ? 2 : 3"
        :placeholder="parentCommentId ? 'Escribí una respuesta…' : 'Escribí un comentario…'"
        autoresize
        class="w-full"
      />
    </UFormField>

    <div class="space-y-1.5">
      <div
        v-if="selectedFile"
        class="flex items-center justify-between gap-3 rounded-lg border border-default px-3 py-2"
      >
        <div class="flex min-w-0 items-center gap-2">
          <UIcon
            name="i-lucide-paperclip"
            class="size-4 shrink-0 text-muted"
          />
          <span class="truncate text-sm">{{ selectedFile.name }}</span>
          <span class="shrink-0 text-xs text-muted">{{ formatFileSize(selectedFile.size) }}</span>
        </div>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Quitar archivo"
          @click="clearFile"
        />
      </div>

      <UFieldGroup v-else>
        <UButton
          icon="i-lucide-paperclip"
          label="Adjuntar archivo"
          color="neutral"
          variant="subtle"
          size="sm"
          @click="fileInput?.click()"
        />
      </UFieldGroup>

      <input
        ref="fileInput"
        type="file"
        :accept="ATTACHMENT_ACCEPT"
        class="hidden"
        @change="onFileChange"
      >

      <p
        v-if="fileError"
        class="text-sm text-error"
      >
        {{ fileError }}
      </p>
      <p
        v-else-if="!selectedFile"
        class="text-xs text-muted"
      >
        Opcional. Un archivo (PDF, Office, texto o imagen), hasta 10 MB.
      </p>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2">
      <UFormField
        v-if="canManage"
        name="authorMode"
      >
        <USwitch
          v-model="asInstitution"
          label="Comentar como institución"
          size="sm"
        />
      </UFormField>
      <span v-else />

      <div class="flex items-center gap-2">
        <UButton
          v-if="cancelable"
          label="Cancelar"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="submitting"
          @click="emit('cancel')"
        />
        <UButton
          type="submit"
          :label="parentCommentId ? 'Responder' : 'Comentar'"
          icon="i-lucide-send"
          color="primary"
          size="sm"
          :loading="submitting"
          :disabled="!commentingOpen"
        />
      </div>
    </div>
  </UForm>
</template>
