import { serializeTopic } from '~~/server/utils/serializers/topic'
import { assertTopicWindowWithinConsultation } from '~~/server/utils/topics/participation-window'
import { CreateTopicSchema } from '#shared/schemas/topic'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const ctx = await getAuthContext(event)

  // Verify consultation exists
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true, startsAt: true, endsAt: true }
  })

  if (!consultation) {
    throw createError({
      statusCode: 404,
      message: 'Consulta no encontrada'
    })
  }

  if (event.node.req.method === 'GET') {
    // List topics
    const topics = await prisma.topic.findMany({
      where: { consultationId },
      orderBy: { displayOrder: 'asc' },
      include: { topicTags: { select: { tagId: true } } }
    })

    const isAdminView = ctx.isPlatformAdmin
      || await prisma.consultationMembership.findFirst({
        where: {
          userId: ctx.user?.id ?? -1,
          consultationId
        }
      }) !== null

    return topics.map((topic) => {
      return isAdminView
        ? serializeTopic(topic as any, 'admin') // eslint-disable-line @typescript-eslint/no-explicit-any
        : serializeTopic(topic as any, 'public') // eslint-disable-line @typescript-eslint/no-explicit-any
    })
  }

  if (event.node.req.method === 'POST') {
    // Create topic
    const body = await parseBody(event, CreateTopicSchema)
    await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

    // La ventana de participación del tema debe quedar dentro de la de la consulta.
    assertTopicWindowWithinConsultation(
      { participationStartsAt: body.participationStartsAt, participationEndsAt: body.participationEndsAt },
      consultation
    )

    // Check slug uniqueness
    const existingSlug = await prisma.topic.findUnique({
      where: {
        consultationId_slug: {
          consultationId,
          slug: body.slug
        }
      }
    })

    if (existingSlug) {
      throw createError({
        statusCode: 422,
        message: 'Validación de formulario',
        data: [{ field: 'slug', message: 'El slug ya existe en esta consulta' }]
      })
    }

    // Get max displayOrder to increment
    const maxOrder = await prisma.topic.aggregate({
      where: { consultationId },
      _max: { displayOrder: true }
    })

    const nextOrder = (maxOrder._max.displayOrder ?? 0) + 1

    const topic = await prisma.topic.create({
      data: {
        ...body,
        displayOrder: body.displayOrder !== 0 ? body.displayOrder : nextOrder,
        consultationId,
        visibility: 'hidden',
        mechanismType: body.mechanismType
      },
      include: { topicTags: { select: { tagId: true } } }
    })

    return serializeTopic(topic, 'admin')
  }

  throw createError({
    statusCode: 405,
    message: 'Método no permitido'
  })
})
