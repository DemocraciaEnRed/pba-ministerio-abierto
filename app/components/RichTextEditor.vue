<script setup lang="ts">
import type { EditorCustomHandlers, EditorToolbarItem, FormSubmitEvent } from '#ui/types'
import type { Editor } from '@tiptap/vue-3'
import { Youtube } from '@tiptap/extension-youtube'
import { YoutubeEmbedSchema, type YoutubeEmbedInput } from '#shared/schemas/youtube'
import { ImageUpload } from './RichTextEditorImageUpload'

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

const YoutubeEmbed = Youtube.configure({
  nocookie: true,
  modestBranding: true,
  rel: 0,
  width: 640,
  height: 360
})

const youtubeModalOpen = ref(false)
const youtubeState = reactive({ url: '' })
const youtubeEditor = shallowRef<Editor>()

function openYoutubeModal(editor: Editor): void {
  youtubeEditor.value = editor
  youtubeState.url = ''
  youtubeModalOpen.value = true
}

function insertYoutubeVideo(event: FormSubmitEvent<YoutubeEmbedInput>): void {
  youtubeEditor.value?.chain().focus().setYoutubeVideo({ src: event.data.url }).run()
  youtubeModalOpen.value = false
}

const customHandlers = {
  imageUpload: {
    canExecute: (editor: Editor) => editor.can().insertContent({ type: 'imageUpload' }),
    execute: (editor: Editor) => editor.chain().focus().insertContent({ type: 'imageUpload' }),
    isActive: (editor: Editor) => editor.isActive('imageUpload'),
    isDisabled: undefined
  },
  youtube: {
    canExecute: (editor: Editor) => editor.can().insertContent({ type: 'youtube' }),
    // La inserción ocurre al confirmar el modal; devolvemos una chain vacía
    // porque UEditorToolbar siempre ejecuta `.run()` sobre el retorno.
    execute: (editor: Editor) => {
      openYoutubeModal(editor)
      return editor.chain()
    },
    isActive: (editor: Editor) => editor.isActive('youtube'),
    isDisabled: undefined
  }
} satisfies EditorCustomHandlers

const toolbarItems: EditorToolbarItem<typeof customHandlers>[][] = [
  [
    {
      icon: 'i-lucide-heading',
      tooltip: { text: 'Títulos' },
      content: { align: 'start' },
      items: [
        { kind: 'paragraph', icon: 'i-lucide-type', label: 'Párrafo' },
        // { kind: 'heading', level: 1, icon: 'i-lucide-heading-1', label: 'Título 1' },
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
    { kind: 'link', icon: 'i-lucide-link', tooltip: { text: 'Enlace' } },
    { kind: 'imageUpload', icon: 'i-lucide-image', tooltip: { text: 'Imagen' } },
    { kind: 'youtube', icon: 'i-simple-icons-youtube', tooltip: { text: 'Video de YouTube' } }
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
    :mention="false"
    :extensions="[ImageUpload, YoutubeEmbed]"
    :handlers="customHandlers"
    :placeholder="props.placeholder"
    class="w-full rounded-md ring ring-default divide-y divide-default"
    :ui="{ base: 'p-3 min-h-40 prose dark:prose-invert max-w-none focus:outline-none' }"
  >
    <UEditorToolbar
      :editor="editor"
      :items="toolbarItems"
      class="p-2 flex flex-wrap gap-1 bg-accented/15"
    />

    <UEditorDragHandle :editor="editor" />

    <UModal
      v-model:open="youtubeModalOpen"
      title="Insertar video de YouTube"
      description="Pegá el enlace del video que querés embeber."
    >
      <template #body>
        <UForm
          :schema="YoutubeEmbedSchema"
          :state="youtubeState"
          class="space-y-4"
          @submit="insertYoutubeVideo"
        >
          <UFormField
            label="URL del video"
            name="url"
            description="Admite enlaces de youtube.com, youtu.be y Shorts."
          >
            <UInput
              v-model="youtubeState.url"
              placeholder="https://www.youtube.com/watch?v=..."
              autofocus
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              @click="youtubeModalOpen = false"
            >
              Cancelar
            </UButton>
            <UButton type="submit">
              Insertar
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </UEditor>
</template>
