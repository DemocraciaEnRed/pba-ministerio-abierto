import type { H3Event } from 'h3'
import type { RegistrationFormKind } from '#shared/data/consultation-types'
import { consultationTypeRegistrationKind } from '#shared/data/consultation-types'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export interface RegistrationConsultationContext {
  consultationId: number
  slug: string
  title: string
  kind: RegistrationFormKind
}

/**
 * Resuelve la consulta del parámetro de ruta y verifica que su tipo habilite el
 * formulario de inscripción. Lanza 404 si no existe y 422 si el tipo no aplica.
 */
export async function resolveRegistrationConsultation(event: H3Event): Promise<RegistrationConsultationContext> {
  const consultationId = await resolveConsultationIdFromParam(event)

  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true, slug: true, title: true, section: { select: { slug: true } } }
  })

  if (!consultation) {
    throw createError({ statusCode: 404, message: 'Consulta no encontrada' })
  }

  const kind = consultationTypeRegistrationKind(consultation.section?.slug)
  if (!kind) {
    throw createError({
      statusCode: 422,
      message: 'Este tipo de consulta no admite formulario de inscripción'
    })
  }

  return {
    consultationId: consultation.id,
    slug: consultation.slug,
    title: consultation.title,
    kind
  }
}
