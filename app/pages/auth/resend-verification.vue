<script setup lang="ts">
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import { ResendVerificationSchema, type ResendVerificationInput } from '#shared/schemas/auth'

const { resendVerification, loading } = useAuth()

definePageMeta({
  layout: 'default',
  middleware: 'guest'
})

usePrivatePageSeo('Reenviar verificación')

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

const handleSubmit = (event: FormSubmitEvent<ResendVerificationInput>) => resendVerification(event.data)
</script>

<template>
  <UContainer>
    <UPage>
      <UPageCard
        class="w-full max-w-md mx-auto mt-20"
        variant="subtle"
      >
        <UAuthForm
          :schema="ResendVerificationSchema"
          title="Reenviar verificación"
          description="Ingresá tu correo y te enviamos un nuevo enlace para verificar tu cuenta."
          icon="lucide:mail-check"
          :fields="fields"
          :loading="loading"
          :submit="{ label: 'Reenviar email', block: true, icon: 'lucide:send' }"
          @submit="handleSubmit"
        />

        <p class="mt-4 text-center text-sm text-toned">
          ¿Ya verificaste tu cuenta?
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
