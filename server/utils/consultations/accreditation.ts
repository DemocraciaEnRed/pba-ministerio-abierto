import { randomBytes } from 'node:crypto'

const PUBLIC_ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const PUBLIC_ID_LENGTH = 8
// Mayor múltiplo de 36 por debajo de 256: descartamos bytes superiores para
// evitar el sesgo del módulo y repartir los 36 símbolos de forma uniforme.
const UNBIASED_CEILING = Math.floor(256 / PUBLIC_ID_ALPHABET.length) * PUBLIC_ID_ALPHABET.length

/** Token público corto: 8 caracteres alfanuméricos en minúsculas, sin sesgo. */
export function generateAccreditationPublicId(): string {
  let out = ''
  while (out.length < PUBLIC_ID_LENGTH) {
    for (const byte of randomBytes(PUBLIC_ID_LENGTH)) {
      if (byte >= UNBIASED_CEILING) continue
      out += PUBLIC_ID_ALPHABET[byte % PUBLIC_ID_ALPHABET.length]
      if (out.length === PUBLIC_ID_LENGTH) break
    }
  }
  return out
}

function getPrismaErrorCode(error: unknown): string | null {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as { code?: string }).code ?? null
  }
  return null
}

export interface AccreditationConfig {
  enabled: boolean
  opensAt: Date | null
  closesAt: Date | null
}

/**
 * Sincroniza la acreditación de un formulario según la configuración recibida:
 * - Habilitar sin acreditación previa: crea una nueva con `publicId` único.
 * - Habilitar con acreditación histórica: reutiliza la entidad (mismo `publicId`
 *   e historial), la reactiva y actualiza su ventana.
 * - Deshabilitar sin ingresos: elimina la acreditación.
 * - Deshabilitar con ingresos: la conserva como histórica (`enabled = false`).
 */
export async function syncFormAccreditation(formId: number, config: AccreditationConfig): Promise<void> {
  const existing = await prisma.accreditation.findUnique({
    where: { formId },
    select: { id: true, _count: { select: { entries: true } } }
  })

  if (config.enabled) {
    if (!config.opensAt || !config.closesAt) {
      // Defensa en profundidad: el schema ya exige la ventana cuando se habilita.
      throw createError({ statusCode: 422, message: 'La acreditación requiere fecha de apertura y de cierre' })
    }

    if (existing) {
      await prisma.accreditation.update({
        where: { id: existing.id },
        data: { enabled: true, opensAt: config.opensAt, closesAt: config.closesAt }
      })
      return
    }

    await createAccreditationWithUniqueId(formId, config.opensAt, config.closesAt)
    return
  }

  if (!existing) return

  if (existing._count.entries > 0) {
    await prisma.accreditation.update({ where: { id: existing.id }, data: { enabled: false } })
    return
  }

  await prisma.accreditation.delete({ where: { id: existing.id } })
}

async function createAccreditationWithUniqueId(formId: number, opensAt: Date, closesAt: Date) {
  const maxAttempts = 5
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await prisma.accreditation.create({
        data: { formId, publicId: generateAccreditationPublicId(), enabled: true, opensAt, closesAt }
      })
    } catch (error) {
      // Reintenta solo ante colisión del `publicId` único; propaga el resto.
      if (getPrismaErrorCode(error) === 'P2002' && attempt < maxAttempts) continue
      throw error
    }
  }
  throw createError({ statusCode: 500, message: 'No se pudo generar el identificador de la acreditación' })
}

/** Carga la acreditación de un formulario con el conteo de ingresos, para serializar. */
export async function loadFormAccreditation(formId: number) {
  return prisma.accreditation.findUnique({
    where: { formId },
    include: { _count: { select: { entries: true } } }
  })
}

/**
 * Busca una inscripción del mismo formulario cuyo DNI coincida exactamente con el
 * ingresado, para vincular el ingreso y copiar sus datos sin modificar la
 * inscripción. Devuelve la más antigua o `null` si no hay coincidencia.
 */
export async function findRegistrationByDni(formId: number, dni: string) {
  return prisma.consultationRegistration.findFirst({
    where: { formId, dni },
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: { createdAt: 'asc' }
  })
}
