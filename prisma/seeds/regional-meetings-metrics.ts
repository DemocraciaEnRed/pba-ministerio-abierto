import type { PrismaClient } from '../generated/client'

/// Métricas de alcance de los Encuentros Regionales (catálogo fijo de 4).
/// El seed es idempotente (upsert por `key`) y debe correrse también en
/// staging/producción, ya que la migración no inserta datos. Sólo crea los
/// registros: si ya existen, respeta los valores editados desde el panel.
const METRICS = [
  { key: 'encuentros-realizados', label: 'Encuentros realizados', value: '3', displayOrder: 0 },
  { key: 'municipios-alcanzados', label: 'Municipios alcanzados', value: '27', displayOrder: 1 },
  { key: 'participantes-totales', label: 'Participantes totales', value: '1.050', displayOrder: 2 },
  { key: 'proyectos-recibidos', label: 'Proyectos ciudadanos recibidos', value: '42', displayOrder: 3 }
]

export async function seedRegionalMeetingsMetrics(prisma: PrismaClient) {
  let seeded = 0

  for (const metric of METRICS) {
    await prisma.regionalMeetingMetric.upsert({
      where: { key: metric.key },
      update: { displayOrder: metric.displayOrder },
      create: metric
    })

    seeded += 1
  }

  console.log(`Seeded ${seeded} regional meeting metrics`)
}
