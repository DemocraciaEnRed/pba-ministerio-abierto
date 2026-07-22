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
    const created = await $fetch<PublicComment>(props.basePath, {
      method: 'POST',
      body: {
        body: event.data.body,
        parentCommentId: props.parentCommentId,
        authorMode: props.canManage ? state.authorMode : 'citizen'
      }
    })
    toast.add({
      title: props.parentCommentId ? 'Respuesta publicada' : 'Comentario publicado',
      color: 'success'
    })
    emit('created', created)
    state.body = ''
    state.authorMode = 'citizen'
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
