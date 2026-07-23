import type { MechanismType, Visibility } from '../../../prisma/generated/enums'

/**
 * Datos mínimos de un tema necesarios para evaluar el bloqueo de configuración.
 */
export interface TopicConfigLockState {
  id: number
  visibility: Visibility
  configLockedAt: Date | null
}

/**
 * Indica si el tema tiene alguna participación registrada (apoyo, voto o encuesta).
 */
export async function topicHasParticipation(topicId: number): Promise<boolean> {
  const [support, vote, survey] = await Promise.all([
    prisma.supportParticipation.count({ where: { topicId } }),
    prisma.voteParticipation.count({ where: { topicId } }),
    prisma.surveyParticipation.count({ where: { topicId } })
  ])
  return support + vote + survey > 0
}

/**
 * La configuración estructural del método de participación está bloqueada si:
 * - el tema dejó de estar oculto (`visibility !== 'hidden'`), o
 * - fue bloqueado explícitamente al publicar (`configLockedAt != null`), o
 * - ya tiene participación registrada.
 *
 * En cualquiera de esos casos no se debe permitir cambiar el mecanismo ni mutar
 * la estructura de opciones de encuesta, para preservar la integridad de los datos.
 */
export function isTopicConfigLocked(
  topic: Pick<TopicConfigLockState, 'visibility' | 'configLockedAt'>,
  hasParticipation: boolean
): boolean {
  return topic.visibility !== 'hidden' || topic.configLockedAt !== null || hasParticipation
}

/**
 * Lanza 409 si la configuración del método de participación del tema está bloqueada.
 * Usar antes de cambiar el mecanismo o de crear/eliminar opciones de encuesta.
 */
export async function assertTopicConfigEditable(topic: TopicConfigLockState): Promise<void> {
  const hasParticipation = await topicHasParticipation(topic.id)
  if (isTopicConfigLocked(topic, hasParticipation)) {
    throw createError({
      statusCode: 409,
      message: 'La configuración del método de participación está bloqueada: el tema ya no es un borrador o tiene participación registrada.'
    })
  }
}

/**
 * Verifica el condicional del método de participación: SI el tema tiene un
 * mecanismo seleccionado, su configuración debe estar completa.
 * - Sin mecanismo: válido (un tema puede quedar sin método).
 * - `survey`: requiere al menos 2 opciones activas.
 * - `support` / `vote`: siempre válidos.
 *
 * Se usa como puerta compartida al cerrar la configuración y al publicar el tema.
 * Lanza 422 con detalle de campo si no cumple.
 */
export async function assertTopicMechanismConfigValid(
  topic: { id: number, mechanismType: MechanismType | null, surveyMinSelections?: number }
): Promise<void> {
  if (!topic.mechanismType) return

  if (topic.mechanismType === 'survey') {
    const activeOptions = await prisma.surveyOption.count({
      where: { topicId: topic.id, isActive: true }
    })
    const required = Math.max(2, topic.surveyMinSelections ?? 1)
    if (activeOptions < required) {
      throw createError({
        statusCode: 422,
        message: VALIDATION_ERROR_MESSAGE,
        data: [{ field: 'mechanism', message: `La encuesta necesita al menos ${required} opciones activas.` }]
      })
    }
  }
}
