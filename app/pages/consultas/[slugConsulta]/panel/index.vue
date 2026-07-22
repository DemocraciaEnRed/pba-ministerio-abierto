<script setup lang="ts">
definePageMeta({
  layout: 'consultas-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Panel de la consulta')

type Visibility = 'hidden' | 'visible' | 'archived'
type ParticipationState = 'scheduled' | 'open' | 'closed'
type MechanismType = 'support' | 'vote' | 'survey'

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

const { slug, data: consultation } = useConsultationAdmin()

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()
const { data: topics } = await useAsyncData(
  () => `admin-consultation-topics-${slug.value}`,
  () => requestFetch<AdminTopic[]>(`/api/consultations/${slug.value}/topics`),
  { watch: [slug] }
)

const topicList = computed(() => topics.value ?? [])
const visibleCount = computed(() => topicList.value.filter(topic => topic.visibility === 'visible').length)
const hiddenCount = computed(() => topicList.value.filter(topic => topic.visibility === 'hidden').length)

function topicEstadoBadge(topic: AdminTopic) {
  return topicStateBadge(topic.visibility, topic.participationState)
}

const mechanismLabels: Record<MechanismType, string> = {
  support: 'Apoyo',
  vote: 'Votación',
  survey: 'Encuesta'
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Sin definir'
  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatLabel = computed(() => consultation.value?.consultationFormat === 'single' ? 'Única' : 'Múltiple')

// Recordatorio no bloqueante: falta clasificar la consulta (sección/categorías/etiquetas).
const missingClassification = computed(() => {
  const c = consultation.value
  if (!c) return [] as string[]
  const missing: string[] = []
  if (!c.section) missing.push('sección')
  if (!c.categories?.length) missing.push('categorías')
  if (!c.tags?.length) missing.push('etiquetas')
  return missing
})

const classificationHint = computed(() => {
  const items = missingClassification.value
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(', ')} ni ${items[items.length - 1]}`
})
</script>

<template>
  <UPage>
    <UPageHeader
      title="Panel de gestión"
      description="Resumen y accesos rápidos de la consulta."
    >
      <template #links>
        <UButton
          label="Editar consulta"
          icon="i-lucide-pencil"
          color="neutral"
          variant="subtle"
          :to="`/consultas/${slug}/panel/editar`"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <UAlert
        v-if="missingClassification.length"
        icon="i-lucide-shapes"
        color="warning"
        variant="subtle"
        class="mb-6"
        title="Completá la clasificación de la consulta"
        :description="`Todavía no definiste ${classificationHint}. No es obligatorio, pero ayuda a que la consulta aparezca mejor en el listado público y los filtros.`"
        :actions="[{ label: 'Completar clasificación', icon: 'i-lucide-shapes', color: 'warning', variant: 'soft', to: `/consultas/${slug}/panel/clasificacion` }]"
      />
      <div class="space-y-8">
        <section class="space-y-3">
          <h2 class="text-sm font-medium text-muted">
            Estadísticas rápidas
          </h2>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminPanelStat
              icon="i-lucide-list-tree"
              label="Temas"
              :value="topicList.length"
              :hint="`${visibleCount} visibles · ${hiddenCount} ocultos`"
              :to="`/consultas/${slug}/panel/temas`"
            />

            <AdminPanelStat
              icon="i-lucide-git-branch"
              label="Formato"
              :value="formatLabel"
              :hint="consultation?.consultationFormat === 'single' ? 'Un solo espacio de participación' : 'Varios temas'"
            />

            <AdminPanelStat
              icon="i-lucide-star"
              label="Destacada"
              :value="consultation?.featured ? 'Sí' : 'No'"
              :color="consultation?.featured ? 'warning' : 'neutral'"
              :hint="consultation?.featured ? 'Aparece resaltada' : 'No destacada'"
            />

            <AdminPanelStat
              icon="i-lucide-calendar-range"
              label="Participación"
            >
              <div class="space-y-0.5 text-sm">
                <p class="flex items-center gap-1.5">
                  <UIcon
                    name="i-lucide-calendar-plus"
                    class="size-3.5 shrink-0 text-muted"
                  />
                  <span class="text-muted">Inicio:</span>
                  <span class="font-medium text-highlighted">{{ formatDate(consultation?.startsAt) }}</span>
                </p>
                <p class="flex items-center gap-1.5">
                  <UIcon
                    name="i-lucide-calendar-x"
                    class="size-3.5 shrink-0 text-muted"
                  />
                  <span class="text-muted">Cierre:</span>
                  <span class="font-medium text-highlighted">{{ formatDate(consultation?.endsAt) }}</span>
                </p>
              </div>
            </AdminPanelStat>
          </div>
        </section>

        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-medium text-muted">
              Accesos rápidos a temas
            </h2>
            <UButton
              label="Ver todos"
              icon="i-lucide-arrow-right"
              trailing
              color="neutral"
              variant="ghost"
              size="sm"
              :to="`/consultas/${slug}/panel/temas`"
            />
          </div>

          <div
            v-if="topicList.length"
            class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <UPageCard
              v-for="topic in topicList"
              :key="topic.id"
              :title="topic.title"
              :description="topic.summary || 'Sin resumen.'"
              :to="`/consultas/${slug}/panel/temas`"
              spotlight
            >
              <template #footer>
                <div class="flex flex-wrap items-center gap-2">
                  <UBadge
                    :label="topicEstadoBadge(topic).label"
                    :color="topicEstadoBadge(topic).color"
                    variant="subtle"
                  />
                  <UBadge
                    :label="topic.mechanismType ? mechanismLabels[topic.mechanismType] : 'Sin método'"
                    :color="topic.mechanismType ? 'neutral' : 'error'"
                    variant="outline"
                  />
                </div>
              </template>
            </UPageCard>
          </div>

          <UPageCard
            v-else
            class="text-center"
          >
            <p class="text-sm text-muted">
              Esta consulta todavía no tiene temas.
            </p>
            <UButton
              label="Gestionar temas"
              icon="i-lucide-plus"
              class="mt-3"
              :to="`/consultas/${slug}/panel/temas`"
            />
          </UPageCard>
        </section>
      </div>
    </UPageBody>
  </UPage>
</template>
