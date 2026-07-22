<script setup lang="ts">
const route = useRoute()

definePageMeta({
  layout: 'default'
})

usePrivatePageSeo('Verificar correo')

type Status = 'verifying' | 'success' | 'error'

const status = ref<Status>('verifying')
const message = ref('')

onMounted(async () => {
  const token = typeof route.query.token === 'string' ? route.query.token : ''

  if (!token) {
    status.value = 'error'
    message.value = 'El enlace de verificación no es válido.'
    return
  }

  try {
    const res = await $fetch<{ ok: boolean, message: string }>('/api/auth/verify-email', {
      method: 'POST',
      body: { token }
    })
    status.value = 'success'
    message.value = res.message
  } catch (error) {
    const e = error as { data?: { message?: string }, message?: string }
    status.value = 'error'
    message.value = e?.data?.message || 'No pudimos verificar tu correo. El enlace puede haber expirado.'
  }
})
</script>

<template>
  <UContainer>
    <UPage>
      <UPageCard
        class="w-full max-w-md mx-auto mt-20 text-center"
        variant="subtle"
      >
        <div
          v-if="status === 'verifying'"
          class="flex flex-col items-center gap-3 py-6"
        >
          <UIcon
            name="lucide:loader-circle"
            class="size-8 animate-spin text-primary"
          />
          <p class="text-toned">
            Verificando tu correo...
          </p>
        </div>

        <div
          v-else-if="status === 'success'"
          class="flex flex-col items-center gap-4 py-6"
        >
          <UIcon
            name="lucide:circle-check"
            class="size-10 text-success"
          />
          <p class="text-toned">
            {{ message }}
          </p>
          <UButton
            to="/auth/login"
            label="Iniciar sesión"
            icon="lucide:log-in"
          />
        </div>

        <div
          v-else
          class="flex flex-col items-center gap-4 py-6"
        >
          <UIcon
            name="lucide:circle-alert"
            class="size-10 text-error"
          />
          <p class="text-toned">
            {{ message }}
          </p>
          <div class="flex flex-col items-center gap-2">
            <UButton
              to="/auth/resend-verification"
              label="Reenviar verificación"
              icon="lucide:mail-check"
            />
            <UButton
              to="/auth/login"
              label="Volver al inicio de sesión"
              color="neutral"
              variant="subtle"
            />
          </div>
        </div>
      </UPageCard>
    </UPage>
  </UContainer>
</template>
