<script setup lang="ts">
import type { ButtonProps, DropdownMenuItem } from '@nuxt/ui'
import type { AdminCommentLogEntry, AdminCommentLogResponse, CommentModerationStatus } from '~/types/consulta'

definePageMeta({
  layout: 'admin-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Comentarios')

type StatusFilter = 'all' | CommentModerationStatus

interface ConsultationOption {
  label: string
  value: number
}

const SEARCH_DEBOUNCE_MS = 350

const filters = reactive({
  q: '',
  consultationId: undefined as number | null | undefined,
  moderationStatus: 'all' as StatusFilter,
  from: '',
  to: '',
  page: 1,
  perPage: 20
})

const searchInput = ref('')
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(searchInput, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    filters.q = value.trim()
  }, SEARCH_DEBOUNCE_MS)
})
onBeforeUnmount(() => clearTimeout(searchTimer))

const statusOptions = [
  { label: 'Todos los estados', value: 'all' },
  { label: 'Visibles', value: 'visible' },
  { label: 'Ocultos', value: 'hidden' },
  { label: 'Borrados', value: 'deleted' }
] satisfies { label: string, value: StatusFilter }[]

const hasActiveFilters = computed(() =>
  Boolean(filters.q)
  || filters.consultationId != null
  || filters.moderationStatus !== 'all'
  || Boolean(filters.from)
  || Boolean(filters.to)
)

function clearFilters(): void {
  clearTimeout(searchTimer)
  searchInput.value = ''
  Object.assign(filters, {
    q: '',
    consultationId: undefined,
    moderationStatus: 'all',
    from: '',
    to: '',
    page: 1
  })
}

const queryParams = computed(() => ({
  page: filters.page,
  perPage: filters.perPage,
  q: filters.q || undefined,
  consultationId: filters.consultationId ?? undefined,
  moderationStatus: filters.moderationStatus === 'all' ? undefined : filters.moderationStatus,
  from: filters.from || undefined,
  to: filters.to || undefined
}))

// `useRequestFetch` reenvía la cookie de sesión durante el SSR: el endpoint es
// solo para administradores de plataforma.
const requestFetch = useRequestFetch()
const { data, status, refresh } = await useAsyncData(
  'admin-comments-log',
  () => requestFetch<AdminCommentLogResponse>('/api/admin/comments', { query: queryParams.value }),
  { watch: [queryParams] }
)

const entries = computed(() => data.value?.items ?? [])
const pagination = computed(() => data.value?.pagination)

watch(
  () => [filters.q, filters.consultationId, filters.moderationStatus, filters.from, filters.to],
  () => {
    filters.page = 1
  }
)

// --- Selector de consulta con búsqueda remota ---

const consultationSearch = ref('')
const consultationOptions = ref<ConsultationOption[]>([])
const loadingConsultations = ref(false)
let consultationTimer: ReturnType<typeof setTimeout> | undefined

async function loadConsultationOptions(term: string): Promise<void> {
  loadingConsultations.value = true
  try {
    const response = await $fetch<{ items: { id: number, title: string }[] }>('/api/admin/consultations', {
      query: { q: term || undefined, perPage: 20 }
    })
    const options = response.items.map(item => ({ label: item.title, value: item.id }))
    // Conservamos la opción elegida aunque no aparezca en la búsqueda actual.
    const selected = consultationOptions.value.find(option => option.value === filters.consultationId)
    if (selected && !options.some(option => option.value === selected.value)) {
      options.unshift(selected)
    }
    consultationOptions.value = options
  } catch {
    consultationOptions.value = []
  } finally {
    loadingConsultations.value = false
  }
}

watch(consultationSearch, (term) => {
  clearTimeout(consultationTimer)
  consultationTimer = setTimeout(() => loadConsultationOptions(term.trim()), SEARCH_DEBOUNCE_MS)
})
onBeforeUnmount(() => clearTimeout(consultationTimer))
onMounted(() => loadConsultationOptions(''))

function selectConsultation(entry: AdminCommentLogEntry): void {
  if (!consultationOptions.value.some(option => option.value === entry.consultation.id)) {
    consultationOptions.value.unshift({ label: entry.consultation.title, value: entry.consultation.id })
  }
  filters.consultationId = entry.consultation.id
}

function publicUrl(entry: AdminCommentLogEntry): string {
  return entry.topic
    ? consultationPermalinkPath(entry.consultation.id, `temas/${entry.topic.slug}`)
    : consultationPermalinkPath(entry.consultation.id)
}

function menuItems(entry: AdminCommentLogEntry): DropdownMenuItem[] {
  return [
    {
      label: 'Filtrar por esta consulta',
      icon: 'i-lucide-filter',
      onSelect: () => selectConsultation(entry)
    },
    {
      label: 'Abrir en el panel de la consulta',
      icon: 'i-lucide-layout-dashboard',
      to: commentThreadPanelLink(entry.consultation.id, entry.rootCommentId, entry.isReply ? entry.id : null)
    },
    {
      label: 'Ver en la página pública',
      icon: 'i-lucide-external-link',
      to: publicUrl(entry),
      target: '_blank'
    }
  ]
}

const headerLinks = computed<ButtonProps[]>(() => [
  {
    label: 'Actualizar',
    icon: 'lucide:refresh-cw',
    color: 'neutral',
    variant: 'subtle',
    loading: status.value === 'pending',
    onClick: () => refresh()
  }
])

// --- Hilo en panel lateral, sin salir del registro ---

const threadOpen = ref(false)
const threadEntry = ref<AdminCommentLogEntry | null>(null)

function openThread(entry: AdminCommentLogEntry): void {
  threadEntry.value = entry
  threadOpen.value = true
}
</script>

<template>
  <div>
    <UPageHeader
      title="Comentarios"
      description="Registro de quién comentó y dónde, en todas las consultas de la plataforma."
      :links="headerLinks"
    />

    <UPageBody>
      <div class="space-y-4">
        <div class="flex flex-wrap items-end gap-3">
          <UInput
            v-model="searchInput"
            icon="i-lucide-search"
            placeholder="Buscar por texto, nombre o correo"
            aria-label="Buscar comentarios"
            class="w-full sm:w-72"
          />
          <USelectMenu
            v-model="filters.consultationId"
            v-model:search-term="consultationSearch"
            :items="consultationOptions"
            value-key="value"
            :loading="loadingConsultations"
            ignore-filter
            clear
            placeholder="Todas las consultas"
            :search-input="{ placeholder: 'Buscar consulta...' }"
            aria-label="Consulta"
            class="w-full sm:w-72"
          />
          <USelect
            v-model="filters.moderationStatus"
            :items="statusOptions"
            value-key="value"
            aria-label="Estado de moderación"
            class="w-full sm:w-48"
          />
          <DateRangeField
            v-model:from="filters.from"
            v-model:to="filters.to"
            aria-label="Rango de fechas"
            class="w-full sm:w-auto"
          />
          <div class="ms-auto flex items-center gap-1">
            <UButton
              v-if="hasActiveFilters || searchInput"
              label="Limpiar filtros"
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              @click="clearFilters"
            />
          </div>
        </div>

        <UPageCard
          :ui="{ container: 'p-0 sm:p-0' }"
        >
          <div
            v-if="status === 'pending' && entries.length === 0"
            class="space-y-3 p-4"
          >
            <USkeleton
              v-for="n in 4"
              :key="n"
              class="h-20 w-full"
            />
          </div>

          <UEmpty
            v-else-if="entries.length === 0"
            icon="i-lucide-message-square-off"
            title="No hay comentarios"
            :description="hasActiveFilters ? 'Ningún comentario coincide con los filtros seleccionados.' : 'Todavía no hay comentarios en la plataforma.'"
            class="py-10"
          />

          <ul
            v-else
            class="divide-y divide-default"
          >
            <AdminCommentFeedRow
              v-for="entry in entries"
              :key="entry.id"
              :author-user-id="entry.authorUserId"
              :author-label="entry.authorLabel"
              :author-email="entry.authorEmail"
              :author-avatar-url="entry.authorAvatarUrl"
              :author-mode="entry.authorMode"
              :verb="entry.isReply ? 'respondió en' : 'comentó en'"
              :created-at="entry.createdAt"
              :excerpt="entry.excerpt"
              :active="threadOpen && threadEntry?.id === entry.id"
              @open="openThread(entry)"
            >
              <template #context>
                {{ entry.consultation.title }}<template v-if="entry.topic">
                  <span class="font-normal text-muted"> › </span>{{ entry.topic.title }}
                </template>
              </template>

              <template #badges>
                <UBadge
                  v-if="entry.isReply"
                  label="Respuesta"
                  icon="i-lucide-corner-down-right"
                  color="neutral"
                  variant="soft"
                  size="sm"
                />
                <UBadge
                  v-if="entry.moderationStatus !== 'visible'"
                  :label="commentStatusBadge(entry.moderationStatus).label"
                  :color="commentStatusBadge(entry.moderationStatus).color"
                  icon="i-lucide-shield"
                  variant="subtle"
                  size="sm"
                />
                <UBadge
                  v-if="entry.hasAttachment"
                  label="Adjunto"
                  icon="i-lucide-paperclip"
                  color="neutral"
                  variant="soft"
                  size="sm"
                />
              </template>

              <template #actions>
                <UButton
                  label="Ver hilo"
                  icon="i-lucide-messages-square"
                  color="neutral"
                  variant="outline"
                  size="xs"
                  @click="openThread(entry)"
                />
                <UDropdownMenu
                  :items="menuItems(entry)"
                  :content="{ align: 'end' }"
                >
                  <UButton
                    icon="i-lucide-ellipsis-vertical"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    aria-label="Más acciones"
                  />
                </UDropdownMenu>
              </template>
            </AdminCommentFeedRow>
          </ul>
        </UPageCard>

        <div
          v-if="pagination && pagination.total > 0"
          class="flex flex-wrap items-center justify-between gap-3"
        >
          <p class="text-xs text-muted">
            {{ pagination.total }} {{ pagination.total === 1 ? 'comentario' : 'comentarios' }}
          </p>
          <UPagination
            v-model:page="filters.page"
            :items-per-page="pagination.perPage"
            :total="pagination.total"
          />
        </div>
      </div>
    </UPageBody>

    <AdminCommentThreadSlideover
      v-model:open="threadOpen"
      :comment-id="threadEntry?.rootCommentId ?? null"
      :consultation-id="threadEntry?.consultation.id ?? 0"
      :consultation-title="threadEntry?.consultation.title"
      :highlight-reply-id="threadEntry?.isReply ? threadEntry.id : null"
      show-panel-link
      @changed="refresh()"
    />
  </div>
</template>
