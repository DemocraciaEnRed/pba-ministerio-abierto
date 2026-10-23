import {
  REGISTRATION_CHARACTER_LABELS,
  REGISTRATION_PARTICIPATION_MODE_LABELS,
  REGISTRATION_ATTENDANCE_MODE_LABELS,
  REGISTRATION_INSTITUTION_SOURCE_LABELS
} from '#shared/data/consultation-registrations'
import { consultationTypeRegistrationKind } from '#shared/data/consultation-types'
import { exportCursorWhere, iterateExportBatchesById } from '../batches'
import { formatExportDate, type CsvValue } from '../csv'
import { defineDataExport } from '../types'

/**
 * Consulta con formulario de inscripción. Lanza 404 si la consulta no existe o
 * no tiene formulario y 422 si su tipo no admite inscripción.
 */
async function loadRegistrationExportConsultation(consultationId: number | null) {
  const consultation = consultationId === null
    ? null
    : await prisma.consultation.findUnique({
        where: { id: consultationId },
        select: {
          id: true,
          slug: true,
          title: true,
          section: { select: { slug: true } },
          registrationForm: { select: { id: true, accreditation: { select: { id: true } } } }
        }
      })

  if (!consultation) {
    throw createError({ statusCode: 404, message: 'Consulta no encontrada' })
  }
  if (!consultationTypeRegistrationKind(consultation.section?.slug)) {
    throw createError({ statusCode: 422, message: 'Este tipo de consulta no admite formulario de inscripción' })
  }
  return consultation
}

/** Inscripciones de una consulta (todas, sin filtros). */
export const consultationRegistrationsExport = defineDataExport<Record<string, never>>({
  kind: 'consultation_registrations',
  scope: 'consultation',
  headers: [
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
    'Fecha de inscripción',
    'Modalidad de asistencia',
    'Origen institucional',
    'ID de institución',
    'Institución',
    'Categoría de institución'
  ],

  async describe({ consultationId }) {
    const consultation = await loadRegistrationExportConsultation(consultationId)
    if (!consultation.registrationForm) {
      throw createError({ statusCode: 404, message: 'Esta consulta todavía no tiene formulario de inscripción' })
    }
    return {
      title: `Inscripciones · ${consultation.title}`,
      filenameBase: `inscripciones-${consultation.slug}`,
      filters: {}
    }
  },

  async* rows({ consultationId }, batchSize) {
    const consultation = await loadRegistrationExportConsultation(consultationId)
    const formId = consultation.registrationForm?.id
    if (formId === undefined) return

    const batches = iterateExportBatchesById(
      (cursor, take) => prisma.consultationRegistration.findMany({
        where: { formId, ...exportCursorWhere(cursor) },
        orderBy: { id: 'desc' },
        include: {
          questions: { orderBy: { displayOrder: 'asc' } },
          proofAsset: { select: { originalFilename: true } }
        },
        take
      }),
      batchSize
    )

    for await (const batch of batches) {
      yield batch.map((registration): CsvValue[] => [
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
        formatExportDate(registration.createdAt),
        registration.attendanceMode ? REGISTRATION_ATTENDANCE_MODE_LABELS[registration.attendanceMode] : '',
        registration.institutionSource ? REGISTRATION_INSTITUTION_SOURCE_LABELS[registration.institutionSource] : '',
        registration.institutionId ?? '',
        registration.institutionName ?? '',
        registration.institutionCategoryName ?? ''
      ])
    }
  }
})

/** Ingresos de acreditación de una consulta (todos, sin filtros). */
export const consultationAccreditationsExport = defineDataExport<Record<string, never>>({
  kind: 'consultation_accreditations',
  scope: 'consultation',
  headers: [
    'ID',
    'DNI',
    'Nombre',
    'Apellido',
    'Email',
    'Vinculado a inscripción',
    'Fecha de acreditación'
  ],

  async describe({ consultationId }) {
    const consultation = await loadRegistrationExportConsultation(consultationId)
    if (!consultation.registrationForm?.accreditation) {
      throw createError({ statusCode: 404, message: 'Esta consulta todavía no tiene acreditación habilitada' })
    }
    return {
      title: `Acreditaciones · ${consultation.title}`,
      filenameBase: `acreditaciones-${consultation.slug}`,
      filters: {}
    }
  },

  async* rows({ consultationId }, batchSize) {
    const consultation = await loadRegistrationExportConsultation(consultationId)
    const accreditationId = consultation.registrationForm?.accreditation?.id
    if (accreditationId === undefined) return

    const batches = iterateExportBatchesById(
      (cursor, take) => prisma.accreditationEntry.findMany({
        where: { accreditationId, ...exportCursorWhere(cursor) },
        orderBy: { id: 'desc' },
        take
      }),
      batchSize
    )

    for await (const batch of batches) {
      yield batch.map((entry): CsvValue[] => [
        entry.id,
        entry.dni,
        entry.firstName ?? '',
        entry.lastName ?? '',
        entry.email ?? '',
        entry.registrationId !== null ? 'Sí' : 'No',
        formatExportDate(entry.accreditedAt)
      ])
    }
  }
})
