import { sendMail } from './send'

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
