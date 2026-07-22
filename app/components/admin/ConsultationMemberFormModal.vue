<script setup lang="ts">
import type { Form, FormSubmitEvent } from '@nuxt/ui'
import { AssignConsultationMemberSchema, type AssignConsultationMemberInput } from '#shared/schemas/consultation'

export interface ConsultationMember {
  id: number
  userId: number
  role: string
  assignedAt: string
  assignedBy: {
    id: number
    displayName: string | null
    email: string
  } | null
  user: {
    id: number
    email: string
    firstName: string | null
    lastName: string | null
    displayName: string | null
    status: string
    roles: {
      isPlatformAdmin: boolean
    }
  }
}

interface EligibleUser {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  displayName: string | null
}

const props = defineProps<{
  open: boolean
  consultationSlug: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const toast = useToast()
const formId = useId()
const formRef = ref<Form<AssignConsultationMemberInput>>()

const saving = ref(false)
const eligibleUsers = ref<EligibleUser[]>([])
const eligibleLoading = ref(false)

const state = reactive<{ userId: number | undefined, role: 'consultation_admin' }>({
  userId: undefined,
  role: 'consultation_admin'
})

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const roleItems = [
  { label: 'Administrador de la consulta', value: 'consultation_admin' }
]

function userLabel(user: EligibleUser): string {
  const name = user.displayName
    || [user.firstName, user.lastName].filter(Boolean).join(' ')
    || user.email
  return `${name} · ${user.email}`
}

const userItems = computed(() =>
  eligibleUsers.value.map(user => ({ label: userLabel(user), value: user.id }))
)

const hasEligible = computed(() => eligibleUsers.value.length > 0)

async function loadEligible() {
  eligibleLoading.value = true
  try {
    eligibleUsers.value = await $fetch<EligibleUser[]>(
      `/api/consultations/${props.consultationSlug}/members/eligible`
    )
  } catch (error) {
    toast.add({
      title: 'No se pudieron cargar los usuarios elegibles',
      description: getErrorMessage(error),
      color: 'error'
    })
  } finally {
    eligibleLoading.value = false
  }
}

function hydrate() {
  state.userId = undefined
  state.role = 'consultation_admin'
  formRef.value?.clear()
}

watch(() => props.open, (open) => {
  if (open) {
    hydrate()
    loadEligible()
  }
})

async function onSubmit(event: FormSubmitEvent<AssignConsultationMemberInput>) {
  saving.value = true
  try {
    await $fetch(`/api/consultations/${props.consultationSlug}/members`, {
      method: 'POST',
      body: event.data
    })

    toast.add({
      title: 'Miembro agregado',
      color: 'success'
    })

    isOpen.value = false
    emit('saved')
  } catch (error) {
    if (!applyServerErrors(formRef.value, error)) {
      toast.add({
        title: 'No se pudo agregar el miembro',
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
    title="Agregar miembro"
    description="Designá a un ciudadano de confianza como administrador de la consulta."
    :dismissible="!saving"
    :ui="{ content: 'max-w-xl' }"
  >
    <template #body>
      <UForm
        :id="formId"
        ref="formRef"
        :schema="AssignConsultationMemberSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UAlert
          v-if="!eligibleLoading && !hasEligible"
          icon="i-lucide-users"
          color="neutral"
          variant="subtle"
          title="No hay usuarios elegibles"
          description="Solo pueden designarse usuarios con rol de colaborador que todavía no sean miembros de esta consulta."
        />

        <UFormField
          label="Usuario"
          name="userId"
          help="Solo aparecen usuarios con rol de colaborador que aún no son miembros."
          required
        >
          <USelectMenu
            v-model="state.userId"
            :items="userItems"
            value-key="value"
            :loading="eligibleLoading"
            :disabled="!hasEligible"
            placeholder="Elegí un usuario"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Rol"
          name="role"
          required
        >
          <USelect
            v-model="state.role"
            :items="roleItems"
            class="w-full"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-3">
        <UButton
          label="Cancelar"
          color="neutral"
          variant="ghost"
          :disabled="saving"
          @click="isOpen = false"
        />
        <UButton
          type="submit"
          :form="formId"
          label="Agregar miembro"
          icon="i-lucide-user-plus"
          :loading="saving"
          :disabled="!hasEligible"
        />
      </div>
    </template>
  </USlideover>
</template>
