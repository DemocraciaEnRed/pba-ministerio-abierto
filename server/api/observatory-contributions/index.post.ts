import { createHash } from 'node:crypto'
import { CreateObservatoryContributionSchema } from '#shared/schemas/observatory'
import { isContributionWorkGroupSlug } from '#shared/data/observatory-work-groups'
import { VALIDATION_ERROR_MESSAGE } from '~~/server/utils/validate'
import { useStorageDriver } from '~~/server/utils/storage'
import { buildAssetStorageKey } from '~~/server/utils/assets/upload'
import {
  SUBMISSION_ATTACHMENT_MAX_SIZE_BYTES,
  isAllowedSubmissionAttachmentMime
} from '~~/server/utils/assets/policy'

interface MultipartPart {
  name?: string
  data?: Buffer
  filename?: string
  type?: string
}

interface ParsedAttachment {
  buffer: Buffer
  originalFilename: string
  mimeType: string
  sizeBytes: number
  checksum: string
}

/** Valida y arma el adjunto opcional (PDF/Word ≤ 8 MB) desde el multipart. */
function parseOptionalAttachment(parts: MultipartPart[]): ParsedAttachment | null {
  const filePart = parts.find(part => part.name === 'file' && part.data && part.filename)
  if (!filePart?.data) return null

  const mimeType = filePart.type?.trim()
  if (!mimeType || !isAllowedSubmissionAttachmentMime(mimeType)) {
    throw createError({
      statusCode: 422,
      message: 'El archivo debe ser un PDF o un documento de Word (.doc/.docx).'
    })
  }

  const sizeBytes = filePart.data.length
  if (sizeBytes === 0) {
    throw createError({ statusCode: 422, message: 'El archivo está vacío.' })
  }
  if (sizeBytes > SUBMISSION_ATTACHMENT_MAX_SIZE_BYTES) {
    throw createError({ statusCode: 422, message: 'El archivo supera el máximo permitido de 8 MB.' })
  }

  return {
    buffer: filePart.data,
    originalFilename: filePart.filename ?? 'archivo',
    mimeType,
    sizeBytes,
    checksum: createHash('sha256').update(filePart.data).digest('hex')
  }
}

// Envío público (sin login) del formulario de aportes institucionales del
// Observatorio. Llega como multipart/form-data con una parte `payload` (JSON) y
// una parte `file` opcional (PDF/Word). La respuesta es genérica; la lectura de
// los aportes es exclusiva de platform-admin.
export default defineEventHandler(async (event) => {
  const parts = (await readMultipartFormData(event)) as MultipartPart[] | null

  const payloadPart = parts?.find(part => part.name === 'payload')
  if (!payloadPart?.data) {
    throw createError({ statusCode: 422, message: 'No se recibieron los datos del formulario.' })
  }

  let rawPayload: unknown
  try {
    rawPayload = JSON.parse(payloadPart.data.toString('utf8'))
  } catch {
    throw createError({ statusCode: 422, message: 'Los datos del formulario no son válidos.' })
  }

  const result = CreateObservatoryContributionSchema.safeParse(rawPayload)
  if (!result.success) {
    throw createError({
      statusCode: 422,
      message: VALIDATION_ERROR_MESSAGE,
      data: result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    })
  }

  const body = result.data

  // Honeypot: si el campo trampa viene completo asumimos un bot. Respondemos con
  // éxito genérico sin persistir (ni guardar archivo), para no darle pistas.
  if (body.website && body.website.trim().length > 0) {
    setResponseStatus(event, 201)
    return { success: true }
  }

  // Las reuniones plenarias no reciben aportes: no alcanza con ocultarlas en el
  // formulario, se verifica también acá contra cada eje elegido.
  const workGroupIds = Array.from(new Set(body.workGroupIds))
  if (workGroupIds.length !== body.workGroupIds.length) {
    throw createError({ statusCode: 422, message: 'No repitas ejes de trabajo.' })
  }

  const workGroups = await prisma.observatoryWorkGroup.findMany({
    where: { id: { in: workGroupIds }, isActive: true },
    select: { id: true, slug: true }
  })

  const allEligible = workGroups.length === workGroupIds.length
    && workGroups.every(group => isContributionWorkGroupSlug(group.slug))
  if (!allEligible) {
    throw createError({ statusCode: 422, message: 'Elegí ejes de trabajo válidos.' })
  }

  // El aporte guarda el nombre de la institución y su categoría tal como están
  // ahora: si después se editan o se dan de baja, el historial no cambia.
  const institution = await prisma.observatoryInstitution.findFirst({
    where: { id: body.institutionId, isActive: true, category: { isActive: true } },
    select: { id: true, name: true, category: { select: { name: true } } }
  })

  if (!institution) {
    throw createError({ statusCode: 422, message: 'Elegí una institución válida.' })
  }

  const attachment = parseOptionalAttachment(parts ?? [])

  // `hasAttachment` es solo una ayuda para validar en el formulario: acá se
  // controla contra el archivo realmente recibido.
  if (!body.description && !attachment && body.enlaces.length === 0) {
    throw createError({
      statusCode: 422,
      message: VALIDATION_ERROR_MESSAGE,
      data: [{ field: 'description', message: 'Describí tu aporte o adjuntá un archivo o enlace' }]
    })
  }

  const driver = useStorageDriver()
  let storageKey: string | null = null
  if (attachment) {
    storageKey = buildAssetStorageKey('assets', attachment.mimeType)
    // `public: false` para que en S3 no haya URL pública: el adjunto solo se
    // sirve por el endpoint protegido de admin.
    await driver.put({
      key: storageKey,
      body: attachment.buffer,
      contentType: attachment.mimeType,
      public: false
    })
  }

  await prisma.$transaction(async (tx) => {
    let attachmentAssetId: number | null = null

    if (attachment && storageKey) {
      const asset = await tx.asset.create({
        data: {
          assetType: 'uploaded_file',
          mediaType: 'document',
          storageProvider: driver.name,
          storagePath: storageKey,
          originalFilename: attachment.originalFilename,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
          checksum: attachment.checksum
        }
      })
      attachmentAssetId = asset.id
    }

    await tx.observatoryContribution.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        provincia: body.provincia,
        municipio: body.municipio,
        institutionId: institution.id,
        institutionName: institution.name,
        institutionCategoryName: institution.category.name,
        description: body.description,
        attachmentAssetId,
        workGroupAssignments: {
          create: workGroupIds.map(workGroupId => ({ workGroupId }))
        },
        links: {
          create: body.enlaces.map(link => ({ url: link.url, title: link.title }))
        }
      }
    })
  })

  setResponseStatus(event, 201)
  return { success: true }
})
