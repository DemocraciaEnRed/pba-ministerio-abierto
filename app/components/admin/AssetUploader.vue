<script setup lang="ts">
type UploadMediaType = 'image' | 'document' | 'video' | 'audio' | 'other'

interface AssetResponse {
  id: number
  title: string | null
  description: string | null
  assetType: 'uploaded_file' | 'external_link'
  mediaType: UploadMediaType
  url: string | null
  originalFilename?: string | null
  mimeType?: string | null
  sizeBytes?: number | null
}

const props = withDefaults(defineProps<{
  modelValue: number | number[] | null
  multiple?: boolean
  mediaType?: UploadMediaType
  accept?: string
  label?: string
  description?: string
  maxItems?: number
}>(), {
  multiple: false,
  accept: '',
  label: 'Subir archivo',
  description: '',
  maxItems: 10
})

const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | null]
}>()

const toast = useToast()
const loading = ref(false)
const assetsById = ref<Record<number, AssetResponse>>({})

const selectedIds = computed<number[]>(() => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) ? props.modelValue : []
  }
  return typeof props.modelValue === 'number' ? [props.modelValue] : []
})

const selectedAssets = computed(() =>
  selectedIds.value
    .map(id => assetsById.value[id])
    .filter((asset): asset is AssetResponse => Boolean(asset))
)

const previewAsset = computed(() => selectedAssets.value[0] ?? null)

function formatBytes(value: number | null | undefined): string {
  if (!value || value <= 0) return '—'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function emitIds(ids: number[]) {
  if (props.multiple) {
    emit('update:modelValue', ids)
    return
  }
  emit('update:modelValue', ids[0] ?? null)
}

async function fetchAsset(id: number): Promise<void> {
  if (assetsById.value[id]) return

  try {
    const asset = await $fetch<AssetResponse>(`/api/assets/${id}`)
    assetsById.value = {
      ...assetsById.value,
      [id]: asset
    }
  } catch {
    toast.add({
      title: 'No se pudo cargar el archivo',
      description: `No encontramos el asset #${id}.`,
      color: 'error'
    })
  }
}

async function uploadSingleFile(file: File): Promise<AssetResponse> {
  const formData = new FormData()
  formData.append('file', file)
  if (props.mediaType) {
    formData.append('mediaType', props.mediaType)
  }
  return await $fetch<AssetResponse>('/api/assets', {
    method: 'POST',
    body: formData
  })
}

async function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files ? Array.from(target.files) : []
  if (files.length === 0) return

  loading.value = true
  try {
    const uploadedAssets: AssetResponse[] = []
    for (const file of files) {
      const uploaded = await uploadSingleFile(file)
      uploadedAssets.push(uploaded)
    }

    assetsById.value = {
      ...assetsById.value,
      ...Object.fromEntries(uploadedAssets.map(asset => [asset.id, asset]))
    }

    const nextIds = props.multiple
      ? Array.from(new Set([...selectedIds.value, ...uploadedAssets.map(asset => asset.id)])).slice(0, props.maxItems)
      : [uploadedAssets[0]!.id]

    emitIds(nextIds)

    toast.add({
      title: 'Archivo subido',
      description: props.multiple
        ? `Se subieron ${uploadedAssets.length} archivo(s).`
        : 'El archivo se subió correctamente.',
      color: 'success'
    })
  } catch (error) {
    const e = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'No se pudo subir el archivo',
      description: e.data?.message || e.message || 'Ocurrió un error inesperado.',
      color: 'error'
    })
  } finally {
    loading.value = false
    target.value = ''
  }
}

function removeAsset(id: number) {
  const nextIds = selectedIds.value.filter(currentId => currentId !== id)
  emitIds(nextIds)
}

watch(
  selectedIds,
  (ids) => {
    for (const id of ids) {
      void fetchAsset(id)
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="space-y-3">
    <div class="space-y-2">
      <div>
        <p class="text-sm font-medium">
          {{ label }}
        </p>
        <p
          v-if="description"
          class="text-xs text-muted"
        >
          {{ description }}
        </p>
      </div>

      <UInput
        type="file"
        :accept="accept || undefined"
        :multiple="multiple"
        :disabled="loading"
        icon="i-lucide-upload"
        @change="onFileChange"
      />
    </div>

    <div
      v-if="!multiple && previewAsset"
      class="rounded-md border border-default p-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="space-y-1">
          <p class="text-sm font-medium">
            {{ previewAsset.originalFilename || `Asset #${previewAsset.id}` }}
          </p>
          <p class="text-xs text-muted">
            {{ previewAsset.mimeType || 'Sin MIME' }} · {{ formatBytes(previewAsset.sizeBytes) }}
          </p>
        </div>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-trash-2"
          aria-label="Quitar archivo"
          @click="removeAsset(previewAsset.id)"
        />
      </div>

      <img
        v-if="previewAsset.mediaType === 'image' && previewAsset.url"
        :src="previewAsset.url"
        :alt="previewAsset.originalFilename || `Asset ${previewAsset.id}`"
        class="mt-3 max-h-40 rounded-md border border-default object-contain"
      >
    </div>

    <div
      v-if="multiple && selectedAssets.length > 0"
      class="space-y-2"
    >
      <div
        v-for="asset in selectedAssets"
        :key="asset.id"
        class="flex items-center justify-between gap-3 rounded-md border border-default px-3 py-2"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-medium">
            {{ asset.originalFilename || `Asset #${asset.id}` }}
          </p>
          <p class="text-xs text-muted">
            {{ asset.mimeType || 'Sin MIME' }} · {{ formatBytes(asset.sizeBytes) }}
          </p>
        </div>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-trash-2"
          aria-label="Quitar archivo"
          @click="removeAsset(asset.id)"
        />
      </div>
    </div>
  </div>
</template>
