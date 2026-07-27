import { serializeAsset } from '~~/server/utils/serializers/asset'
import { useStorageDriver } from '~~/server/utils/storage'
import { buildAssetStorageKey, parseUploadedAssetFromMultipart } from '~~/server/utils/assets/upload'
import { resolveAssetAccessUrl } from '~~/server/utils/assets/url'

/**
 * Subida de imágenes inline para el editor de texto enriquecido.
 *
 * A diferencia de `POST /api/assets` (que exige permiso de plataforma), este
 * endpoint habilita también a las personas colaboradoras: cualquiera que pueda
 * editar contenido de consultas/temas. No se acota a una entidad concreta
 * porque la subida puede ocurrir mientras se crea una consulta/tema (sin id
 * todavía). Crea un asset "pelado" (sin AssetLink) y devuelve su URL pública
 * para insertarla como `![](url)` en el markdown.
 */
export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)

  if (!ctx.user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }
  assertUserActive(ctx.user.status)

  const isCollaborator = ctx.user.platformRoles.includes('collaborator')
  if (!ctx.isPlatformAdmin && !isCollaborator) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const parsedUpload = await parseUploadedAssetFromMultipart(event, { imageOnly: true })
  const driver = useStorageDriver()
  const storageKey = buildAssetStorageKey('assets', parsedUpload.mimeType)

  await driver.put({
    key: storageKey,
    body: parsedUpload.buffer,
    contentType: parsedUpload.mimeType
  })

  const created = await prisma.asset.create({
    data: {
      title: parsedUpload.title,
      description: parsedUpload.description,
      altText: parsedUpload.altText,
      assetType: 'uploaded_file',
      mediaType: 'image',
      storageProvider: driver.name,
      storagePath: storageKey,
      externalUrl: null,
      originalFilename: parsedUpload.originalFilename,
      mimeType: parsedUpload.mimeType,
      sizeBytes: parsedUpload.sizeBytes,
      checksum: parsedUpload.checksum,
      uploadedByUserId: ctx.user.id
    }
  })

  const accessUrl = await resolveAssetAccessUrl(created, driver)
  setResponseStatus(event, 201)
  return serializeAsset({ ...created, accessUrl }, 'admin')
})
