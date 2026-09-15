import { consultationTypeAllowsWorkGroup } from '#shared/data/consultation-types'
import { SetConsultationWorkGroupsSchema } from '#shared/schemas/consultation'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { serializeObservatoryWorkGroup } from '~~/server/utils/serializers/observatoryWorkGroup'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const body = await parseBody(event, SetConsultationWorkGroupsSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true, section: { select: { slug: true } } }
  })

  if (!consultation) {
    throw createError({
      statusCode: 404,
      message: 'Consulta no encontrada'
    })
  }

  const uniqueIds = Array.from(new Set(body.observatoryWorkGroupIds))
  if (uniqueIds.length !== body.observatoryWorkGroupIds.length) {
    throw createError({
      statusCode: 422,
      message: 'No podés repetir grupos de trabajo en la asignación'
    })
  }

  // Vaciar la asignación siempre se permite, incluso si la consulta cambió a un tipo que no lo admite.
  if (uniqueIds.length > 0) {
    if (!consultationTypeAllowsWorkGroup(consultation.section?.slug)) {
      throw createError({
        statusCode: 422,
        message: 'Este tipo de consulta no admite grupo de trabajo'
      })
    }

    const groups = await prisma.observatoryWorkGroup.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true }
    })

    if (groups.length !== uniqueIds.length) {
      throw createError({
        statusCode: 422,
        message: 'Algún grupo de trabajo no existe'
      })
    }
  }

  const assignments = await prisma.$transaction(async (tx) => {
    await tx.consultationObservatoryWorkGroup.deleteMany({ where: { consultationId } })
    if (uniqueIds.length > 0) {
      await tx.consultationObservatoryWorkGroup.createMany({
        data: uniqueIds.map(workGroupId => ({ consultationId, workGroupId }))
      })
    }
    return tx.consultationObservatoryWorkGroup.findMany({
      where: { consultationId },
      include: { workGroup: true },
      orderBy: { workGroup: { displayOrder: 'asc' } }
    })
  })

  return {
    observatoryWorkGroups: assignments.map(assignment =>
      serializeObservatoryWorkGroup(assignment.workGroup, 'public')
    )
  }
})
