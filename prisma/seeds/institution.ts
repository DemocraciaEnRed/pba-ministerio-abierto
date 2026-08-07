import type { PrismaClient } from '../generated/client'

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

  const sections = await prisma.section.findMany({ select: { id: true, slug: true } })
  const sectionIdBySlug = new Map(sections.map(section => [section.slug, section.id]))

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
