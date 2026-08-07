import type { RegistrationFormKind } from '#shared/data/consultation-types'

export const REGISTRATION_CHARACTER_LABELS = {
  individual: 'Particular interesado (persona humana)',
  legal_entity: 'Representante de Persona Jurídica'
} as const

export const REGISTRATION_PARTICIPATION_MODE_LABELS = {
  attendee: 'Asistente (sin uso de la palabra)',
  speaker_request: 'Expositor/a (solicita uso de la palabra)',
  speaker_report: 'Expositor/a (presenta informe)'
} as const

/** Nombre de la instancia según el tipo de consulta, para los textos de la UI. */
export function registrationEventNoun(kind: RegistrationFormKind): string {
  return kind === 'hearing' ? 'audiencia pública' : 'consulta pública'
}

export const REGISTRATION_PRIVACY_NOTICE
  = 'Los datos personales recopilados mediante este formulario tienen como única finalidad organizar '
    + 'la participación y establecer el orden del día de manera eficiente. Usted tiene derecho a acceder, '
    + 'rectificar, actualizar y suprimir sus datos, así como a oponerse a su tratamiento, mediante '
    + 'comunicación a mesadeayuda@minfra.gba.gob.ar. El consentimiento es voluntario, y al continuar, '
    + 'usted consiente el tratamiento de sus datos conforme a la Ley 25.326 y normativa aplicable.'

export const REGISTRATION_PRIVACY_CONTACT_EMAIL = 'mesadeayuda@minfra.gba.gob.ar'
