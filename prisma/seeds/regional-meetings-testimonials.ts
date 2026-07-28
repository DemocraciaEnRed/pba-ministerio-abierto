import type { PrismaClient } from '../generated/client'

/// Testimonios de ejemplo de los Encuentros Regionales (v0.10.0).
/// Contenido editorial de muestra: cada "encuentro" (grupo) agrupa hasta 3
/// testimonios. El seed es idempotente por nombre de encuentro (si ya existe un
/// grupo con ese nombre, no se vuelve a crear), para no pisar ediciones hechas
/// desde el panel. Las fechas usan mediodía UTC para evitar corrimientos de día.
const TESTIMONIAL_GROUPS = [
  {
    name: 'Región Centro Sur',
    regionSlug: 'centro-sur',
    municipality: 'Tandil',
    heldAt: '2026-03-19',
    testimonials: [
      {
        authorName: 'Carolina',
        municipality: 'Tandil',
        body: 'Valoramos la oportunidad de ser parte del diseño de las políticas públicas, gracias por generar estos espacios.'
      },
      {
        authorName: 'María',
        municipality: 'Rauch',
        body: 'Fue muy buena la propuesta de hacer una convocatoria abierta donde se pudiera escuchar la diversidad de voces para construir acuerdos.'
      },
      {
        authorName: 'Diego',
        municipality: 'Ayacucho',
        body: 'Destaco la participación de gente de distintos sectores y la posibilidad de conocer de primera mano las propuestas que tiene la Provincia para desarrollar la región.'
      }
    ]
  },
  {
    name: 'Región Fluvial',
    regionSlug: 'fluvial',
    municipality: 'San Pedro',
    heldAt: '2026-05-14',
    testimonials: [
      {
        authorName: 'Federico',
        municipality: 'San Nicolás',
        body: 'La dinámica fue muy buena, se notó compromiso, cercanía a la gente y gran poder de escucha. Todas cosas que la Provincia necesita.'
      },
      {
        authorName: 'Renata',
        municipality: 'Zárate',
        body: 'Estuvimos participando de la mesa de Juventudes. En comunidad logramos construir espacios que nos incluyen a todos, ser escuchados y valorados.'
      },
      {
        authorName: 'Silvia',
        municipality: 'Zárate',
        body: 'Sigan generando estos encuentros que son muy necesarios.'
      }
    ]
  }
]

export async function seedRegionalMeetingsTestimonials(prisma: PrismaClient) {
  let seeded = 0

  for (const group of TESTIMONIAL_GROUPS) {
    const existing = await prisma.regionalMeetingTestimonialGroup.findFirst({
      where: { name: group.name },
      select: { id: true }
    })

    if (existing) {
      continue
    }

    const region = await prisma.region.findUnique({
      where: { slug: group.regionSlug },
      select: { id: true }
    })

    const heldAt = new Date(`${group.heldAt}T12:00:00.000Z`)

    await prisma.regionalMeetingTestimonialGroup.create({
      data: {
        name: group.name,
        municipality: group.municipality,
        heldAt,
        regionId: region?.id ?? null,
        testimonials: {
          create: group.testimonials.map((testimonial, index) => ({
            body: testimonial.body,
            authorName: testimonial.authorName,
            municipality: testimonial.municipality,
            displayOrder: index
          }))
        }
      }
    })

    seeded += 1
  }

  console.log(`Seeded ${seeded} regional meeting testimonial groups`)
}
