<script setup lang="ts">
import type { ParsedMarkdown } from '~/utils/markdown'

const props = defineProps<{
  content: string | null | undefined
  parsed?: ParsedMarkdown
}>()

const html = computed(() => props.parsed?.html ?? parseMarkdown(props.content).html)
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
