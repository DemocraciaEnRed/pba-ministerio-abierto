import { sendMail } from './send'
import type {
  RegistrationParticipantCharacter,
  RegistrationParticipationMode
} from '../../../prisma/generated/enums'
import {
  REGISTRATION_CHARACTER_LABELS,
  REGISTRATION_PARTICIPATION_MODE_LABELS,
  REGISTRATION_PRIVACY_NOTICE
} from '#shared/data/consultation-registrations'

/** Construye la URL pública de verificación de email a partir del token crudo. */
function buildVerificationUrl(token: string): string {
  const config = useRuntimeConfig()
  const base = config.public.appUrl.replace(/\/$/, '')
  return `${base}/auth/verify-email?token=${encodeURIComponent(token)}`
}

/** Construye la URL pública de restablecimiento de contraseña a partir del token crudo. */
function buildPasswordResetUrl(token: string): string {
  const config = useRuntimeConfig()
  const base = config.public.appUrl.replace(/\/$/, '')
  return `${base}/auth/reset-password?token=${encodeURIComponent(token)}`
}

/** Construye la URL pública de confirmación de cambio de email a partir del token crudo. */
function buildEmailChangeUrl(token: string): string {
  const config = useRuntimeConfig()
  const base = config.public.appUrl.replace(/\/$/, '')
  return `${base}/auth/change-email?token=${encodeURIComponent(token)}`
}

/** Email de verificación enviado a una cuenta recién creada. */
export async function sendVerificationEmail(to: string, token: string, displayName?: string | null) {
  await sendMail({
    to,
    subject: 'Verificá tu correo electrónico',
    template: 'verify-email',
    data: {
      displayName: displayName || null,
      verificationUrl: buildVerificationUrl(token)
    }
  })
}

/**
 * Email enviado cuando alguien intenta registrarse con un email que ya tiene
 * cuenta. Evita filtrar la existencia del email en la respuesta HTTP.
 */
export async function sendExistingAccountEmail(to: string) {
  const config = useRuntimeConfig()
  const base = config.public.appUrl.replace(/\/$/, '')
  await sendMail({
    to,
    subject: 'Ya tenés una cuenta',
    template: 'existing-account',
    data: {
      loginUrl: `${base}/auth/login`,
      recoverUrl: `${base}/auth/recover-password`
    }
  })
}

/** Email con el enlace para restablecer la contraseña. */
export async function sendPasswordResetEmail(to: string, token: string, displayName?: string | null) {
  await sendMail({
    to,
    subject: 'Restablecé tu contraseña',
    template: 'reset-password',
    data: {
      displayName: displayName || null,
      resetUrl: buildPasswordResetUrl(token)
    }
  })
}

/** Email de confirmación enviado a la nueva dirección para completar un cambio de correo. */
export async function sendEmailChangeVerification(to: string, token: string, displayName?: string | null) {
  await sendMail({
    to,
    subject: 'Confirmá tu nuevo correo electrónico',
    template: 'change-email',
    data: {
      displayName: displayName || null,
      changeEmailUrl: buildEmailChangeUrl(token)
    }
  })
}

export interface RegistrationConfirmationData {
  displayName: string
  consultationTitle: string
  /** Ruta relativa de la consulta; se completa con `appUrl`. */
  consultationUrl: string
  formTitle: string
  eventAt: Date
  venueName: string
  venueAddress: string
  venueCity: string
  venueProvince: string
  participationMode: RegistrationParticipationMode | null
  isLegalEntity: boolean
}

/** Email de confirmación de inscripción a una audiencia o consulta pública. */
export async function sendRegistrationConfirmationEmail(to: string, data: RegistrationConfirmationData) {
  const config = useRuntimeConfig()
  const base = config.public.appUrl.replace(/\/$/, '')

  const eventAt = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires'
  }).format(data.eventAt)

  const character: RegistrationParticipantCharacter = data.isLegalEntity ? 'legal_entity' : 'individual'

  await sendMail({
    to,
    subject: `Confirmamos tu inscripción: ${data.formTitle}`,
    template: 'registration-confirmation',
    data: {
      displayName: data.displayName,
      consultationTitle: data.consultationTitle,
      consultationUrl: `${base}${data.consultationUrl}`,
      formTitle: data.formTitle,
      eventAt,
      venue: `${data.venueName} — ${data.venueAddress}, ${data.venueCity}, ${data.venueProvince}`,
      characterLabel: REGISTRATION_CHARACTER_LABELS[character],
      participationModeLabel: data.participationMode
        ? REGISTRATION_PARTICIPATION_MODE_LABELS[data.participationMode]
        : null,
      privacyNotice: REGISTRATION_PRIVACY_NOTICE
    }
  })
}
