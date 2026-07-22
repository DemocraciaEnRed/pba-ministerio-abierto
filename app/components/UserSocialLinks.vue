<script setup lang="ts">
import type { SocialLinkDTO } from '~~/server/utils/serializers/user'

defineProps<{
  links: SocialLinkDTO[]
}>()
</script>

<template>
  <div
    v-if="links.length"
    class="flex flex-wrap gap-2"
  >
    <UButton
      v-for="link in links"
      :key="link.platform"
      :to="link.url"
      :icon="link.icon"
      :label="link.handle"
      :aria-label="`${link.label}: ${link.handle}`"
      target="_blank"
      rel="noopener noreferrer nofollow"
      color="neutral"
      variant="subtle"
      size="sm"
    />
  </div>
</template>
