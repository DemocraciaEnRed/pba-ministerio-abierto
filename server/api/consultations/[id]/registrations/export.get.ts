import {
  REGISTRATION_CHARACTER_LABELS,
  REGISTRATION_PARTICIPATION_MODE_LABELS
} from '#shared/data/consultation-registrations'
import { resolveRegistrationConsultation } from '~~/server/utils/consultations/registration-form'

// Exportación CSV de las inscripciones: solo para quien administra la consulta.
// Se genera a mano (sin dependencias) con comillas escapadas y BOM UTF-8 para
// que Excel respete los acentos. Devuelve TODAS las inscripciones (no paginado).

/** Escapa un valor para CSV: comillas dobles, con las internas duplicadas. */
function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

const CSV_HEADERS = [
  'ID',
  'Nombre',
  'Apellido',
  'DNI',
  'Email',
  'Teléfono',
  'Carácter',
  'Razón social',
  'Domicilio',
  'Email de la persona jurídica',
  'Teléfono de la persona jurídica',
  'Instrumento (archivo)',
  'Instrumento (enlace)',
  'Forma de participación',
  'Descripción de la exposición',
  'Documentación acompañada',
  'Preguntas',
  'Fecha de inscripción'
]

export default defineEventHandler(async (event) => {
  const { consultationId, slug } = await resolveRegistrationConsultation(event)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  const form = await prisma.consultationRegistrationForm.findUnique({
    where: { consultationId },
    select: { id: true }
  })

  if (!form) {
    throw createError({ statusCode: 404, message: 'Esta consulta todavía no tiene formulario de inscripción' })
  }

  const registrations = await prisma.consultationRegistration.findMany({
    where: { formId: form.id },
    orderBy: { createdAt: 'desc' },
    include: {
      questions: { orderBy: { displayOrder: 'asc' } },
      proofAsset: { select: { originalFilename: true } }
    }
  })

  const dateFormatter = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires'
  })

  const rows = registrations.map(registration => [
    registration.id,
    registration.firstName,
    registration.lastName,
    registration.dni,
    registration.email,
    registration.phone,
    REGISTRATION_CHARACTER_LABELS[registration.character],
    registration.entityName ?? '',
    registration.entityAddress ?? '',
    registration.entityEmail ?? '',
    registration.entityPhone ?? '',
    registration.proofAsset?.originalFilename ?? '',
    registration.proofUrl ?? '',
    registration.participationMode ? REGISTRATION_PARTICIPATION_MODE_LABELS[registration.participationMode] : '',
    registration.presentationSummary ?? '',
    registration.documentationDetail ?? '',
    registration.questions.map(question => question.body).join(' | '),
    dateFormatter.format(registration.createdAt)
  ]
    .map(csvCell)
    .join(','))

  const csv = [CSV_HEADERS.map(csvCell).join(','), ...rows].join('\r\n')
  // BOM UTF-8 para que Excel interprete bien los acentos.
  const body = `\uFEFF${csv}`

  const today = new Date().toISOString().slice(0, 10)
  setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="inscripciones-${slug}-${today}.csv"`)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return body
})
