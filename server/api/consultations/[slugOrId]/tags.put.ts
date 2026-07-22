import { SetConsultationTagsSchema } from '#shared/schemas/consultation'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const body = await parseBody(event, SetConsultationTagsSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

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

  const uniqueTagIds = Array.from(new Set(body.tagIds))
  if (uniqueTagIds.length !== body.tagIds.length) {
    throw createError({
      statusCode: 422,
      message: 'No podés repetir etiquetas en la asignación'
    })
  }

  if (uniqueTagIds.length > 0) {
    const existingTags = await prisma.tag.findMany({
      where: {
        id: { in: uniqueTagIds },
        isActive: true
      },
      select: { id: true }
    })

    if (existingTags.length !== uniqueTagIds.length) {
      throw createError({
        statusCode: 422,
        message: 'Alguna etiqueta no existe o está inactiva'
      })
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.consultationTag.deleteMany({
      where: { consultationId }
    })

    if (uniqueTagIds.length > 0) {
      await tx.consultationTag.createMany({
        data: uniqueTagIds.map(tagId => ({
          consultationId,
          tagId
        }))
      })
    }
  })

  const tags = await prisma.consultationTag.findMany({
    where: { consultationId },
    include: {
      tag: true
    },
    orderBy: { id: 'asc' }
  })

  return tags.map(item => ({
    id: item.id,
    consultationId: item.consultationId,
    tagId: item.tagId,
    tag: {
      id: item.tag.id,
      slug: item.tag.slug,
      name: item.tag.name,
      description: item.tag.description,
      isActive: item.tag.isActive
    }
  }))
})
