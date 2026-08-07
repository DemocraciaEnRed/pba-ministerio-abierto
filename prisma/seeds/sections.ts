import type { PrismaClient } from '../generated/client'
import { CONSULTATION_TYPES } from '../../shared/data/consultation-types'

/// Catálogo base de tipos de consulta (tabla `Section`). No tiene ABM: el admin
/// solo edita nombre, descripción, orden y visibilidad desde la plataforma.
/// Por eso el upsert crea las filas faltantes pero no pisa lo que el admin editó.
export async function seedSections(prisma: PrismaClient) {
  for (const type of CONSULTATION_TYPES) {
    await prisma.section.upsert({
      where: { slug: type.slug },
      update: {},
      create: {
        slug: type.slug,
        name: type.label,
        description: type.description,
        displayOrder: type.displayOrder,
        isActive: type.enabled
      }
    })
  }

  console.log(`Seeded ${CONSULTATION_TYPES.length} sections`)
}
