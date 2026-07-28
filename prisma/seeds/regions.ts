import type { PrismaClient } from '../generated/client'

/// Catálogo fijo de regiones de la Provincia de Buenos Aires (v0.10.0).
/// Se siembra una vez y no se edita ni elimina desde la app (sin ABM).
/// El seed es idempotente (upsert por slug) y debe correrse también en
/// staging/producción, ya que la migración no inserta datos.
const REGIONS = [
  { slug: 'centro-norte', name: 'Centro Norte' },
  { slug: 'centro-sur', name: 'Centro Sur' },
  { slug: 'costa-maritima', name: 'Costa Marítima' },
  { slug: 'este', name: 'Este' },
  { slug: 'fluvial', name: 'Fluvial' },
  { slug: 'noroeste', name: 'Noroeste' },
  { slug: 'norte', name: 'Norte' },
  { slug: 'sudoeste', name: 'Sudoeste' }
]

export async function seedRegions(prisma: PrismaClient) {
  for (const region of REGIONS) {
    await prisma.region.upsert({
      where: { slug: region.slug },
      update: { name: region.name },
      create: { slug: region.slug, name: region.name }
    })
  }

  console.log(`Seeded ${REGIONS.length} regions`)
}
