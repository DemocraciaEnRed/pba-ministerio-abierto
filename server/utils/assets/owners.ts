import type { AssetOwnerType } from '../../../prisma/generated/enums'
import type { AuthContext } from '../auth/context'

export interface AssetOwnerRef {
  ownerType: AssetOwnerType
  ownerId: number
}

async function resolveConsultationIdFromOwner(owner: AssetOwnerRef): Promise<number> {
  if (owner.ownerType === 'consultation') {
    const consultation = await prisma.consultation.findUnique({
      where: { id: owner.ownerId },
      select: { id: true }
    })

    if (!consultation) {
      throw createError({
        statusCode: 404,
        message: 'Consulta no encontrada'
      })
    }

    return consultation.id
  }

  if (owner.ownerType === 'topic') {
    const topic = await prisma.topic.findUnique({
      where: { id: owner.ownerId },
      select: { consultationId: true }
    })

    if (!topic) {
      throw createError({
        statusCode: 404,
        message: 'Tema no encontrado'
      })
    }

    return topic.consultationId
  }

  const closure = await prisma.consultationClosure.findUnique({
    where: { id: owner.ownerId },
    select: { consultationId: true }
  })

  if (!closure) {
    throw createError({
      statusCode: 404,
      message: 'Cierre de consulta no encontrado'
    })
  }

  return closure.consultationId
}

export async function assertCanManageAssetOwner(ctx: AuthContext, owner: AssetOwnerRef): Promise<void> {
  const consultationId = await resolveConsultationIdFromOwner(owner)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })
}
