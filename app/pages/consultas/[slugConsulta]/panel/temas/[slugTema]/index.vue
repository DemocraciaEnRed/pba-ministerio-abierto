<script setup lang="ts">
definePageMeta({
  layout: 'tema-consulta-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Panel del tema')

const { consultationSlug, topicSlug, data: topic, status, error } = useTopicAdmin()

const basePath = computed(() => `/consultas/${consultationSlug.value}/panel/temas/${topicSlug.value}`)

const estadoBadge = computed(() =>
  topic.value ? topicStateBadge(topic.value.visibility, topic.value.participationState) : null
)

const mechanismLabels: Record<string, string> = {
  support: 'Apoyo',
  vote: 'Votación',
  survey: 'Encuesta'
}

const mechanismLabel = computed(() =>
  topic.value?.mechanismType ? mechanismLabels[topic.value.mechanismType] : 'Sin método'
)

// La configuración del método queda fija al publicar o al cerrarla manualmente.
const configLocked = computed(() =>
  Boolean(topic.value) && (topic.value!.visibility !== 'hidden' || topic.value!.configLockedAt !== null)
)

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Sin definir'
  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>

<template>
  <UPage>
    <UPageHeader
      :title="topic?.title || 'Panel del tema'"
      description="Resumen, estado y accesos rápidos del tema de participación."
    >
      <template #links>
        <UButton
          label="Editar tema"
          icon="i-lucide-pencil"
          color="neutral"
          variant="subtle"
          :to="`${basePath}/editar`"
        />
      </template>
    </UPageHeader>

    <UPageBody class="space-y-8">
      <p
        v-if="status === 'pending'"
        class="text-sm text-muted"
      >
        Cargando tema...
      </p>

      <UPageCard
        v-else-if="error || !topic"
        class="space-y-2"
      >
        <p class="font-medium">
          No encontramos el tema.
        </p>
        <UButton
          :to="`/consultas/${consultationSlug}/panel/temas`"
          label="Volver a temas"
          color="neutral"
          variant="ghost"
        />
      </UPageCard>

      <template v-else>
        <section class="space-y-3">
          <h2 class="text-sm font-medium text-muted">
            Estado del tema
          </h2>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminPanelStat
              v-if="estadoBadge"
              :icon="estadoBadge.icon"
              label="Estado"
              :value="estadoBadge.label"
              :color="estadoBadge.color"
            />

            <AdminPanelStat
              icon="i-lucide-sliders-horizontal"
              label="Método de participación"
              :value="mechanismLabel"
              :color="topic.mechanismType ? 'neutral' : 'error'"
              :to="`${basePath}/metodo-participacion`"
            />

            <AdminPanelStat
              icon="i-lucide-users"
              label="Participación"
              :value="topic.participationOpen ? 'Abierta' : 'Cerrada'"
              :color="topic.participationOpen ? 'success' : 'neutral'"
            />

            <AdminPanelStat
              :icon="configLocked ? 'i-lucide-lock' : 'i-lucide-lock-open'"
              label="Configuración del método"
              :value="configLocked ? 'Fija' : 'Editable'"
              :color="configLocked ? 'neutral' : 'primary'"
            />
          </div>
        </section>

        <section
          v-if="topic.participationStartsAt || topic.participationEndsAt"
          class="space-y-3"
        >
          <h2 class="text-sm font-medium text-muted">
            Ventana de participación
          </h2>
          <div class="grid gap-3 sm:grid-cols-2">
            <AdminPanelStat
              icon="i-lucide-calendar-plus"
              label="Inicio"
              :value="formatDate(topic.participationStartsAt)"
            />
            <AdminPanelStat
              icon="i-lucide-calendar-x"
              label="Cierre"
              :value="topic.participationEndsAt ? formatDate(topic.participationEndsAt) : 'Sin cierre definido'"
            />
          </div>
        </section>

        <section class="space-y-3">
          <h2 class="text-sm font-medium text-muted">
            Accesos rápidos
          </h2>
          <div class="grid gap-4 md:grid-cols-2">
            <UPageCard
              title="Contenido"
              description="Título, resumen, descripción y ventana de participación."
              icon="i-lucide-pencil"
              :to="`${basePath}/editar`"
            />
            <UPageCard
              title="Método de participación"
              description="Elegí el mecanismo y, si es encuesta, sus opciones."
              icon="i-lucide-sliders-horizontal"
              :to="`${basePath}/metodo-participacion`"
            />
          </div>
        </section>
      </template>
    </UPageBody>
  </UPage>
</template>
