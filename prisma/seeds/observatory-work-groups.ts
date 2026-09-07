import { OBSERVATORY_WORK_GROUPS } from '../../shared/data/observatory-work-groups'
import type { PrismaClient } from '../generated/client'

/// Sincroniza el catálogo de grupos de trabajo del Observatorio con
/// `shared/data/observatory-work-groups.ts`. Como no hay ABM, el upsert pisa
/// siempre la presentación: el código es la fuente de verdad.
export async function seedObservatoryWorkGroups(prisma: PrismaClient) {
  for (const group of OBSERVATORY_WORK_GROUPS) {
    const data = {
      name: group.name,
      description: group.description,
      color: group.color,
      iconColor: group.iconColor,
      icon: group.icon,
      displayOrder: group.displayOrder,
      isActive: true
    }

    await prisma.observatoryWorkGroup.upsert({
      where: { slug: group.slug },
      update: data,
      create: { slug: group.slug, ...data }
    })
  }

  console.log(`Seeded ${OBSERVATORY_WORK_GROUPS.length} observatory work groups`)
}
