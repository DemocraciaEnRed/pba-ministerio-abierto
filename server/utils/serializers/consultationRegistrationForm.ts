import type { RegistrationFormKind } from '#shared/data/consultation-types'

export type ConsultationRegistrationFormView = 'public' | 'admin'

/** Estado de la ventana de inscripción, derivado de las fechas. */
export type RegistrationState = 'scheduled' | 'open' | 'closed'

type RegistrationFormEntity = {
  id: number
  consultationId: number
  title: string
  eventAt: Date
  opensAt: Date
  closesAt: Date
  venueName: string
  venueAddress: string
  venueCity: string
  venueProvince: string
  createdAt: Date
  updatedAt: Date
}

export interface PublicConsultationRegistrationFormDTO {
  id: number
  title: string
  kind: RegistrationFormKind
  eventAt: string
  opensAt: string
  closesAt: string
  venueName: string
  venueAddress: string
  venueCity: string
  venueProvince: string
  registrationState: RegistrationState
}

export interface AdminConsultationRegistrationFormDTO extends PublicConsultationRegistrationFormDTO {
  consultationId: number
  registrationsCount: number
  createdAt: string
  updatedAt: string
}

export interface SerializeRegistrationFormContext {
  kind: RegistrationFormKind
  registrationsCount?: number
  now?: Date
}

export function resolveRegistrationState(form: { opensAt: Date, closesAt: Date }, now: Date = new Date()): RegistrationState {
  if (now < form.opensAt) return 'scheduled'
  if (now > form.closesAt) return 'closed'
  return 'open'
}

export function serializeConsultationRegistrationForm(
  form: RegistrationFormEntity,
  view: 'public',
  context: SerializeRegistrationFormContext
): PublicConsultationRegistrationFormDTO
export function serializeConsultationRegistrationForm(
  form: RegistrationFormEntity,
  view: 'admin',
  context: SerializeRegistrationFormContext
): AdminConsultationRegistrationFormDTO
export function serializeConsultationRegistrationForm(
  form: RegistrationFormEntity,
  view: ConsultationRegistrationFormView,
  context: SerializeRegistrationFormContext
): PublicConsultationRegistrationFormDTO | AdminConsultationRegistrationFormDTO {
  const base: PublicConsultationRegistrationFormDTO = {
    id: form.id,
    title: form.title,
    kind: context.kind,
    eventAt: form.eventAt.toISOString(),
    opensAt: form.opensAt.toISOString(),
    closesAt: form.closesAt.toISOString(),
    venueName: form.venueName,
    venueAddress: form.venueAddress,
    venueCity: form.venueCity,
    venueProvince: form.venueProvince,
    registrationState: resolveRegistrationState(form, context.now)
  }

  if (view === 'public') {
    return base
  }

  return {
    ...base,
    consultationId: form.consultationId,
    registrationsCount: context.registrationsCount ?? 0,
    createdAt: form.createdAt.toISOString(),
    updatedAt: form.updatedAt.toISOString()
  }
}
