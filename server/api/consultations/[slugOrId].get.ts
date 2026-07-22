import { resolveConsultationBySlugOrId, parseConsultationSlugOrId } from '~~/server/utils/consultations/slug'
import { serializeConsultation } from '~~/server/utils/serializers/consultation'

function isPubliclyVisibleConsultation(consultation: { visibility: string }): boolean {
  return consultation.visibility !== 'hidden'
}

export default defineEventHandler(async (event) => {
  const identifier = parseConsultationSlugOrId(event)
  const ctx = await getAuthContext(event)

  const userId = ctx.user?.id ?? null
  const consultation = await resolveConsultationBySlugOrId(
    identifier,
    {
      section: true,
      categoryAssignments: {
        include: { category: true },
        orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }, { id: 'asc' }]
      },
      consultationTags: {
        include: { tag: true }
      },
      ...(userId
        ? {
            memberships: {
              where: { userId },
              select: { id: true }
            }
          }
        : {})
    }
  )

  const isAdminView = ctx.isPlatformAdmin
    || ('memberships' in consultation && Array.isArray(consultation.memberships) && consultation.memberships.length > 0)

  if (!isAdminView && !isPubliclyVisibleConsultation(consultation)) {
    throw createError({
      statusCode: 404,
      message: 'Consulta no encontrada'
    })
  }

  if (isAdminView) {
    return { ...serializeConsultation(consultation, 'admin'), canManage: true }
  }

  return { ...serializeConsultation(consultation, 'public'), canManage: false }
})
