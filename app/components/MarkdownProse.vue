<script setup lang="ts">
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

const props = defineProps<{
  content: string | null | undefined
}>()

const html = computed(() => {
  if (!props.content) return ''
  const rendered = marked.parse(props.content, { async: false }) as string
  return DOMPurify.sanitize(rendered)
})
</script>

<template>
  <!-- Contenido Markdown provisto por administradores y sanitizado con DOMPurify. -->
  <!-- eslint-disable vue/no-v-html -->
  <div
    v-if="html"
    class="prose prose-sm dark:prose-invert max-w-none"
    v-html="html"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>
