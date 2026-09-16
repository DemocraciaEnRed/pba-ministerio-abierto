import type { RegistrationFormKind } from '#shared/data/consultation-types'

export type AccreditationView = 'public' | 'admin'

/** Estado de la ventana de acreditación, derivado de las fechas y de `enabled`. */
export type AccreditationState = 'disabled' | 'scheduled' | 'open' | 'closed'

type AccreditationEntity = {
  id: number
  publicId: string
  enabled: boolean
  opensAt: Date
  closesAt: Date
  createdAt: Date
  updatedAt: Date
}

type AccreditationFormContext = {
  kind: RegistrationFormKind
  formTitle: string
  eventAt: Date
  venueName: string
  venueCity: string
  venueProvince: string
}

type AccreditationEntryEntity = {
  id: number
  dni: string
  firstName: string | null
  lastName: string | null
  email: string | null
  accreditedAt: Date
  registrationId: number | null
}

export interface PublicAccreditationDTO {
  publicId: string
  kind: RegistrationFormKind
  formTitle: string
  eventAt: string
  venueName: string
  venueCity: string
  venueProvince: string
  state: AccreditationState
}

export interface AdminAccreditationDTO {
  id: number
  publicId: string
  enabled: boolean
  opensAt: string
  closesAt: string
  state: AccreditationState
  entriesCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminAccreditationEntryDTO {
  id: number
  dni: string
  firstName: string | null
  lastName: string | null
  email: string | null
  accreditedAt: string
  registrationId: number | null
  linkedToRegistration: boolean
}

/**
 * Estado de la acreditación. `disabled` cuando se conserva como histórica (el QR
 * público queda inhabilitado); en caso contrario se deriva de la ventana.
 */
export function resolveAccreditationState(
  accreditation: { enabled: boolean, opensAt: Date, closesAt: Date },
  now: Date = new Date()
): AccreditationState {
  if (!accreditation.enabled) return 'disabled'
  if (now < accreditation.opensAt) return 'scheduled'
  if (now > accreditation.closesAt) return 'closed'
  return 'open'
}

export function serializeAccreditation(
  accreditation: AccreditationEntity,
  view: 'public',
  context: AccreditationFormContext & { now?: Date }
): PublicAccreditationDTO
export function serializeAccreditation(
  accreditation: AccreditationEntity,
  view: 'admin',
  context: { entriesCount?: number, now?: Date }
): AdminAccreditationDTO
export function serializeAccreditation(
  accreditation: AccreditationEntity,
  view: AccreditationView,
  context: (AccreditationFormContext & { now?: Date }) | { entriesCount?: number, now?: Date }
): PublicAccreditationDTO | AdminAccreditationDTO {
  const state = resolveAccreditationState(accreditation, context.now)

  if (view === 'public') {
    const formContext = context as AccreditationFormContext
    return {
      publicId: accreditation.publicId,
      kind: formContext.kind,
      formTitle: formContext.formTitle,
      eventAt: formContext.eventAt.toISOString(),
      venueName: formContext.venueName,
      venueCity: formContext.venueCity,
      venueProvince: formContext.venueProvince,
      state
    }
  }

  const adminContext = context as { entriesCount?: number }
  return {
    id: accreditation.id,
    publicId: accreditation.publicId,
    enabled: accreditation.enabled,
    opensAt: accreditation.opensAt.toISOString(),
    closesAt: accreditation.closesAt.toISOString(),
    state,
    entriesCount: adminContext.entriesCount ?? 0,
    createdAt: accreditation.createdAt.toISOString(),
    updatedAt: accreditation.updatedAt.toISOString()
  }
}

export function serializeAccreditationEntry(
  entry: AccreditationEntryEntity,
  _view: 'admin'
): AdminAccreditationEntryDTO {
  return {
    id: entry.id,
    dni: entry.dni,
    firstName: entry.firstName,
    lastName: entry.lastName,
    email: entry.email,
    accreditedAt: entry.accreditedAt.toISOString(),
    registrationId: entry.registrationId,
    linkedToRegistration: entry.registrationId !== null
  }
}
