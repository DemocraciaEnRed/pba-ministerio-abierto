import { renderTemplate } from './templates'
import { getMailTransport } from './transport'

export interface SendMailOptions {
  to: string
  subject: string
  /** Nombre del template nunjucks (sin extensión) en server/emails/templates. */
  template: string
  data?: Record<string, unknown>
}

const DEFAULT_PLATFORM_NAME = 'Consultas Ciudadanas'

/**
 * Datos de marca inyectados en todos los emails: nombre de la plataforma para el
 * encabezado, nombre de la institución para el pie y correo de contacto opcional.
 */
async function getBrandingData(): Promise<{ platformName: string, institutionName: string | null, contactEmail: string | null }> {
  const settings = await prisma.platformSettings.findFirst({
    select: { name: true, platformName: true, contactEmail: true },
    orderBy: { id: 'asc' }
  })

  return {
    platformName: settings?.platformName?.trim() || DEFAULT_PLATFORM_NAME,
    institutionName: settings?.name ?? null,
    contactEmail: settings?.contactEmail ?? null
  }
}

/**
 * Renderiza un template y envía el email mediante el transport configurado.
 * En modo stream (sin SMTP), loguea el contenido en lugar de enviarlo.
 */
export async function sendMail(options: SendMailOptions): Promise<void> {
  const config = useRuntimeConfig()
  const { transport, isStream } = getMailTransport()
  const branding = await getBrandingData()

  const html = await renderTemplate(options.template, {
    ...branding,
    ...options.data,
    appUrl: config.public.appUrl
  })

  const info = await transport.sendMail({
    from: config.mail.from,
    to: options.to,
    subject: options.subject,
    html
  })

  if (isStream) {
    console.info(
      `[mailer] (stream) email no enviado realmente\n  to: ${options.to}\n  subject: ${options.subject}\n  template: ${options.template}\n  message:\n${info.message}`
    )
  }
}
