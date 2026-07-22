import type { PrismaClient } from '../generated/client'

const SECTIONS = [
  { slug: 'audiencias-publicas', name: 'Audiencias Públicas', description: 'Instancias formales de participación donde la ciudadanía expone su opinión sobre decisiones públicas.', displayOrder: 1 },
  { slug: 'consultas-publicas', name: 'Consultas Públicas', description: 'Procesos abiertos para recoger opiniones y propuestas de la ciudadanía sobre temas de interés público.', displayOrder: 2 },
  { slug: 'dialogos', name: 'Diálogos', description: 'Espacios de intercambio y construcción colectiva entre la ciudadanía y el Estado.', displayOrder: 3 },
  { slug: 'encuentros-regionales', name: 'Encuentros Regionales', description: 'Instancias participativas descentralizadas en las distintas regiones de la provincia.', displayOrder: 4 },
  { slug: 'observatorio-obras-servicios', name: 'Observatorio de Obras y Servicios Públicos', description: 'Seguimiento y participación ciudadana sobre las obras y los servicios públicos.', displayOrder: 5 }
]

const CATEGORIES: Array<{ slug: string, sectionSlug: string, name: string, description: string, displayOrder: number }> = []

const TAGS: Array<{ slug: string, name: string }> = []

const PAGES: Array<{ pageKey: string, slug: string, title: string, isPublished: boolean, content: string }> = []

export async function seedInstitution(prisma: PrismaClient) {
  const institution = await prisma.platformSettings.upsert({
    where: { id: 1 },
    update: {
      name: 'Ministerio de Infraestructura y Servicios Públicos de la provincia de Buenos Aires',
      platformName: 'Ministerio Abierto',
      contactEmail: 'mesadeayuda@minfra.gba.gob.ar'
    },
    create: {
      id: 1,
      name: 'Ministerio de Infraestructura y Servicios Públicos de la provincia de Buenos Aires',
      platformName: 'Ministerio Abierto',
      contactEmail: 'mesadeayuda@minfra.gba.gob.ar'
    }
  })

  for (const page of PAGES) {
    await prisma.sitePage.upsert({
      where: { pageKey: page.pageKey },
      update: {
        title: page.title,
        slug: page.slug,
        content: page.content,
        isPublished: page.isPublished,
        platformSettingsId: institution.id
      },
      create: {
        pageKey: page.pageKey,
        title: page.title,
        slug: page.slug,
        content: page.content,
        isPublished: page.isPublished,
        platformSettingsId: institution.id
      }
    })
  }

  const sectionIdBySlug = new Map<string, number>()
  for (const section of SECTIONS) {
    const saved = await prisma.section.upsert({
      where: { slug: section.slug },
      update: {
        name: section.name,
        description: section.description,
        displayOrder: section.displayOrder,
        isActive: true
      },
      create: {
        slug: section.slug,
        name: section.name,
        description: section.description,
        displayOrder: section.displayOrder,
        isActive: true
      }
    })
    sectionIdBySlug.set(section.slug, saved.id)
  }

  for (const category of CATEGORIES) {
    const sectionId = sectionIdBySlug.get(category.sectionSlug)
    if (!sectionId) continue

    await prisma.category.upsert({
      where: { sectionId_slug: { sectionId, slug: category.slug } },
      update: {
        name: category.name,
        description: category.description,
        displayOrder: category.displayOrder,
        isActive: true
      },
      create: {
        sectionId,
        slug: category.slug,
        name: category.name,
        description: category.description,
        displayOrder: category.displayOrder,
        isActive: true
      }
    })
  }

  for (const tag of TAGS) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name, isActive: true },
      create: { slug: tag.slug, name: tag.name, isActive: true }
    })
  }
}
