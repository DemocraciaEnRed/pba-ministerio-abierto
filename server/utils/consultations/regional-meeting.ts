import { consultationTypeAllowsRegion } from '#shared/data/consultation-types'
import type { RegionalMeetingAgendaInput } from '#shared/schemas/regional-meetings'
import type { Prisma } from '../../../prisma/generated/client'

interface RegionalMeetingWriteInput {
  regionId?: number | null
  regionalMeeting?: RegionalMeetingAgendaInput | null
}

export interface RegionalMeetingWrite {
  regionId: number
  regionalMeeting: RegionalMeetingAgendaInput
}

function validationError(fields: { field: string, message: string }[]) {
  return createError({
    statusCode: 422,
    message: VALIDATION_ERROR_MESSAGE,
    data: fields
  })
}

/**
 * Valida la región y los datos del encuentro según el tipo de la consulta.
 *
 * - Tipos con región (Encuentros Regionales): ambos son obligatorios.
 * - Resto de los tipos: no se admiten (422 si llegan con valor).
 *
 * Devuelve `null` cuando el tipo no los usa.
 */
export async function resolveRegionalMeetingWrite(
  sectionSlug: string | null | undefined,
  input: RegionalMeetingWriteInput
): Promise<RegionalMeetingWrite | null> {
  if (!consultationTypeAllowsRegion(sectionSlug)) {
    if (input.regionId != null || input.regionalMeeting != null) {
      throw createError({
        statusCode: 422,
        message: 'Este tipo de consulta no admite región ni datos de encuentro'
      })
    }
    return null
  }

  const missing: { field: string, message: string }[] = []
  if (input.regionId == null) missing.push({ field: 'regionId', message: 'Elegí una región' })
  if (input.regionalMeeting == null) missing.push({ field: 'regionalMeeting', message: 'Completá los datos del encuentro' })
  if (missing.length > 0) throw validationError(missing)

  const region = await prisma.region.findUnique({
    where: { id: input.regionId! },
    select: { id: true }
  })
  if (!region) throw validationError([{ field: 'regionId', message: 'La región no existe' }])

  return { regionId: region.id, regionalMeeting: input.regionalMeeting! }
}

/** Crea o actualiza el ítem de agenda 1:1 de la consulta. */
export function upsertRegionalMeeting(
  tx: Prisma.TransactionClient,
  consultationId: number,
  meeting: RegionalMeetingAgendaInput
) {
  const data = {
    location: meeting.location,
    heldAt: meeting.heldAt,
    registrationUrl: meeting.registrationUrl,
    registrationOpensAt: meeting.registrationOpensAt,
    registrationClosesAt: meeting.registrationClosesAt
  }
  return tx.regionalMeetingAgendaItem.upsert({
    where: { consultationId },
    create: { consultationId, ...data },
    update: data
  })
}
