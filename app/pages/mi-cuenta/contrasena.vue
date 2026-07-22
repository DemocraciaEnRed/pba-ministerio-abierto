<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { ChangePasswordSchema, type ChangePasswordInput } from '#shared/schemas/auth'

definePageMeta({
  layout: 'mi-cuenta-control-panel',
  middleware: 'auth'
})

usePrivatePageSeo('Cambiar contraseña')

const { changePassword, loading } = useAccount()

const state = reactive<Partial<ChangePasswordInput>>({
  currentPassword: undefined,
  newPassword: undefined
})

async function onSubmit(event: FormSubmitEvent<ChangePasswordInput>) {
  const ok = await changePassword(event.data)
  if (ok) {
    state.currentPassword = undefined
    state.newPassword = undefined
  }
}
</script>

<template>
  <UPageBody>
    <UPageHeader
      title="Cambiar contraseña"
      description="Elegí una contraseña nueva para proteger tu cuenta."
    />

    <UForm
      :schema="ChangePasswordSchema"
      :state="state"
      class="mt-6 space-y-4 max-w-md"
      @submit="onSubmit"
    >
      <UFormField
        label="Contraseña actual"
        name="currentPassword"
        required
      >
        <UInput
          v-model="state.currentPassword"
          type="password"
          placeholder="Ingresá tu contraseña actual"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Nueva contraseña"
        name="newPassword"
        required
      >
        <UInput
          v-model="state.newPassword"
          type="password"
          placeholder="Mínimo 8 caracteres"
          class="w-full"
        />
      </UFormField>

      <UButton
        type="submit"
        label="Guardar contraseña"
        icon="lucide:save"
        :loading="loading"
      />
    </UForm>
  </UPageBody>
</template>
