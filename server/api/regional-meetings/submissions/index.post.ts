import { createHash } from 'node:crypto'
import { CreateRegionalMeetingSubmissionSchema } from '#shared/schemas/regional-meetings'
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

// Envío público (sin login): cualquier persona puede sumar un aporte al Plan
// Estratégico de Infraestructura. Llega como multipart/form-data con una parte
// `payload` (JSON con los campos) y una parte `file` opcional (PDF/Word). La
// respuesta es genérica; la lectura de los aportes es exclusiva de platform-admin.
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

  const result = CreateRegionalMeetingSubmissionSchema.safeParse(rawPayload)
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

  const attachment = parseOptionalAttachment(parts ?? [])

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

    await tx.regionalMeetingSubmission.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        provincia: body.provincia,
        municipio: body.municipio,
        // La institución solo se guarda si la persona declaró representar una.
        organization: body.representsInstitution ? body.organization : null,
        ejeTematico: body.ejeTematico,
        subejeTematico: body.subejeTematico,
        ideaProyecto: body.ideaProyecto,
        comentarios: body.comentarios,
        attachmentAssetId,
        links: {
          create: body.enlaces.map(link => ({ url: link.url, title: link.title }))
        }
      }
    })
  })

  setResponseStatus(event, 201)
  return { success: true }
})
