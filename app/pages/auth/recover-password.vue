<script setup lang="ts">
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import { RequestPasswordResetSchema, type RequestPasswordResetInput } from '#shared/schemas/auth'

const { requestPasswordReset, loading } = useAuth()

definePageMeta({
  layout: 'default',
  middleware: 'guest'
})

usePrivatePageSeo('Recuperar contraseña')

const route = useRoute()

const initialEmail = typeof route.query.email === 'string' ? route.query.email : ''

const fields: AuthFormField[] = [{
  name: 'email',
  type: 'email',
  label: 'Correo electrónico',
  placeholder: 'Ingrese su correo electrónico',
  defaultValue: initialEmail,
  required: true
}]

const handleSubmit = (event: FormSubmitEvent<RequestPasswordResetInput>) => requestPasswordReset(event.data)
</script>

<template>
  <UContainer>
    <UPage>
      <UPageCard
        class="w-full max-w-md mx-auto mt-20"
        variant="subtle"
      >
        <UAuthForm
          :schema="RequestPasswordResetSchema"
          title="Recuperar contraseña"
          description="Ingresá tu correo y te enviamos un enlace para restablecer tu contraseña."
          icon="lucide:key-round"
          :fields="fields"
          :loading="loading"
          :submit="{ label: 'Enviar enlace', block: true, icon: 'lucide:send' }"
          @submit="handleSubmit"
        />

        <p class="mt-4 text-center text-sm text-toned">
          ¿Recordaste tu contraseña?
          <NuxtLink
            to="/auth/login"
            class="font-medium text-primary hover:underline"
          >
            Iniciar sesión
          </NuxtLink>
        </p>
      </UPageCard>
    </UPage>
  </UContainer>
</template>
