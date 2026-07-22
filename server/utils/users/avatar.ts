import type { ResolvedUser } from '../auth/context'
import { resolveAssetAccessUrl } from '../assets/url'
import { useStorageDriver } from '../storage'

/**
 * Resuelve la URL pública del avatar de un usuario (o `null` si no tiene).
 *
 * Es asíncrono porque el driver de storage puede necesitar firmar la URL
 * (s3 presignado); por eso se resuelve en el handler y se pasa al serializer,
 * que es síncrono.
 */
export async function resolveUserAvatarUrl(user: ResolvedUser): Promise<string | null> {
  if (!user.avatarAsset) return null
  const driver = useStorageDriver()
  return resolveAssetAccessUrl(user.avatarAsset, driver)
}
