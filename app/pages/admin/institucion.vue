<script setup lang="ts">
definePageMeta({
  layout: 'admin-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Institución')

interface InstitutionResponse {
  id?: number
  name: string
  platformName?: string | null
  logoLightAssetId?: number | null
  logoDarkAssetId?: number | null
  symbolLightAssetId?: number | null
  symbolDarkAssetId?: number | null
  contactEmail?: string | null
}

const toast = useToast()

const form = reactive({
  name: '',
  platformName: '',
  logoLightAssetId: null as number | null,
  logoDarkAssetId: null as number | null,
  symbolLightAssetId: null as number | null,
  symbolDarkAssetId: null as number | null,
  contactEmail: ''
})

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()
const { data, status, refresh } = await useAsyncData('admin-institution', () =>
  requestFetch<InstitutionResponse>('/api/platform-settings')
)

watchEffect(() => {
  if (!data.value) return

  form.name = data.value.name
  form.platformName = data.value.platformName ?? ''
  form.logoLightAssetId = data.value.logoLightAssetId ?? null
  form.logoDarkAssetId = data.value.logoDarkAssetId ?? null
  form.symbolLightAssetId = data.value.symbolLightAssetId ?? null
  form.symbolDarkAssetId = data.value.symbolDarkAssetId ?? null
  form.contactEmail = data.value.contactEmail ?? ''
})

const saving = ref(false)

async function saveInstitution() {
  saving.value = true

  try {
    await $fetch('/api/platform-settings', {
      method: 'PUT',
      body: {
        name: form.name,
        platformName: form.platformName || null,
        logoLightAssetId: form.logoLightAssetId,
        logoDarkAssetId: form.logoDarkAssetId,
        symbolLightAssetId: form.symbolLightAssetId,
        symbolDarkAssetId: form.symbolDarkAssetId,
        contactEmail: form.contactEmail || null
      }
    })

    toast.add({
      title: 'Institución actualizada',
      description: 'Los datos de la institución se guardaron correctamente.',
      color: 'success'
    })

    await refresh()
  } catch (error) {
    const e = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'No se pudo guardar',
      description: e.data?.message || e.message || 'Ocurrió un error inesperado.',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UPage>
    <UPageHeader
      title="Institución"
      description="Configurá branding, contacto y datos generales."
    />

    <UPageBody>
      <!-- Anunciar que esto no esta implementado aun -->
      <UAlert
        type="info"
        icon="lucide:info"
        variant="subtle"
        title="Esta sección aún no está implementada"
        description="Pronto podrás configurar la información de tu institución."
      />
      <UPageCard v-if="status === 'pending'">
        Cargando institución...
      </UPageCard>

      <UPageCard
        v-else
        class="space-y-4"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <UFormField
            label="Nombre de la institución"
            required
          >
            <UInput
              v-model="form.name"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Nombre de la plataforma">
            <UInput
              v-model="form.platformName"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Correo de contacto"
            class="md:col-span-2"
          >
            <UInput
              v-model="form.contactEmail"
              type="email"
              class="w-full"
            />
          </UFormField>

          <div class="space-y-2">
            <AdminAssetUploader
              v-model="form.logoLightAssetId"
              media-type="image"
              accept="image/*"
              label="Logo (fondo claro)"
              description="Logo para usar sobre fondos claros."
            />
          </div>

          <div class="space-y-2">
            <AdminAssetUploader
              v-model="form.logoDarkAssetId"
              media-type="image"
              accept="image/*"
              label="Logo (fondo oscuro)"
              description="Logo para usar sobre fondos oscuros."
            />
          </div>

          <div class="space-y-2">
            <AdminAssetUploader
              v-model="form.symbolLightAssetId"
              media-type="image"
              accept="image/*"
              label="Símbolo (fondo claro)"
              description="Isotipo para usar sobre fondos claros."
            />
          </div>

          <div class="space-y-2">
            <AdminAssetUploader
              v-model="form.symbolDarkAssetId"
              media-type="image"
              accept="image/*"
              label="Símbolo (fondo oscuro)"
              description="Isotipo para usar sobre fondos oscuros."
            />
          </div>
        </div>

        <div class="flex justify-end">
          <UButton
            label="Guardar cambios"
            icon="i-lucide-save"
            :loading="saving"
            @click="saveInstitution"
          />
        </div>
      </UPageCard>
    </UPageBody>
  </UPage>
</template>
