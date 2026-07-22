<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui'

const props = defineProps<{
  placeholder?: string
}>()

const model = defineModel<string | null>()

// UEditor con content-type markdown trabaja con string; normalizamos null → ''.
const value = computed({
  get: () => model.value ?? '',
  set: (next: string) => {
    model.value = next
  }
})

const toolbarItems: EditorToolbarItem[][] = [
  [
    {
      icon: 'i-lucide-heading',
      tooltip: { text: 'Títulos' },
      content: { align: 'start' },
      items: [
        { kind: 'paragraph', icon: 'i-lucide-type', label: 'Párrafo' },
        { kind: 'heading', level: 2, icon: 'i-lucide-heading-2', label: 'Título 2' },
        { kind: 'heading', level: 3, icon: 'i-lucide-heading-3', label: 'Título 3' },
        { kind: 'heading', level: 4, icon: 'i-lucide-heading-4', label: 'Título 4' }
      ]
    }
  ],
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: 'Negrita' } },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: 'Cursiva' } },
    { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: 'Tachado' } },
    { kind: 'mark', mark: 'code', icon: 'i-lucide-code', tooltip: { text: 'Código' } }
  ],
  [
    { kind: 'bulletList', icon: 'i-lucide-list', tooltip: { text: 'Lista' } },
    { kind: 'orderedList', icon: 'i-lucide-list-ordered', tooltip: { text: 'Lista numerada' } },
    { kind: 'blockquote', icon: 'i-lucide-text-quote', tooltip: { text: 'Cita' } }
  ],
  [
    { kind: 'link', icon: 'i-lucide-link', tooltip: { text: 'Enlace' } }
  ],
  [
    { kind: 'undo', icon: 'i-lucide-undo', tooltip: { text: 'Deshacer' } },
    { kind: 'redo', icon: 'i-lucide-redo', tooltip: { text: 'Rehacer' } }
  ]
]
</script>

<template>
  <UEditor
    v-slot="{ editor }"
    v-model="value"
    content-type="markdown"
    :image="false"
    :mention="false"
    :placeholder="props.placeholder"
    class="w-full rounded-md ring ring-default divide-y divide-default"
    :ui="{ base: 'p-3 min-h-40 prose prose-sm dark:prose-invert max-w-none focus:outline-none' }"
  >
    <UEditorToolbar
      :editor="editor"
      :items="toolbarItems"
      class="p-1 flex flex-wrap gap-1"
    />
  </UEditor>
</template>
