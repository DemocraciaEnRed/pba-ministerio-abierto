<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { RequestEmailChangeSchema, type RequestEmailChangeInput } from '#shared/schemas/auth'
import type { SelfUserDTO } from '~~/server/utils/serializers/user'

definePageMeta({
  layout: 'mi-cuenta-control-panel',
  middleware: 'auth'
})

usePrivatePageSeo('Cambiar correo')

const { requestEmailChange, loading } = useAccount()

const { data: profile } = await useFetch<SelfUserDTO>('/api/me')

const state = reactive<Partial<RequestEmailChangeInput>>({
  newEmail: undefined,
  currentPassword: undefined
})

async function onSubmit(event: FormSubmitEvent<RequestEmailChangeInput>) {
  const ok = await requestEmailChange(event.data)
  if (ok) {
    state.newEmail = undefined
    state.currentPassword = undefined
  }
}
</script>

<template>
  <UPageBody>
    <UPageHeader
      title="Cambiar email"
      description="Actualizá el correo electrónico asociado a tu cuenta."
    />

    <div class="mt-6 max-w-md space-y-6">
      <UFormField label="Correo actual">
        <UInput
          :model-value="profile?.email ?? ''"
          disabled
          class="w-full"
        />
      </UFormField>

      <UAlert
        color="neutral"
        variant="subtle"
        icon="lucide:info"
        description="Te enviaremos un enlace de confirmación al nuevo correo. El cambio se aplica recién cuando lo confirmás desde ese enlace."
      />

      <UForm
        :schema="RequestEmailChangeSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Nuevo correo electrónico"
          name="newEmail"
          required
        >
          <UInput
            v-model="state.newEmail"
            type="email"
            placeholder="nuevo@email.com"
            class="w-full"
          />
        </UFormField>

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

        <UButton
          type="submit"
          label="Enviar confirmación"
          icon="lucide:mail-check"
          :loading="loading"
        />
      </UForm>
    </div>
  </UPageBody>
</template>
