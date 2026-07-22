<script setup lang="ts">
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import { ResetPasswordSchema } from '#shared/schemas/auth'

const { resetPassword, loading } = useAuth()

definePageMeta({
  layout: 'default',
  middleware: 'guest'
})

usePrivatePageSeo('Restablecer contraseña')

const route = useRoute()

const token = typeof route.query.token === 'string' ? route.query.token : ''

// La validación de la contraseña se comparte con el backend; el token viaja en
// la URL, así que el formulario solo valida la contraseña nueva.
const FormSchema = ResetPasswordSchema.pick({ newPassword: true })
type FormInput = { newPassword: string }

const fields: AuthFormField[] = [{
  name: 'newPassword',
  type: 'password',
  label: 'Nueva contraseña',
  placeholder: 'Ingrese su nueva contraseña',
  required: true
}]

const handleSubmit = (event: FormSubmitEvent<FormInput>) =>
  resetPassword({ token, newPassword: event.data.newPassword })
</script>

<template>
  <UContainer>
    <UPage>
      <UPageCard
        class="w-full max-w-md mx-auto mt-20"
        variant="subtle"
      >
        <template v-if="token">
          <UAuthForm
            :schema="FormSchema"
            title="Restablecer contraseña"
            description="Elegí una nueva contraseña para tu cuenta."
            icon="lucide:lock-keyhole"
            :fields="fields"
            :loading="loading"
            :submit="{ label: 'Guardar contraseña', block: true, icon: 'lucide:save' }"
            @submit="handleSubmit"
          />
        </template>

        <div
          v-else
          class="flex flex-col items-center gap-4 py-6 text-center"
        >
          <UIcon
            name="lucide:circle-alert"
            class="size-10 text-error"
          />
          <p class="text-toned">
            El enlace de restablecimiento no es válido o está incompleto.
          </p>
          <UButton
            to="/auth/recover-password"
            label="Solicitar un nuevo enlace"
            icon="lucide:key-round"
          />
        </div>
      </UPageCard>
    </UPage>
  </UContainer>
</template>
