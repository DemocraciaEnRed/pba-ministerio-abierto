import { CreateRegionalMeetingSubmissionSchema } from '#shared/schemas/regional-meetings'
import { VALIDATION_ERROR_MESSAGE } from '~~/server/utils/validate'
import {
  buildAttachmentCreates,
  parseUploadAttachments,
  withStoredAttachments,
  type UploadMultipartPart
} from '~~/server/utils/assets/multi-attachments'

// Envío público (sin login): cualquier persona puede sumar un aporte al Plan
// Estratégico de Infraestructura. Llega como multipart/form-data con una parte
// `payload` (JSON con los campos) y hasta 3 partes `files` opcionales
// (documentos o imágenes, 30 MB en total). La respuesta es genérica; la lectura
// de los aportes es exclusiva de platform-admin.
export default defineEventHandler(async (event) => {
  const parts = (await readMultipartFormData(event)) as UploadMultipartPart[] | null

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

  const attachments = parseUploadAttachments(parts)

  await withStoredAttachments(attachments, stored => prisma.regionalMeetingSubmission.create({
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
      attachments: { create: buildAttachmentCreates(stored) },
      links: {
        create: body.enlaces.map(link => ({ url: link.url, title: link.title }))
      }
    }
  }))

  setResponseStatus(event, 201)
  return { success: true }
})
