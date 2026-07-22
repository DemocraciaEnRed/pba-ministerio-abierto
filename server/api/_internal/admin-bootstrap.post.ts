import { createHash, timingSafeEqual } from 'node:crypto'
import { BootstrapAdminSchema } from '#shared/schemas/admin'

// Compara dos secretos en tiempo constante. Se hashean primero para que la
// comparación opere siempre sobre buffers de igual longitud y no filtre la
// longitud del secreto configurado.
function secretsMatch(provided: string, configured: string): boolean {
  const a = createHash('sha256').update(provided).digest()
  const b = createHash('sha256').update(configured).digest()
  return timingSafeEqual(a, b)
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: string }).code === 'P2002'
  )
}

// Endpoint oculto para crear el primer administrador (o un colaborador) sin
// depender de seeds. Ante secreto ausente/incorrecto responde 404, como si la
// ruta no existiera. El usuario se crea ya validado (emailVerifiedAt seteado).
export default defineEventHandler(async (event) => {
  const notFound = () => createError({ statusCode: 404, statusMessage: 'Not Found' })

  const configuredSecret = useRuntimeConfig().adminBootstrapSecret
  if (!configuredSecret) {
    throw notFound()
  }

  // Leemos el secreto crudo ANTES de validar para no revelar (vía 422) que la
  // ruta existe cuando el secreto es incorrecto.
  const raw = await readBody<Record<string, unknown> | null>(event).catch(() => null)
  const providedSecret = typeof raw?.secret === 'string' ? raw.secret : ''
  if (!secretsMatch(providedSecret, configuredSecret)) {
    throw notFound()
  }

  // Secreto correcto: a partir de acá sí devolvemos errores de validación.
  const body = await parseBody(event, BootstrapAdminSchema)

  const passwordHash = await hashPassword(body.password)
  const displayName = `${body.firstName} ${body.lastName}`.trim().slice(0, 100)

  try {
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        firstName: body.firstName,
        lastName: body.lastName,
        displayName,
        emailVerifiedAt: new Date(),
        platformRoleAssignments: {
          create: { role: body.role }
        }
      }
    })

    setResponseStatus(event, 200)
    return { ok: true, id: user.id, email: user.email, role: body.role }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw createError({ statusCode: 409, message: 'Ya existe una cuenta con ese correo' })
    }
    throw error
  }
})
