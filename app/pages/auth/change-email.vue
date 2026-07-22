<script setup lang="ts">
const route = useRoute()

definePageMeta({
  layout: 'default'
})

usePrivatePageSeo('Cambiar correo')

type Status = 'verifying' | 'success' | 'error'

const status = ref<Status>('verifying')
const message = ref('')

onMounted(async () => {
  const token = typeof route.query.token === 'string' ? route.query.token : ''

  if (!token) {
    status.value = 'error'
    message.value = 'El enlace de confirmación no es válido.'
    return
  }

  try {
    const res = await $fetch<{ ok: boolean, message: string }>('/api/auth/change-email', {
      method: 'POST',
      body: { token }
    })
    status.value = 'success'
    message.value = res.message
  } catch (error) {
    const e = error as { data?: { message?: string }, message?: string }
    status.value = 'error'
    message.value = e?.data?.message || 'No pudimos confirmar el cambio de correo. El enlace puede haber expirado.'
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
            Confirmando tu nuevo correo...
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
            to="/mi-cuenta/email"
            label="Ir a mi cuenta"
            icon="lucide:user"
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
          <UButton
            to="/mi-cuenta/email"
            label="Volver a cambiar el correo"
            color="neutral"
            variant="subtle"
          />
        </div>
      </UPageCard>
    </UPage>
  </UContainer>
</template>
