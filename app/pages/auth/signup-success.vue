<script setup lang="ts">
const route = useRoute()

definePageMeta({
  layout: 'default',
  middleware: 'guest'
})

usePrivatePageSeo('Cuenta creada')

const email = typeof route.query.email === 'string' ? route.query.email : ''
const resendLink = email
  ? `/auth/resend-verification?email=${encodeURIComponent(email)}`
  : '/auth/resend-verification'
</script>

<template>
  <UContainer>
    <UPage>
      <UPageCard
        class="w-full max-w-md mx-auto mt-20 text-center"
        variant="subtle"
      >
        <div class="flex flex-col items-center gap-4 py-6">
          <UIcon
            name="lucide:mail-check"
            class="size-10 text-success"
          />
          <h1 class="text-xl font-semibold">
            ¡Cuenta creada!
          </h1>
          <p class="text-toned">
            Te enviamos un correo de verificación<span v-if="email"> a <strong>{{ email }}</strong></span>.
            Abrí el enlace para activar tu cuenta.
          </p>

          <UAlert
            color="warning"
            variant="subtle"
            icon="lucide:clock"
            title="El enlace vence en 24 horas"
            description="Si no lo confirmás dentro de ese plazo, podés pedir uno nuevo desde el reenvío de verificación."
          />

          <div class="flex flex-col items-center gap-2 w-full">
            <UButton
              :to="resendLink"
              label="Reenviar verificación"
              icon="lucide:send"
              block
            />
            <UButton
              to="/auth/login"
              label="Ir a iniciar sesión"
              color="neutral"
              variant="subtle"
              block
            />
          </div>
        </div>
      </UPageCard>
    </UPage>
  </UContainer>
</template>
