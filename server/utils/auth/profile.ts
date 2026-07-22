import type { ResolvedUser } from './context'

/**
 * Determina si un usuario puede editar libremente su "nombre para mostrar".
 *
 * Se habilita para administradores de plataforma y para colaboradores (rol
 * `collaborator`: ciudadanos de confianza elegibles para ser designados
 * admin/moderador de consultas). Para el resto de los ciudadanos el
 * `displayName` se deriva de nombre + apellido.
 */
export function canEditDisplayName(user: ResolvedUser): boolean {
  return user.platformRoles.includes('platform_admin')
    || user.platformRoles.includes('collaborator')
}
