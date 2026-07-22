import { serializeTopicLink } from '~~/server/utils/serializers/topicLink'
import { CreateTopicLinkSchema } from '#shared/schemas/topicLink'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { resolveTopicIdFromParam } from '~~/server/utils/topics/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicId = await resolveTopicIdFromParam(event, consultationId)
  const ctx = await getAuthContext(event)

  if (event.node.req.method === 'GET') {
    const links = await prisma.topicRelatedLink.findMany({
      where: { topicId },
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
      ? serializeTopicLink(link, 'admin')
      : serializeTopicLink(link, 'public'))
  }

  if (event.node.req.method === 'POST') {
    const body = await parseBody(event, CreateTopicLinkSchema)
    await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

    const maxOrder = await prisma.topicRelatedLink.aggregate({
      where: { topicId },
      _max: { displayOrder: true }
    })

    const nextOrder = (maxOrder._max.displayOrder ?? 0) + 1

    const link = await prisma.topicRelatedLink.create({
      data: {
        topicId,
        label: body.label,
        url: body.url,
        displayOrder: body.displayOrder !== 0 ? body.displayOrder : nextOrder
      }
    })

    setResponseStatus(event, 201)
    return serializeTopicLink(link, 'admin')
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
