import { createHash } from 'node:crypto'
import { buildConsultationRegistrationSchema } from '#shared/schemas/consultation-registrations'
import { VALIDATION_ERROR_MESSAGE } from '~~/server/utils/validate'
import { useStorageDriver } from '~~/server/utils/storage'
import { buildAssetStorageKey } from '~~/server/utils/assets/upload'
import {
  REGISTRATION_PROOF_MAX_SIZE_BYTES,
  isAllowedRegistrationProofMime
} from '~~/server/utils/assets/policy'
import { resolveRegistrationConsultation } from '~~/server/utils/consultations/registration-form'
import { resolveRegistrationState } from '~~/server/utils/serializers/consultationRegistrationForm'
import { sendRegistrationConfirmationEmail } from '~~/server/utils/mailer/messages'

interface MultipartPart {
  name?: string
  data?: Buffer
  filename?: string
  type?: string
}

interface ParsedProof {
  buffer: Buffer
  originalFilename: string
  mimeType: string
  sizeBytes: number
  checksum: string
}

/** Valida y arma el instrumento de personería opcional (PDF/Word/imagen ≤ 8 MB). */
function parseOptionalProof(parts: MultipartPart[]): ParsedProof | null {
  const filePart = parts.find(part => part.name === 'file' && part.data && part.filename)
  if (!filePart?.data) return null

  const mimeType = filePart.type?.trim()
  if (!mimeType || !isAllowedRegistrationProofMime(mimeType)) {
    throw createError({
      statusCode: 422,
      message: 'El archivo debe ser un PDF, un documento de Word (.doc/.docx) o una imagen (.jpg/.png).'
    })
  }

  const sizeBytes = filePart.data.length
  if (sizeBytes === 0) {
    throw createError({ statusCode: 422, message: 'El archivo está vacío.' })
  }
  if (sizeBytes > REGISTRATION_PROOF_MAX_SIZE_BYTES) {
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

// Inscripción pública (sin login): llega como multipart/form-data con una parte
// `payload` (JSON) y una parte `file` opcional. Si hay sesión activa se vincula
// la inscripción a la cuenta y se impide inscribirse dos veces.
export default defineEventHandler(async (event) => {
  const { consultationId, kind, slug, title: consultationTitle } = await resolveRegistrationConsultation(event)

  const form = await prisma.consultationRegistrationForm.findUnique({ where: { consultationId } })
  if (!form) {
    throw createError({ statusCode: 404, message: 'Esta consulta todavía no tiene formulario de inscripción' })
  }

  const registrationState = resolveRegistrationState(form)
  if (registrationState !== 'open') {
    throw createError({
      statusCode: 422,
      message: registrationState === 'scheduled'
        ? 'Las inscripciones todavía no están abiertas'
        : 'Las inscripciones ya están cerradas'
    })
  }

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

  const hasProofFile = Boolean(parts?.some(part => part.name === 'file' && part.data?.length && part.filename))

  const result = buildConsultationRegistrationSchema(kind).safeParse({
    ...(rawPayload as Record<string, unknown>),
    hasProofFile
  })

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
  // éxito genérico sin persistir, para no darle pistas.
  if (body.website && body.website.trim().length > 0) {
    setResponseStatus(event, 201)
    return { success: true }
  }

  const session = await getUserSession(event)
  const userId = session?.user?.id ?? null

  if (userId) {
    const alreadyRegistered = await prisma.consultationRegistration.findFirst({
      where: { formId: form.id, userId },
      select: { id: true }
    })
    if (alreadyRegistered) {
      throw createError({ statusCode: 409, message: 'Ya te inscribiste en esta instancia' })
    }
  }

  const isLegalEntity = body.character === 'legal_entity'
  const participationMode = kind === 'hearing' ? body.participationMode : null
  const isSpeaker = participationMode !== null && participationMode !== 'attendee'

  const proof = isLegalEntity ? parseOptionalProof(parts ?? []) : null

  const driver = useStorageDriver()
  let storageKey: string | null = null
  if (proof) {
    storageKey = buildAssetStorageKey('assets', proof.mimeType)
    // `public: false`: el instrumento solo se sirve por el endpoint protegido.
    await driver.put({
      key: storageKey,
      body: proof.buffer,
      contentType: proof.mimeType,
      public: false
    })
  }

  const questions = isSpeaker
    ? body.questions.map(question => question.trim()).filter(question => question.length > 0)
    : []

  await prisma.$transaction(async (tx) => {
    let proofAssetId: number | null = null

    if (proof && storageKey) {
      const asset = await tx.asset.create({
        data: {
          assetType: 'uploaded_file',
          mediaType: proof.mimeType.startsWith('image/') ? 'image' : 'document',
          storageProvider: driver.name,
          storagePath: storageKey,
          originalFilename: proof.originalFilename,
          mimeType: proof.mimeType,
          sizeBytes: proof.sizeBytes,
          checksum: proof.checksum
        }
      })
      proofAssetId = asset.id
    }

    await tx.consultationRegistration.create({
      data: {
        formId: form.id,
        userId,
        firstName: body.firstName,
        lastName: body.lastName,
        dni: body.dni,
        email: body.email,
        phone: body.phone,
        character: body.character,
        // Los datos de la persona jurídica solo se guardan si se declaró una.
        entityName: isLegalEntity ? body.entityName : null,
        entityAddress: isLegalEntity ? body.entityAddress : null,
        entityEmail: isLegalEntity ? body.entityEmail : null,
        entityPhone: isLegalEntity ? body.entityPhone : null,
        proofAssetId,
        proofUrl: isLegalEntity ? body.proofUrl : null,
        participationMode,
        presentationSummary: isSpeaker ? body.presentationSummary : null,
        documentationDetail: isSpeaker ? body.documentationDetail : null,
        questions: {
          create: questions.map((question, index) => ({ body: question, displayOrder: index }))
        }
      }
    })
  })

  try {
    await sendRegistrationConfirmationEmail(body.email, {
      displayName: `${body.firstName} ${body.lastName}`,
      consultationTitle,
      consultationUrl: `/consultas/${slug}`,
      formTitle: form.title,
      eventAt: form.eventAt,
      venueName: form.venueName,
      venueAddress: form.venueAddress,
      venueCity: form.venueCity,
      venueProvince: form.venueProvince,
      participationMode,
      isLegalEntity
    })
  } catch (error) {
    console.error('[registrations] email failed:', error)
  }

  setResponseStatus(event, 201)
  return { success: true }
})
