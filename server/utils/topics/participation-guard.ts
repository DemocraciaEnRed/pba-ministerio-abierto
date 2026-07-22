import type { MechanismType } from '../../../prisma/generated/enums'
import { isTopicParticipationWindowOpen } from './participation-window'
import { deriveParticipationState } from '../participation-state'

/**
 * Contexto validado de participación: la consulta y el tema ya verificados,
 * listos para registrar o eliminar una participación.
 */
export interface ParticipationContext {
  consultation: {
    id: number
    startsAt: Date | null
    endsAt: Date | null
    visibility: string
  }
  topic: {
    id: number
    consultationId: number
    visibility: string
    mechanismType: MechanismType | null
    participationStartsAt: Date | null
    participationEndsAt: Date | null
  }
}

/**
 * Valida que un usuario pueda participar en un tema con un mecanismo dado.
 *
 * Reglas (según docs/temas-logica-implementacion.md):
   * - La consulta debe existir, estar visible y con estado temporal 'open'.
   * - El tema debe existir, pertenecer a la consulta y estar visible.
 * - El mecanismo del tema debe coincidir con el esperado por el endpoint.
 * - La ventana de participación efectiva debe estar abierta (si cerró → 403).
 *
 * No verifica autenticación: eso debe hacerse antes con
 * `assertCan(ctx, 'participate', { type: 'consultation', id })`.
 */
export async function loadParticipationContext(
  consultationId: number,
  topicId: number,
  expectedMechanism: MechanismType
): Promise<ParticipationContext> {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true, startsAt: true, endsAt: true, visibility: true }
  })

  if (!consultation) {
    throw createError({
      statusCode: 404,
      message: 'Consulta no encontrada'
    })
  }

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: {
      id: true,
      consultationId: true,
      visibility: true,
      mechanismType: true,
      participationStartsAt: true,
      participationEndsAt: true
    }
  })

  if (!topic || topic.consultationId !== consultationId) {
    throw createError({
      statusCode: 404,
      message: 'Tema no encontrado'
    })
  }

  // Un tema no visible no existe para el ciudadano: 404.
  if (topic.visibility !== 'visible') {
    throw createError({
      statusCode: 404,
      message: 'Tema no encontrado'
    })
  }

  // El mecanismo del tema debe coincidir con el endpoint de participación.
  if (topic.mechanismType !== expectedMechanism) {
    throw createError({
      statusCode: 409,
      message: 'El mecanismo de participación no corresponde a este tema'
    })
  }

  // La consulta debe estar visible y su estado temporal abierto; prevalece
  // sobre el del tema.
  if (consultation.visibility !== 'visible' || deriveParticipationState(consultation) !== 'open') {
    throw createError({
      statusCode: 403,
      message: 'La participación en esta consulta está cerrada'
    })
  }

  // La ventana de participación efectiva (consulta + tema) debe estar abierta.
  if (!isTopicParticipationWindowOpen(topic, consultation)) {
    throw createError({
      statusCode: 403,
      message: 'La participación en este tema está cerrada'
    })
  }

  return { consultation, topic }
}
