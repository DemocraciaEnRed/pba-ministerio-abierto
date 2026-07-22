<script setup lang="ts">
import type { MechanismType, ParticipationState, Visibility } from '~/types/consulta'

definePageMeta({
  layout: 'consultas-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Temas')

interface AdminTopic {
  id: number
  consultationId: number
  slug: string
  title: string
  summary: string | null
  displayOrder: number
  visibility: Visibility
  participationState: ParticipationState
  mechanismType: MechanismType | null
  participationOpen: boolean
  participationStartsAt: string | null
  participationEndsAt: string | null
}

const { slug } = useConsultationAdmin()

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()
const { data: topics, status } = await useAsyncData(
  () => `admin-consultation-topics-${slug.value}`,
  () => requestFetch<AdminTopic[]>(`/api/consultations/${slug.value}/topics`),
  { watch: [slug] }
)

const topicList = computed(() =>
  [...(topics.value ?? [])].sort((a, b) => a.displayOrder - b.displayOrder)
)
</script>

<template>
  <UPage>
    <UPageHeader
      title="Temas"
      description="Administrá los temas de esta consulta."
    >
      <template #links>
        <UButton
          label="Nuevo tema"
          icon="i-lucide-plus"
          color="primary"
          :to="`/consultas/${slug}/panel/temas/nuevo`"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <div
        v-if="status === 'pending'"
        class="space-y-3"
      >
        <USkeleton
          v-for="n in 3"
          :key="n"
          class="h-40 w-full rounded-lg"
        />
      </div>

      <div
        v-else-if="topicList.length"
        class="space-y-3"
      >
        <AdminTopicCard
          v-for="topic in topicList"
          :key="topic.id"
          :consultation-slug="slug"
          :topic="topic"
        />
      </div>

      <div
        v-else
        class="rounded-lg border border-dashed border-default py-10 text-center"
      >
        <p class="text-sm text-muted">
          Esta consulta todavía no tiene temas.
        </p>
        <UButton
          label="Nuevo tema"
          icon="i-lucide-plus"
          color="primary"
          variant="soft"
          class="mt-3"
          :to="`/consultas/${slug}/panel/temas/nuevo`"
        />
      </div>
    </UPageBody>
  </UPage>
</template>
