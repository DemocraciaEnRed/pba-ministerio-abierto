import type { CommandProps, NodeViewRenderer } from '@tiptap/core'
import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ImageUploadNodeComponent from './RichTextEditorImageUploadNode.vue'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageUpload: {
      /** Inserta un bloque de subida de imagen (placeholder con FileUpload). */
      insertImageUpload: () => ReturnType
    }
  }
}

/**
 * Nodo temporal que muestra una interfaz de subida (FileUpload). Al elegir un
 * archivo, el node view lo sube al servidor y se reemplaza a sí mismo por un
 * nodo `image` con la URL pública devuelta. Es atómico y arrastrable para que
 * el drag handle pueda reordenarlo mientras se sube.
 */
export const ImageUpload = Node.create({
  name: 'imageUpload',
  group: 'block',
  atom: true,
  draggable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="image-upload"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'image-upload' })]
  },

  addNodeView(): NodeViewRenderer {
    return VueNodeViewRenderer(ImageUploadNodeComponent)
  },

  addCommands() {
    return {
      insertImageUpload: () => ({ commands }: CommandProps) => {
        return commands.insertContent({ type: this.name })
      }
    }
  }
})

export default ImageUpload
