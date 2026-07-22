import type { UserStatus } from '../../../prisma/generated/enums'
import type { AuthContext, ResolvedUser } from './context'

export type ResourceDescriptor
  = | { type: 'self' }
    | { type: 'platform' }
    | { type: 'consultation', id: number }

export type AuthAction
  = | 'read'
    | 'update'
    | 'delete'
    | 'manage'
    | 'publish'
    | 'moderate'
    | 'participate'
    | 'change-password'
    | 'change-email'

/**
 * Lanza un error si la cuenta no está activa (suspendida o inactiva).
 * Reutilizable desde login, donde aún no hay un AuthContext construido.
 */
export function assertUserActive(status: UserStatus): void {
  if (status === 'suspended') {
    throw createError({ statusCode: 403, message: 'Account suspended' })
  }
  if (status === 'inactive') {
    throw createError({ statusCode: 403, message: 'Account inactive' })
  }
}

/**
 * Verifica si el contexto de auth permite la acción sobre el recurso.
 * Lanza 401 si no hay sesión cuando se requiere, 403 si hay sesión pero sin permiso.
 *
 * La `action` diferencia el resultado para acciones no-CRUD sobre consultas:
 * `participate` habilita a cualquier ciudadano con cuenta activa (no requiere
 * membresía administrativa), mientras que el resto de acciones sobre una
 * consulta exigen ser miembro administrador o administrador de plataforma.
 */
export async function assertCan(
  ctx: AuthContext,
  action: AuthAction,
  resource: ResourceDescriptor
): Promise<void> {
  const { user, isPlatformAdmin } = ctx

  if (resource.type === 'self') {
    requireUser(user)
    assertUserActive(user!.status)
    return
  }

  if (resource.type === 'platform') {
    requireUser(user)
    if (!isPlatformAdmin) {
      throw createError({ statusCode: 403, message: 'Forbidden' })
    }
    return
  }

  if (resource.type === 'consultation') {
    requireUser(user)
    assertUserActive(user!.status)

    // Participar solo requiere una cuenta activa (cualquier ciudadano),
    // no membresía administrativa sobre la consulta.
    if (action === 'participate') {
      return
    }

    const isMember = await ctx.isConsultationAdmin(resource.id)
    if (!isMember && !isPlatformAdmin) {
      throw createError({ statusCode: 403, message: 'Forbidden' })
    }
    return
  }

  throw createError({ statusCode: 403, message: 'Forbidden' })
}

function requireUser(user: ResolvedUser | null): asserts user is ResolvedUser {
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }
}
