import type { PrismaClient } from '../generated/client'

interface InstitutionCategorySeed {
  slug: string
  name: string
  institutions: { slug: string, name: string }[]
}

/// Catálogo inicial de instituciones del Observatorio. A diferencia de los grupos
/// de trabajo, esto es solo la carga inicial: el catálogo tiene ABM en el panel,
/// así que el seed crea lo que falta y nunca pisa lo editado por quien administra.
const INSTITUTION_CATEGORIES: InstitutionCategorySeed[] = [
  {
    slug: 'universidades-nacionales-provinciales',
    name: 'Universidades Nacionales y Provinciales',
    institutions: [
      { slug: 'universidad-nacional-la-plata', name: 'Universidad Nacional de La Plata' },
      { slug: 'universidad-nacional-sur', name: 'Universidad Nacional del Sur' },
      { slug: 'universidad-tecnologica-nacional', name: 'Universidad Tecnológica Nacional' },
      { slug: 'universidad-nacional-lomas-de-zamora', name: 'Universidad Nacional de Lomas de Zamora' },
      { slug: 'universidad-nacional-lujan', name: 'Universidad Nacional de Luján' },
      { slug: 'universidad-nacional-mar-del-plata', name: 'Universidad Nacional de Mar del Plata' },
      { slug: 'universidad-nacional-la-matanza', name: 'Universidad Nacional de La Matanza' },
      { slug: 'universidad-nacional-quilmes', name: 'Universidad Nacional de Quilmes' },
      { slug: 'universidad-nacional-san-martin', name: 'Universidad Nacional de San Martín' },
      { slug: 'universidad-nacional-lanus', name: 'Universidad Nacional de Lanús' },
      { slug: 'universidad-nacional-tres-de-febrero', name: 'Universidad Nacional de Tres de Febrero' },
      { slug: 'universidad-nacional-noroeste-buenos-aires', name: 'Universidad Nacional del Noroeste de la Provincia de Buenos Aires' },
      { slug: 'universidad-nacional-avellaneda', name: 'Universidad Nacional de Avellaneda' },
      { slug: 'universidad-nacional-arturo-jauretche', name: 'Universidad Nacional Arturo Jauretche' },
      { slug: 'universidad-nacional-moreno', name: 'Universidad Nacional de Moreno' },
      { slug: 'universidad-nacional-jose-c-paz', name: 'Universidad Nacional de José C. Paz' },
      { slug: 'universidad-nacional-hurlingham', name: 'Universidad Nacional de Hurlingham' },
      { slug: 'universidad-nacional-guillermo-brown', name: 'Universidad Nacional Guillermo Brown' },
      { slug: 'universidad-nacional-oeste', name: 'Universidad Nacional del Oeste' },
      { slug: 'universidad-nacional-raul-scalabrini-ortiz', name: 'Universidad Nacional Raúl Scalabrini Ortiz' },
      { slug: 'universidad-nacional-san-antonio-de-areco', name: 'Universidad Nacional de San Antonio de Areco' },
      { slug: 'universidad-pedagogica-nacional', name: 'Universidad Pedagógica Nacional' },
      { slug: 'universidad-nacional-delta', name: 'Universidad Nacional del Delta' },
      { slug: 'universidad-provincial-sudoeste', name: 'Universidad Provincial del Sudoeste' },
      { slug: 'universidad-provincial-ezeiza', name: 'Universidad Provincial de Ezeiza' }
    ]
  },
  {
    slug: 'unidades-academicas',
    name: 'Unidades académicas',
    institutions: [
      { slug: 'facultad-ciencias-sociales-uba', name: 'Facultad de Ciencias Sociales (UBA)' },
      { slug: 'observatorio-contratacion-publica-universidad-austral', name: 'Observatorio de la Contratación Pública – Universidad Austral' }
    ]
  },
  {
    slug: 'organismos-sistema-universitario',
    name: 'Organismos del sistema universitario',
    institutions: [
      { slug: 'consejo-interuniversitario-nacional', name: 'Consejo Interuniversitario Nacional (CIN)' },
      { slug: 'clacso', name: 'Consejo Latinoamericano de Ciencias Sociales (CLACSO)' },
      { slug: 'flacso', name: 'Facultad Latinoamericana de Ciencias Sociales (FLACSO)' }
    ]
  },
  {
    slug: 'camaras-empresariales',
    name: 'Cámaras empresariales',
    institutions: [
      { slug: 'camarco-pba', name: 'Cámara Argentina de la Construcción de la Provincia de Buenos Aires (CAMARCO PBA)' },
      { slug: 'cadeci', name: 'Cámara Argentina de Consultoras de Ingeniería (CADECI)' }
    ]
  },
  {
    slug: 'colegios-profesionales',
    name: 'Colegios Profesionales',
    institutions: [
      { slug: 'colegio-arquitectos-buenos-aires', name: 'Colegio de Arquitectos de la Provincia de Buenos Aires' },
      { slug: 'colegio-ingenieros-buenos-aires', name: 'Colegio de Ingenieros de la Provincia de Buenos Aires' }
    ]
  },
  {
    slug: 'sindicatos',
    name: 'Sindicatos',
    institutions: [
      { slug: 'fundacion-uocra', name: 'Fundación UOCRA' }
    ]
  },
  {
    slug: 'organizaciones-sociedad-civil',
    name: 'Organizaciones de la Sociedad Civil',
    institutions: [
      { slug: 'aaeap', name: 'Asociación Argentina de Estudios de Administración Pública (AAEAP)' },
      { slug: 'cippec', name: 'CIPPEC' },
      { slug: 'democracia-en-red', name: 'Democracia en Red' },
      { slug: 'ela', name: 'Equipo Latinoamericano de Justicia y Género (ELA)' },
      { slug: 'fundacion-poder-ciudadano', name: 'Fundación Poder Ciudadano' },
      { slug: 'fundacion-transparencia-activa', name: 'Fundación Transparencia Activa' },
      { slug: 'fundar', name: 'Fundar' },
      { slug: 'grow-genero-y-trabajo', name: 'Grow - Género y Trabajo' },
      { slug: 'ingenieria-sin-fronteras', name: 'Ingeniería sin Fronteras' }
    ]
  }
]

export async function seedObservatoryInstitutions(prisma: PrismaClient) {
  let institutionCount = 0

  for (const [categoryIndex, category] of INSTITUTION_CATEGORIES.entries()) {
    const categoryRow = await prisma.observatoryInstitutionCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        slug: category.slug,
        name: category.name,
        displayOrder: categoryIndex + 1
      }
    })

    for (const [institutionIndex, institution] of category.institutions.entries()) {
      await prisma.observatoryInstitution.upsert({
        where: { slug: institution.slug },
        update: {},
        create: {
          categoryId: categoryRow.id,
          slug: institution.slug,
          name: institution.name,
          displayOrder: institutionIndex + 1
        }
      })
      institutionCount += 1
    }
  }

  console.log(`Seeded ${INSTITUTION_CATEGORIES.length} observatory institution categories and ${institutionCount} institutions`)
}
