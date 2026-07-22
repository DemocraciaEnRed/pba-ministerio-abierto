<script setup lang="ts">
import type { SelfUserDTO } from '~~/server/utils/serializers/user'

definePageMeta({
  layout: 'mi-cuenta-control-panel',
  middleware: 'auth'
})

usePrivatePageSeo('Cambiar avatar')

const { updateAvatar, removeAvatar, loading } = useAccount()
const toast = useToast()

const { data: profile, refresh } = await useFetch<SelfUserDTO>('/api/me')

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SOURCE_SIZE = 10 * 1024 * 1024 // 10MB para la imagen original a recortar

const fileInput = ref<HTMLInputElement | null>(null)
const cropperOpen = ref(false)
const cropSrc = ref<string | null>(null)
const pendingFile = ref<File | null>(null)
const pendingPreviewUrl = ref<string | null>(null)

const currentAvatarUrl = computed(() => profile.value?.avatarUrl ?? null)
const displayedAvatar = computed(() => pendingPreviewUrl.value || currentAvatarUrl.value || undefined)
const hasSource = computed(() => cropSrc.value !== null)

const initials = computed(() => {
  const name = profile.value?.displayName?.trim()
    || `${profile.value?.firstName ?? ''} ${profile.value?.lastName ?? ''}`.trim()
  if (!name) return undefined
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('')
})

function revokeCropSrc() {
  if (cropSrc.value) {
    URL.revokeObjectURL(cropSrc.value)
    cropSrc.value = null
  }
}

function revokePendingPreview() {
  if (pendingPreviewUrl.value) {
    URL.revokeObjectURL(pendingPreviewUrl.value)
    pendingPreviewUrl.value = null
  }
}

onBeforeUnmount(() => {
  revokeCropSrc()
  revokePendingPreview()
})

function openFilePicker() {
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // Permite volver a elegir el mismo archivo más tarde.
  input.value = ''
  if (!file) return

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    toast.add({
      title: 'Formato no permitido',
      description: 'Subí una imagen JPG, PNG o WebP.',
      icon: 'lucide:alert-circle',
      color: 'error'
    })
    return
  }

  if (file.size > MAX_SOURCE_SIZE) {
    toast.add({
      title: 'Imagen muy grande',
      description: 'Elegí una imagen menor a 10 MB.',
      icon: 'lucide:alert-circle',
      color: 'error'
    })
    return
  }

  revokeCropSrc()
  cropSrc.value = URL.createObjectURL(file)
  cropperOpen.value = true
}

function onCropped(file: File) {
  revokePendingPreview()
  pendingFile.value = file
  pendingPreviewUrl.value = URL.createObjectURL(file)
}

function reopenCropper() {
  if (cropSrc.value) {
    cropperOpen.value = true
  }
}

function discardPending() {
  revokePendingPreview()
  pendingFile.value = null
  revokeCropSrc()
}

async function onSave() {
  if (!pendingFile.value) return
  const updated = await updateAvatar(pendingFile.value)
  if (updated) {
    discardPending()
    await refresh()
  }
}

async function onRemove() {
  const ok = await removeAvatar()
  if (ok) {
    discardPending()
    await refresh()
  }
}
</script>

<template>
  <UPageBody>
    <UPageHeader
      title="Foto de perfil"
      description="Subí una imagen, recortala y guardala como tu avatar."
    />

    <div class="mt-6 space-y-6">
      <div class="flex flex-wrap items-center gap-4">
        <UAvatar
          :src="displayedAvatar"
          :text="initials"
          icon="i-lucide-user"
          size="3xl"
        />

        <div class="space-y-2">
          <div class="flex flex-wrap gap-2">
            <UButton
              :label="currentAvatarUrl || pendingFile ? 'Cambiar imagen' : 'Elegir imagen'"
              color="neutral"
              variant="outline"
              icon="i-lucide-upload"
              @click="openFilePicker"
            />

            <UButton
              v-if="hasSource"
              label="Reencuadrar"
              color="neutral"
              variant="ghost"
              icon="i-lucide-crop"
              @click="reopenCropper"
            />
          </div>

          <p class="text-xs text-muted">
            JPG, PNG o WebP. Máximo 10 MB. La imagen se recorta en un círculo.
          </p>
        </div>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="hidden"
        @change="onFileChange"
      >

      <div class="flex flex-wrap gap-2">
        <UButton
          label="Guardar foto"
          icon="i-lucide-save"
          :loading="loading"
          :disabled="!pendingFile"
          @click="onSave"
        />

        <UButton
          v-if="pendingFile"
          label="Descartar"
          color="neutral"
          variant="subtle"
          icon="i-lucide-x"
          :disabled="loading"
          @click="discardPending"
        />

        <UButton
          v-if="currentAvatarUrl"
          label="Quitar foto"
          color="error"
          variant="subtle"
          icon="i-lucide-trash-2"
          :loading="loading"
          @click="onRemove"
        />
      </div>
    </div>

    <AvatarCropperModal
      v-model:open="cropperOpen"
      :src="cropSrc"
      @cropped="onCropped"
    />
  </UPageBody>
</template>
