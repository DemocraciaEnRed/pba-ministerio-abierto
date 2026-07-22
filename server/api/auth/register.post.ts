import { RegisterSchema } from '#shared/schemas/auth'
import { BUENOS_AIRES } from '#shared/data/argentina'
import { createVerificationToken } from '~~/server/utils/auth/tokens'
import { sendVerificationEmail, sendExistingAccountEmail } from '~~/server/utils/mailer/messages'

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: string }).code === 'P2002'
  )
}

// Respuesta genérica e idéntica exista o no el email, para no filtrar
// la existencia de cuentas (ver docs/rutas-backend-entity-driven.md).
const genericResponse = {
  ok: true,
  message: 'Si el correo es válido, te enviamos un email para continuar.'
}

async function notifyExistingAccount(email: string) {
  try {
    await sendExistingAccountEmail(email)
  } catch (error) {
    console.error('[register] no se pudo enviar el email de cuenta existente:', error)
  }
}

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, RegisterSchema)

  const existing = await prisma.user.findUnique({ where: { email: body.email } })
  if (existing) {
    await notifyExistingAccount(body.email)
    setResponseStatus(event, 202)
    return genericResponse
  }

  const passwordHash = await hashPassword(body.password)

  // El nombre para mostrar se autogenera a partir de nombre y apellido.
  const displayName = `${body.firstName} ${body.lastName}`.trim().slice(0, 100)

  let user
  try {
    user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        firstName: body.firstName,
        lastName: body.lastName,
        displayName,
        provincia: body.provincia,
        // El municipio solo se guarda para la provincia de Buenos Aires.
        municipio: body.provincia === BUENOS_AIRES ? body.municipio : null,
        phone: body.phone,
        organization: body.representsInstitution ? body.organization : null
      }
    })
  } catch (error) {
    // Insert concurrente que ganó la carrera: tratamos como cuenta existente.
    if (isUniqueConstraintError(error)) {
      await notifyExistingAccount(body.email)
      setResponseStatus(event, 202)
      return genericResponse
    }
    throw error
  }

  const { token } = await createVerificationToken(user.id, 'email_verification')
  try {
    await sendVerificationEmail(user.email, token, user.displayName)
  } catch (error) {
    // El usuario quedó creado pero el email falló; podrá reenviarlo más tarde.
    console.error('[register] no se pudo enviar el email de verificación:', error)
  }

  setResponseStatus(event, 202)
  return genericResponse
})
