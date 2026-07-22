<script setup lang="ts">
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import { LoginSchema, type LoginInput } from '#shared/schemas/auth'

const { login, loading } = useAuth()

definePageMeta({
  layout: 'default',
  middleware: 'guest'
})

usePrivatePageSeo('Iniciar sesión')

const fields: AuthFormField[] = [{
  name: 'email',
  type: 'email',
  label: 'Correo electrónico',
  placeholder: 'Ingrese su correo electrónico',
  required: true
}, {
  name: 'password',
  label: 'Contraseña',
  type: 'password',
  placeholder: 'Ingrese su contraseña',
  required: true
}]

const handleLogin = (event: FormSubmitEvent<LoginInput>) => login(event.data)
</script>

<template>
  <UContainer>
    <UPage>
      <UPageCard
        class="w-full max-w-md mx-auto mt-20"
        variant="subtle"
      >
        <UAuthForm
          :schema="LoginSchema"
          title="Iniciar sesión"
          description="Ingrese sus credenciales para acceder a su cuenta."
          icon="lucide:user-circle"
          :fields="fields"
          :loading="loading"
          :submit="{ label: 'Iniciar sesión', block: true, icon: 'lucide:log-in' }"
          @submit="handleLogin"
        />

        <p class="mt-4 text-center text-sm text-toned">
          ¿No tenés cuenta?
          <NuxtLink
            to="/auth/signup"
            class="font-medium text-primary hover:underline"
          >
            Creá tu cuenta
          </NuxtLink>
        </p>

        <p class="mt-2 text-center text-sm text-toned">
          ¿Olvidaste tu contraseña?
          <NuxtLink
            to="/auth/recover-password"
            class="font-medium text-primary hover:underline"
          >
            Recuperala
          </NuxtLink>
        </p>

        <p class="mt-2 text-center text-sm text-toned">
          ¿No recibiste el correo de verificación?
          <NuxtLink
            to="/auth/resend-verification"
            class="font-medium text-primary hover:underline"
          >
            Reenviar
          </NuxtLink>
        </p>
      </UPageCard>
    </UPage>
  </UContainer>
</template>
