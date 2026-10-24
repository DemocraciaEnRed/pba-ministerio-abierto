<script setup lang="ts">
import type { RegistrationConfirmation } from '#shared/data/consultation-registrations'

definePageMeta({
  validate: route => isValidPublicConsultationRoute(route.params)
})

const route = useRoute()
const storedConfirmation = useState<RegistrationConfirmation | null>('registration-confirmation', () => null)
const confirmation = computed(() => storedConfirmation.value?.consultationId === String(route.params.idConsulta) ? storedConfirmation.value : null)
onBeforeRouteLeave(() => {
  storedConfirmation.value = null
})
// La página de éxito solo vuelve a la consulta: la propia página corrige la dirección si hiciera falta.
const consultationPath = computed(() => `/${route.params.seccion}/${route.params.idConsulta}/${route.params.nombre}`)

usePageSeo({
  title: 'Inscripción enviada',
  description: 'Recibimos tu inscripción.',
  noindex: true
})
</script>

<template>
  <UContainer>
    <UPage>
      <UPageCard
        class="w-full max-w-xl mx-auto mt-20 text-center"
        variant="subtle"
      >
        <div class="flex flex-col items-center gap-4 py-6">
          <UIcon
            name="lucide:circle-check"
            class="size-12 text-success"
          />
          <h1 class="text-2xl font-semibold text-highlighted">
            ¡Recibimos tu inscripción!
          </h1>
          <p
            v-if="confirmation?.emailSent === false"
            class="text-toned max-w-md"
          >
            Tu inscripción quedó registrada, pero no pudimos enviar el correo de confirmación.
            No necesitás inscribirte otra vez. Si necesitás ayuda, contactá a la organización.
          </p>
          <p
            v-else-if="confirmation?.emailSent || route.params.seccion !== 'observatorio-obras-servicios'"
            class="text-toned max-w-md"
          >
            Te enviamos un correo con el detalle de tu inscripción, la fecha y el lugar del encuentro.
            Revisá tu casilla —incluido el correo no deseado— para confirmar que llegó.
          </p>
          <p
            v-else
            class="text-toned max-w-md"
          >
            Los datos de conexión solo se muestran al terminar una inscripción virtual.
            Consultá el correo de confirmación o contactá a la organización.
          </p>
          <template v-if="confirmation?.attendanceMode === 'virtual'">
            <UButton
              v-if="confirmation.meetingUrl"
              :to="confirmation.meetingUrl"
              target="_blank"
              rel="noopener noreferrer"
              label="Ingresá a la reunión virtual"
              icon="lucide:video"
            />
            <p
              v-else
              class="text-toned max-w-md"
            >
              La organización te comunicará los datos de conexión.
            </p>
          </template>

          <div class="pt-2 w-full sm:w-auto">
            <UButton
              :to="consultationPath"
              label="Volver a la consulta"
              icon="lucide:arrow-left"
              block
            />
          </div>
        </div>
      </UPageCard>
    </UPage>
  </UContainer>
</template>
