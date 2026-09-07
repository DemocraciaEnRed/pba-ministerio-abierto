/**
 * Catálogo fijo de grupos de trabajo del Observatorio de Obras y Servicios Públicos.
 *
 * Vive acá y no en la base porque es un catálogo institucional cerrado: no tiene
 * ABM y su presentación (color, ícono) está atada a los assets del repo. La tabla
 * `ObservatoryWorkGroup` existe para relacionarlo con las consultas; el seed la
 * sincroniza con este archivo, que es la única fuente de verdad.
 */

export const OBSERVATORY_WORK_GROUP_SLUGS = [
  'plan-estrategico-infraestructura',
  'integridad-transparencia-gobierno-abierto',
  'desarrollo-sostenible',
  'genero-diversidad-cuidados',
  'innovacion-transformacion-digital',
  'planeamiento-monitoreo-evaluacion',
  'simplificacion-normalizacion-procesos',
  'reuniones-plenarias'
] as const

export type ObservatoryWorkGroupSlug = typeof OBSERVATORY_WORK_GROUP_SLUGS[number]

export interface ObservatoryWorkGroupDefinition {
  slug: ObservatoryWorkGroupSlug
  name: string
  description: string
  /** Color institucional del grupo, en hexadecimal. */
  color: string
  /** Color del ícono sobre el fondo `color`. */
  iconColor: string
  icon: string
  displayOrder: number
}

export const OBSERVATORY_WORK_GROUPS: readonly ObservatoryWorkGroupDefinition[] = [
  {
    slug: 'plan-estrategico-infraestructura',
    name: 'Plan Estratégico de Infraestructura',
    description: 'Discutimos cómo planificar la infraestructura provincial y con qué criterios priorizar obras: conectividad y logística, energía, recursos hídricos, sistemas de ciudades y cuidados.',
    color: '#5c7ca3',
    iconColor: '#FFFFFF',
    icon: 'pba:observatorio-infra',
    displayOrder: 1
  },
  {
    slug: 'integridad-transparencia-gobierno-abierto',
    name: 'Integridad, Transparencia y Gobierno Abierto',
    description: 'Elaboramos herramientas que promueven la participación ciudadana, la cultura de la integridad y la rendición de cuentas.',
    color: '#29365c',
    iconColor: '#FFFFFF',
    icon: 'pba:observatorio-integridad',
    displayOrder: 2
  },
  {
    slug: 'desarrollo-sostenible',
    name: 'Desarrollo Sostenible',
    description: 'Trabajamos para que las obras sean más sostenibles y resilientes frente al cambio climático, incorporando criterios ambientales y de triple impacto.',
    color: '#519a51',
    iconColor: '#FFFFFF',
    icon: 'pba:observatorio-sostenible',
    displayOrder: 3
  },
  {
    slug: 'genero-diversidad-cuidados',
    name: 'Género, Diversidad y Políticas de Cuidado',
    description: 'Construimos diagnósticos y herramientas para incorporar la perspectiva de género, diversidad y cuidados en la obra pública.',
    color: '#562b6f',
    iconColor: '#FFFFFF',
    icon: 'pba:observatorio-genero',
    displayOrder: 4
  },
  {
    slug: 'innovacion-transformacion-digital',
    name: 'Innovación y Transformación Digital',
    description: 'Exploramos cómo la innovación, la inteligencia artificial, la gobernanza de datos y las tecnologías emergentes pueden transformar la gestión y digitalizar el ciclo de la obra pública.',
    color: '#70b4ce',
    iconColor: '#FFFFFF',
    icon: 'pba:observatorio-innovacion',
    displayOrder: 5
  },
  {
    slug: 'planeamiento-monitoreo-evaluacion',
    name: 'Planeamiento, Monitoreo y Evaluación',
    description: 'Construimos metodologías para fortalecer la planificación estratégica, la toma de decisiones basada en evidencia y la gestión por resultados.',
    color: '#bb2d28',
    iconColor: '#FFFFFF',
    icon: 'pba:observatorio-planeamiento',
    displayOrder: 6
  },
  {
    slug: 'simplificacion-normalizacion-procesos',
    name: 'Simplificación, Normalización y Mejora de los Procesos',
    description: 'Trabajamos en la mejora continua de los procesos de la obra pública para hacerlos más simples y eficientes, respondiendo a las necesidades de la ciudadanía, y actualizamos el marco normativo con criterios de contratación estratégica.',
    color: '#c63b6d',
    iconColor: '#FFFFFF',
    icon: 'pba:observatorio-procesos',
    displayOrder: 7
  },
  {
    slug: 'reuniones-plenarias',
    name: 'Reuniones plenarias',
    description: 'Construimos consensos sobre las líneas de trabajo que debe abordar el Observatorio cada año y presentamos los resultados alcanzados.',
    color: '#d0a208',
    iconColor: '#FFFFFF',
    icon: 'pba:observatorio-plenarios',
    displayOrder: 8
  }
]

const observatoryWorkGroupBySlug = new Map<string, ObservatoryWorkGroupDefinition>(
  OBSERVATORY_WORK_GROUPS.map(group => [group.slug, group])
)

export function getObservatoryWorkGroup(slug: string | null | undefined): ObservatoryWorkGroupDefinition | undefined {
  if (!slug) return undefined
  return observatoryWorkGroupBySlug.get(slug)
}

export function isKnownObservatoryWorkGroupSlug(slug: string | null | undefined): slug is ObservatoryWorkGroupSlug {
  return !!slug && observatoryWorkGroupBySlug.has(slug)
}
