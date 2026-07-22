<script setup lang="ts">
interface PublicAttachment {
  id: number
  displayOrder: number
  title: string | null
  filename: string | null
  mediaType: 'image' | 'document' | 'video' | 'audio' | 'other'
  mimeType: string | null
  sizeBytes: number | null
  url: string | null
}

const props = withDefaults(defineProps<{
  attachments: PublicAttachment[]
  title?: string
}>(), {
  title: 'Archivos para descargar'
})

const items = computed(() =>
  [...props.attachments]
    .filter(attachment => attachment.url)
    .sort((a, b) => a.displayOrder - b.displayOrder)
)

const mediaIcons: Record<PublicAttachment['mediaType'], string> = {
  image: 'i-lucide-image',
  document: 'i-lucide-file-text',
  video: 'i-lucide-file-video',
  audio: 'i-lucide-file-audio',
  other: 'i-lucide-file'
}

function formatBytes(value: number | null): string {
  if (!value || value <= 0) return ''
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <UCard
    v-if="items.length"
    variant="subtle"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-paperclip"
          class="size-5 text-muted"
        />
        <h3 class="font-semibold">
          {{ title }}
        </h3>
      </div>
    </template>

    <ul class="divide-y divide-default">
      <li
        v-for="attachment in items"
        :key="attachment.id"
      >
        <ULink
          :to="attachment.url!"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 py-3 text-sm hover:text-primary"
        >
          <UIcon
            :name="mediaIcons[attachment.mediaType]"
            class="size-5 shrink-0 text-muted"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium">
              {{ attachment.title || attachment.filename || `Archivo #${attachment.id}` }}
            </p>
            <p
              v-if="attachment.filename && (attachment.title || attachment.sizeBytes)"
              class="truncate text-xs text-muted"
            >
              <span v-if="attachment.title">{{ attachment.filename }}</span>
              <span v-if="attachment.title && formatBytes(attachment.sizeBytes)"> · </span>
              <span v-if="formatBytes(attachment.sizeBytes)">{{ formatBytes(attachment.sizeBytes) }}</span>
            </p>
          </div>
          <UIcon
            name="i-lucide-download"
            class="size-4 shrink-0 text-muted"
          />
        </ULink>
      </li>
    </ul>
  </UCard>
</template>
