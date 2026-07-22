export interface AdminConsultationSummary {
  id: number
  slug: string
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
  resultsVisibility: 'hidden' | 'participants_only' | 'public'
  section: { id: number, slug: string, name: string } | null
  categories: { id: number, slug: string, name: string, isPrimary: boolean }[]
  tags: { id: number, slug: string, name: string }[]
  createdAt?: string
  updatedAt?: string
  /** Indica si el usuario actual puede gestionar esta consulta (admin o gestor). */
  canManage?: boolean
}

/**
 * Carga la consulta (vista admin) a partir del slug de la ruta.
 * Usa una key estable para compartir el resultado entre el layout de la
 * consulta y las páginas de su panel de control (sin refetch duplicado).
 */
export function useConsultationAdmin() {
  const route = useRoute()
  const slug = computed(() => String(route.params.slugConsulta))

  // `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
  // backend resuelva la vista admin y `canManage` del usuario logueado.
  const requestFetch = useRequestFetch()
  const asyncData = useAsyncData(
    () => `admin-consultation-${slug.value}`,
    () => requestFetch<AdminConsultationSummary>(`/api/consultations/${slug.value}`),
    { watch: [slug] }
  )

  return { slug, ...asyncData }
}
