<script setup lang="ts">
import type { AdminConsultationRegistrationFormDTO } from '~~/server/utils/serializers/consultationRegistrationForm'

definePageMeta({
  layout: 'clean',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('QR de acreditación')

const route = useRoute()
const slug = computed(() => String(route.params.slugConsulta))
const requestFetch = useRequestFetch()
const requestURL = useRequestURL()

const { data: form } = await useAsyncData(
  () => `admin-accreditation-qr-${slug.value}`,
  async () => {
    try {
      return await requestFetch<AdminConsultationRegistrationFormDTO>(
        `/api/consultations/${slug.value}/registration-form`
      )
    } catch {
      return null
    }
  },
  { watch: [slug] }
)

const accreditation = computed(() => form.value?.accreditation ?? null)
const publicId = computed(() => accreditation.value?.publicId ?? '')
const qrUrl = computed(() => `${requestURL.origin}/acreditaciones/${publicId.value}`)

const backLink = computed(() => `/consultas/${slug.value}/panel/inscripciones/acreditaciones`)
const qrContainer = ref<HTMLElement | null>(null)

// Rasteriza el SVG del QR a PNG de alta resolución (SVG → canvas), sin capturar
// el DOM: el resultado es determinista y de alto contraste.
function downloadPng() {
  const svg = qrContainer.value?.querySelector('svg')
  if (!svg) return

  const size = 1024
  let source = new XMLSerializer().serializeToString(svg)
  if (!/^<svg[^>]+xmlns=/.test(source)) {
    source = source.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  }

  const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }))
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      const link = document.createElement('a')
      link.download = `acreditacion-${publicId.value}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    URL.revokeObjectURL(url)
  }
  img.src = url
}
</script>

<template>
  <UContainer>
    <div class="min-h-screen flex flex-col items-center justify-center gap-8 py-12">
      <div
        v-if="!accreditation"
        class="text-center space-y-4"
      >
        <UIcon
          name="lucide:qr-code"
          class="size-12 text-muted"
        />
        <h1 class="text-2xl font-semibold text-highlighted">
          No hay acreditación habilitada
        </h1>
        <UButton
          label="Volver"
          icon="lucide:arrow-left"
          color="neutral"
          variant="subtle"
          :to="backLink"
        />
      </div>

      <template v-else>
        <div class="text-center space-y-2">
          <h1 class="text-3xl font-bold text-highlighted">
            {{ form?.title }}
          </h1>
          <p class="text-toned text-lg">
            Escaneá el código para registrar tu asistencia
          </p>
        </div>

        <div
          ref="qrContainer"
          class="group relative bg-white rounded-2xl p-6 shadow-lg"
        >
          <Qrcode
            :value="qrUrl"
            :width="360"
            :height="360"
            black-color="#000000"
            white-color="#ffffff"
          />

          <div class="absolute inset-x-0 bottom-3 flex justify-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <UButton
              label="Descargar PNG"
              icon="lucide:download"
              size="sm"
              color="neutral"
              variant="solid"
              @click="downloadPng"
            />
          </div>
        </div>
      </template>
    </div>
  </UContainer>
</template>
