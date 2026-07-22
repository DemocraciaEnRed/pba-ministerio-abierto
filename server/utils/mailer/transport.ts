import nodemailer, { type Transporter } from 'nodemailer'

let cachedTransport: Transporter | null = null

/**
 * Devuelve un transport de nodemailer construido desde runtimeConfig.
 *
 * Si no hay host SMTP configurado (o `mail.transport` !== 'smtp'), usa un
 * transport JSON que no envía nada: los mensajes se loguean a consola.
 * Esto permite desarrollar el flujo de emails sin un servidor SMTP real.
 */
export function getMailTransport(): { transport: Transporter, isStream: boolean } {
  const config = useRuntimeConfig()
  const mail = config.mail

  if (cachedTransport) {
    return { transport: cachedTransport, isStream: mail.transport !== 'smtp' || !mail.host }
  }

  const useSmtp = mail.transport === 'smtp' && !!mail.host

  if (useSmtp) {
    cachedTransport = nodemailer.createTransport({
      host: mail.host,
      port: Number(mail.port || 587),
      secure: mail.secure === 'true' || Number(mail.port) === 465,
      auth: mail.user
        ? { user: mail.user, pass: mail.password }
        : undefined
    })
    return { transport: cachedTransport, isStream: false }
  }

  cachedTransport = nodemailer.createTransport({ jsonTransport: true })
  return { transport: cachedTransport, isStream: true }
}
