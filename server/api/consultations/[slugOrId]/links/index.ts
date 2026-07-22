import { serializeConsultationLink } from '~~/server/utils/serializers/consultationLink'
import { CreateConsultationLinkSchema } from '#shared/schemas/consultationLink'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const ctx = await getAuthContext(event)

  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true }
  })

  if (!consultation) {
    throw createError({
      statusCode: 404,
      message: 'Consulta no encontrada'
    })
  }

  if (event.node.req.method === 'GET') {
    const links = await prisma.consultationRelatedLink.findMany({
      where: { consultationId },
      orderBy: { displayOrder: 'asc' }
    })

    const isAdminView = ctx.isPlatformAdmin
      || await prisma.consultationMembership.findFirst({
        where: {
          userId: ctx.user?.id ?? -1,
          consultationId
        }
      }) !== null

    return links.map(link => isAdminView
      ? serializeConsultationLink(link, 'admin')
      : serializeConsultationLink(link, 'public'))
  }

  if (event.node.req.method === 'POST') {
    const body = await parseBody(event, CreateConsultationLinkSchema)
    await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

    const maxOrder = await prisma.consultationRelatedLink.aggregate({
      where: { consultationId },
      _max: { displayOrder: true }
    })

    const nextOrder = (maxOrder._max.displayOrder ?? 0) + 1

    const link = await prisma.consultationRelatedLink.create({
      data: {
        consultationId,
        label: body.label,
        url: body.url,
        displayOrder: body.displayOrder !== 0 ? body.displayOrder : nextOrder
      }
    })

    setResponseStatus(event, 201)
    return serializeConsultationLink(link, 'admin')
  }

  throw createError({
    statusCode: 405,
    message: 'Método no permitido'
  })
})
