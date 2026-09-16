import type { PrismaClient } from '../generated/client'

/// Métricas de alcance del Observatorio (catálogo fijo de 5).
/// El seed es idempotente (upsert por `key`) y sólo crea registros: si ya
/// existen, respeta los valores editados desde el panel.
const METRICS = [
  { key: 'ejes', label: 'Ejes', value: '7', displayOrder: 0 },
  { key: 'instituciones', label: 'Instituciones', value: '55', displayOrder: 1 },
  { key: 'reuniones', label: 'Reuniones', value: '29', displayOrder: 2 },
  { key: 'especialistas-y-referentes', label: 'Especialistas y referentes', value: '+130', displayOrder: 3 },
  { key: 'politicas-publicas-abordadas', label: 'Políticas públicas abordadas', value: '+20', displayOrder: 4 }
]

export async function seedObservatoryMetrics(prisma: PrismaClient) {
  let seeded = 0

  for (const metric of METRICS) {
    await prisma.observatoryMetric.upsert({
      where: { key: metric.key },
      update: { displayOrder: metric.displayOrder },
      create: metric
    })

    seeded += 1
  }

  console.log(`Seeded ${seeded} observatory metrics`)
}
