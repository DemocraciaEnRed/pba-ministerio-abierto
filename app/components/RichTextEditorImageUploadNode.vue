<script setup lang="ts">
import type { NodeViewProps } from '@tiptap/vue-3'
import { NodeViewWrapper } from '@tiptap/vue-3'

interface InlineAssetResponse {
  id: number
  url: string | null
}

const props = defineProps<NodeViewProps>()

const toast = useToast()
const file = ref<File | null>(null)
const loading = ref(false)

async function uploadImage(image: File): Promise<InlineAssetResponse> {
  const formData = new FormData()
  formData.append('file', image)
  return await $fetch<InlineAssetResponse>('/api/assets/inline', {
    method: 'POST',
    body: formData
  })
}

watch(file, async (newFile) => {
  if (!newFile) return

  loading.value = true
  try {
    const asset = await uploadImage(newFile)
    if (!asset.url) {
      throw new Error('El servidor no devolvió la URL de la imagen.')
    }

    const pos = props.getPos()
    if (typeof pos !== 'number') return

    props.editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + 1 })
      .setImage({ src: asset.url })
      .run()
  } catch (error) {
    const e = error as { data?: { message?: string }, message?: string }
    file.value = null
    toast.add({
      title: 'No se pudo subir la imagen',
      description: e.data?.message || e.message || 'Ocurrió un error inesperado.',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <NodeViewWrapper>
    <UFileUpload
      v-model="file"
      accept="image/*"
      label="Subí una imagen"
      description="JPG, PNG, WebP o GIF (máx. 15 MB)"
      :preview="false"
      :disabled="loading"
      class="min-h-48"
    >
      <template #leading>
        <UAvatar
          :icon="loading ? 'i-lucide-loader-circle' : 'i-lucide-image'"
          size="xl"
          :ui="{ icon: [loading && 'animate-spin'] }"
        />
      </template>
    </UFileUpload>
  </NodeViewWrapper>
</template>
