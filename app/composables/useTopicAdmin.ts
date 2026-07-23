export interface AdminTopicSummary {
  id: number
  consultationId: number
  slug: string
  title: string
  summary: string | null
  body: string | null
  questionText: string | null
  displayOrder: number
  participationStartsAt: string | null
  participationEndsAt: string | null
  visibility: 'hidden' | 'visible' | 'archived'
  mechanismType: 'support' | 'vote' | 'survey' | null
  voteAllowAbstain: boolean
  surveyMinSelections: number
  surveyMaxSelections: number | null
  participationState: 'scheduled' | 'open' | 'closed'
  participationOpen: boolean
  publishResultsWhenParticipationEnds: boolean
  configLockedAt: string | null
  /** Portada del tema; `null` cuando no hay imagen cargada. */
  coverUrl: string | null
  coverAltText: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Carga el tema (vista admin) a partir de los slugs de la ruta.
 * Usa una key estable para compartir el resultado entre el layout del tema
 * y las páginas de su panel de control (sin refetch duplicado).
 */
export function useTopicAdmin() {
  const route = useRoute()
  const consultationSlug = computed(() => String(route.params.slugConsulta))
  const topicSlug = computed(() => String(route.params.slugTema))

  // `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
  // backend resuelva la vista admin y `canManage` del usuario logueado.
  const requestFetch = useRequestFetch()
  const asyncData = useAsyncData(
    () => `admin-topic-${consultationSlug.value}-${topicSlug.value}`,
    () => requestFetch<AdminTopicSummary>(`/api/consultations/${consultationSlug.value}/topics/${topicSlug.value}`),
    { watch: [consultationSlug, topicSlug] }
  )

  return { consultationSlug, topicSlug, ...asyncData }
}
