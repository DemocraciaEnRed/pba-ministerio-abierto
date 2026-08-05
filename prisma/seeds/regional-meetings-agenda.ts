import type { PrismaClient } from '../generated/client'
import type { AgendaItemState } from '../generated/enums'

/// Datos iniciales de la agenda de Encuentros Regionales (v0.10.0).
/// Exactamente un ítem por región (catálogo fijo de 8). El seed es idempotente
/// (upsert por regionId) y debe correrse también en staging/producción, ya que
/// la migración no inserta datos. El `location` es texto libre (no un municipio
/// del catálogo cerrado). Las fechas usan mediodía UTC para evitar corrimientos
/// de día por zona horaria.
const AGENDA_ITEMS: {
  regionSlug: string
  location: string
  heldAt: string
  year: number | null
  state: AgendaItemState
}[] = [
  { regionSlug: 'centro-sur', location: 'Tandil', heldAt: '2026-03-19', year: 2026, state: 'closed' },
  { regionSlug: 'fluvial', location: 'San Pedro', heldAt: '2026-05-14', year: null, state: 'closed' },
  { regionSlug: 'este', location: 'Chascomús', heldAt: '2026-06-25', year: null, state: 'closed' },
  { regionSlug: 'noroeste', location: 'Trenque Lauquen', heldAt: '2026-06-25', year: null, state: 'closed' },
  { regionSlug: 'norte', location: 'Junín', heldAt: '2026-09-10', year: null, state: 'scheduled' },
  { regionSlug: 'costa-maritima', location: 'Mar del Plata', heldAt: '2026-10-08', year: null, state: 'scheduled' },
  { regionSlug: 'centro-norte', location: 'Chivilcoy', heldAt: '2026-11-05', year: null, state: 'scheduled' },
  { regionSlug: 'sudoeste', location: 'Bahía Blanca', heldAt: '2026-12-03', year: 2027, state: 'scheduled' }
]

export async function seedRegionalMeetingsAgenda(prisma: PrismaClient) {
  let seeded = 0

  for (const item of AGENDA_ITEMS) {
    const region = await prisma.region.findUnique({
      where: { slug: item.regionSlug }
    })

    if (!region) {
      console.warn(`Region not found for agenda item: ${item.regionSlug} (skipped). Run the regions seed first.`)
      continue
    }

    const heldAt = new Date(`${item.heldAt}T12:00:00.000Z`)

    await prisma.regionalMeetingAgendaItem.upsert({
      where: { regionId: region.id },
      update: { location: item.location, heldAt, year: item.year, state: item.state },
      create: { regionId: region.id, location: item.location, heldAt, year: item.year, state: item.state }
    })

    seeded += 1
  }

  console.log(`Seeded ${seeded} regional meeting agenda items`)
}
