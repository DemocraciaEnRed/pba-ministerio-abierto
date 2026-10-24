import type { PrismaClient } from '../generated/client'

/// Datos de agenda de ejemplo para las consultas demo de Encuentros Regionales.
///
/// Desde que la agenda es 1:1 con la consulta, no se siembran ítems sueltos:
/// este seed completa región + encuentro de las consultas demo (`demo-*`) de la
/// sección que todavía no lo tengan. Las consultas reales se cargan desde el
/// formulario de la consulta. Es idempotente y requiere los seeds de regiones y
/// demo. Las fechas usan mediodía UTC para evitar corrimientos de día.
const DEMO_SLUG_PREFIX = 'demo-'

const SAMPLE_MEETINGS: { regionSlug: string, location: string, heldAt: string, withRegistration?: boolean }[] = [
  { regionSlug: 'centro-sur', location: 'Tandil', heldAt: '2026-03-19' },
  { regionSlug: 'sudoeste', location: 'Bahía Blanca', heldAt: '2026-12-03', withRegistration: true },
  { regionSlug: 'norte', location: 'Junín', heldAt: '2027-04-15', withRegistration: true },
  { regionSlug: 'fluvial', location: 'San Pedro', heldAt: '2026-05-14' },
  { regionSlug: 'este', location: 'Chascomús', heldAt: '2026-06-25' },
  { regionSlug: 'noroeste', location: 'Trenque Lauquen', heldAt: '2026-06-25' },
  { regionSlug: 'costa-maritima', location: 'Mar del Plata', heldAt: '2026-10-08' },
  { regionSlug: 'centro-norte', location: 'Chivilcoy', heldAt: '2026-11-05' }
]

export async function seedRegionalMeetingsAgenda(prisma: PrismaClient) {
  const consultations = await prisma.consultation.findMany({
    where: {
      slug: { startsWith: DEMO_SLUG_PREFIX },
      section: { slug: 'encuentros-regionales' },
      regionalMeeting: null
    },
    orderBy: { id: 'asc' },
    select: { id: true }
  })

  let seeded = 0

  for (const [index, consultation] of consultations.entries()) {
    const sample = SAMPLE_MEETINGS[index % SAMPLE_MEETINGS.length]!
    const region = await prisma.region.findUnique({ where: { slug: sample.regionSlug } })

    if (!region) {
      console.warn(`Region not found for agenda item: ${sample.regionSlug} (skipped). Run the regions seed first.`)
      continue
    }

    const heldAt = new Date(`${sample.heldAt}T12:00:00.000Z`)
    const registrationOpensAt = sample.withRegistration ? new Date(heldAt.getTime() - 30 * 24 * 60 * 60 * 1000) : null
    const registrationClosesAt = sample.withRegistration ? new Date(heldAt.getTime() - 24 * 60 * 60 * 1000) : null

    await prisma.$transaction([
      prisma.consultation.update({
        where: { id: consultation.id },
        data: { regionId: region.id }
      }),
      prisma.regionalMeetingAgendaItem.create({
        data: {
          consultationId: consultation.id,
          location: sample.location,
          heldAt,
          registrationUrl: sample.withRegistration ? 'https://forms.gle/ejemplo-encuentro-regional' : null,
          registrationOpensAt,
          registrationClosesAt
        }
      })
    ])

    seeded += 1
  }

  console.log(`Seeded ${seeded} regional meeting agenda items`)
}
