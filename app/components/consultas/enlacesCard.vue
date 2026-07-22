<script setup lang="ts">
interface PublicLink {
  id: number
  label: string
  url: string
  displayOrder: number
}

const props = withDefaults(defineProps<{
  links: PublicLink[]
  title?: string
}>(), {
  title: 'Enlaces relevantes'
})

const items = computed(() =>
  [...props.links].sort((a, b) => a.displayOrder - b.displayOrder)
)
</script>

<template>
  <UCard
    v-if="items.length"
    variant="subtle"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-link"
          class="size-5 text-muted"
        />
        <h3 class="font-semibold">
          {{ title }}
        </h3>
      </div>
    </template>

    <ul class="divide-y divide-default">
      <li
        v-for="link in items"
        :key="link.id"
      >
        <ULink
          :to="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 py-3 text-sm hover:text-primary"
        >
          <UIcon
            name="i-lucide-external-link"
            class="size-5 shrink-0 text-muted"
          />
          <span class="min-w-0 flex-1 truncate font-medium">{{ link.label }}</span>
          <UIcon
            name="i-lucide-arrow-up-right"
            class="size-4 shrink-0 text-muted"
          />
        </ULink>
      </li>
    </ul>
  </UCard>
</template>
