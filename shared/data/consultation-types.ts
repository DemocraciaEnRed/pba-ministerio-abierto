/**
 * Catálogo base de tipos de consulta (las "secciones" del modelo de datos).
 *
 * Vive acá y no en la base porque cada tipo habilita estructura distinta en la
 * consulta (por ejemplo, solo Encuentros Regionales admite región). La tabla
 * `Section` sigue existiendo para las relaciones (ejes de gestión, consultas) y
 * para que el admin edite la presentación, pero el catálogo y las capacidades
 * se definen únicamente acá: filas con un slug fuera de este registro se ignoran.
 */

export const CONSULTATION_TYPE_SLUGS = [
  'audiencias-publicas',
  'consultas-publicas',
  'dialogos',
  'encuentros-regionales',
  'observatorio-obras-servicios'
] as const

export type ConsultationTypeSlug = typeof CONSULTATION_TYPE_SLUGS[number]

/**
 * Variante del formulario de inscripción. `hearing` suma la forma de
 * participación (asistente/expositor) y la sección de exposición.
 */
export type RegistrationFormKind = 'hearing' | 'consultation'

export interface ConsultationTypeDefinition {
  slug: ConsultationTypeSlug
  /** Nombre por defecto; el admin puede sobrescribirlo en la base. */
  label: string
  description: string
  /** Copy de invitación a participar, usado en las tarjetas del home. */
  tagline: string
  displayOrder: number
  icon: string
  /** Landing pública estática del tipo. `null` si todavía no tiene. */
  landingRoute: string | null
  /** Habilita asignar una región a las consultas de este tipo. */
  allowsRegion: boolean
  /** Habilita crear un formulario de inscripción presencial para la consulta. */
  registrationFormKind: RegistrationFormKind | null
  defaultConsultationFormat: 'single' | 'multiple'
  /** `false` para tipos anunciados pero todavía no lanzados. */
  enabled: boolean
}

export const CONSULTATION_TYPES: readonly ConsultationTypeDefinition[] = [
  {
    slug: 'audiencias-publicas',
    label: 'Audiencias públicas',
    description: 'Instancias formales de participación donde la ciudadanía expone su opinión sobre decisiones públicas.',
    tagline: 'Informate y participá en la toma de decisiones.',
    displayOrder: 1,
    icon: 'pba:audiencias-publicas',
    landingRoute: '/audiencias-publicas',
    allowsRegion: false,
    registrationFormKind: 'hearing',
    defaultConsultationFormat: 'multiple',
    enabled: true
  },
  {
    slug: 'consultas-publicas',
    label: 'Consultas públicas',
    description: 'Procesos abiertos para recoger opiniones y propuestas de la ciudadanía sobre temas de interés público.',
    tagline: 'Conocé e informate sobre los proyectos que impactan en tu región.',
    displayOrder: 2,
    icon: 'pba:consultas-publicas',
    landingRoute: '/consultas-publicas',
    allowsRegion: false,
    registrationFormKind: 'consultation',
    defaultConsultationFormat: 'multiple',
    enabled: true
  },
  {
    slug: 'dialogos',
    label: 'Obras y proyectos en diálogo',
    description: 'Espacios de intercambio y construcción colectiva entre la ciudadanía y el Estado.',
    tagline: 'Formá parte para conocer el avance de obras estratégicas.',
    displayOrder: 3,
    icon: 'pba:dialogos',
    landingRoute: '/dialogos',
    allowsRegion: false,
    registrationFormKind: null,
    defaultConsultationFormat: 'multiple',
    enabled: true
  },
  {
    slug: 'encuentros-regionales',
    label: 'Encuentros Regionales',
    description: 'Instancias participativas descentralizadas en las distintas regiones de la provincia.',
    tagline: 'Participá para construir la agenda de desarrollo de tu región.',
    displayOrder: 4,
    icon: 'pba:encuentros-regionales',
    landingRoute: '/encuentros-regionales',
    allowsRegion: true,
    registrationFormKind: null,
    defaultConsultationFormat: 'multiple',
    enabled: true
  },
  {
    slug: 'observatorio-obras-servicios',
    label: 'Observatorio de Obras y Servicios Públicos',
    description: 'Espacio institucional de participación y control ciudadano.',
    tagline: 'Espacio institucional de participación y control ciudadano.',
    displayOrder: 5,
    icon: 'pba:observatorio',
    landingRoute: null,
    allowsRegion: false,
    registrationFormKind: null,
    defaultConsultationFormat: 'multiple',
    enabled: false
  }
]

const consultationTypeBySlug = new Map<string, ConsultationTypeDefinition>(
  CONSULTATION_TYPES.map(type => [type.slug, type])
)

export function getConsultationType(slug: string | null | undefined): ConsultationTypeDefinition | undefined {
  if (!slug) return undefined
  return consultationTypeBySlug.get(slug)
}

export function isKnownConsultationTypeSlug(slug: string | null | undefined): slug is ConsultationTypeSlug {
  return !!slug && consultationTypeBySlug.has(slug)
}

export function consultationTypeAllowsRegion(slug: string | null | undefined): boolean {
  return getConsultationType(slug)?.allowsRegion ?? false
}

export function consultationTypeRegistrationKind(slug: string | null | undefined): RegistrationFormKind | null {
  return getConsultationType(slug)?.registrationFormKind ?? null
}

export function consultationTypeAllowsRegistrationForm(slug: string | null | undefined): boolean {
  return consultationTypeRegistrationKind(slug) !== null
}
