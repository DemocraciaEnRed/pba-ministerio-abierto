import type { RegionalMeetingSummary } from '~/types/consulta'

export interface AdminConsultationSummary {
  id: number
  slug: string
  /** URL pública canónica (`/{seccion}/{id}/{nombre}`). */
  publicPath: string
  title: string
  summary: string | null
  body: string | null
  consultationFormat: 'single' | 'multiple'
  visibility: 'hidden' | 'visible' | 'archived'
  participationState: 'scheduled' | 'open' | 'closed'
  featured: boolean
  startsAt: string | null
  endsAt: string | null
  publishedAt: string | null
  closedMessage: string | null
  commentsEnabled: boolean
  commentsGuidance: string | null
  resultsVisibility: 'hidden' | 'participants_only' | 'public'
  section: { id: number, slug: string, name: string } | null
  region: { id: number, slug: string, name: string } | null
  observatoryWorkGroups: { id: number, slug: string, name: string, color: string, iconColor: string, icon: string }[]
  categories: { id: number, slug: string, name: string, isPrimary: boolean }[]
  tags: { id: number, slug: string, name: string }[]
  /** Portada de la consulta; `null` cuando no hay imagen cargada. */
  coverUrl: string | null
  coverAltText: string | null
  /** Encuentro presencial (Encuentros Regionales); `null` si no tiene. */
  regionalMeeting: RegionalMeetingSummary | null
  createdAt?: string
  updatedAt?: string
  /** Indica si el usuario actual puede gestionar esta consulta (admin o gestor). */
  canManage?: boolean
}

/**
 * Carga la consulta (vista admin) a partir del id de la ruta (`/consultas/{id}/panel`).
 * Usa una key estable para compartir el resultado entre el layout de la
 * consulta y las páginas de su panel de control (sin refetch duplicado).
 */
export function useConsultationAdmin() {
  const route = useRoute()
  const consultationId = computed(() => String(route.params.idConsulta))

  // `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
  // backend resuelva la vista admin y `canManage` del usuario logueado.
  const requestFetch = useRequestFetch()
  const asyncData = useAsyncData(
    () => `admin-consultation-${consultationId.value}`,
    () => requestFetch<AdminConsultationSummary>(`/api/consultations/${consultationId.value}`),
    { watch: [consultationId] }
  )

  return { consultationId, ...asyncData }
}
