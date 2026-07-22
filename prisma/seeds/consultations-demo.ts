import { fakerES as faker } from '@faker-js/faker'
import type { PrismaClient } from '../generated/client'
import {
  CommentAuthorMode,
  CommentReactionType,
  ConsultationFormat,
  ConsultationRole,
  MechanismType,
  ResultsVisibility,
  UserStatus,
  Visibility,
  VoteValue
} from '../generated/client'
import { hashSeedPassword } from './password'

// Prefijo con el que se identifican todos los datos de este perfil.
// La regeneración completa borra por este prefijo antes de recrear.
const DEMO_SLUG_PREFIX = 'demo-'
const DEMO_CITIZEN_EMAIL_PREFIX = 'demo-vecino-'
const DEMO_CITIZEN_COUNT = 16
const DEMO_PASSWORD = 'Cambiar1234'

// Pool de personas colaboradoras (rol de plataforma "collaborator", creadas por
// el perfil base) entre las que se reparte la creación y administración de las
// consultas demo. La administración se materializa con filas ConsultationMembership.
const COLLABORATOR_EMAILS = [
  'equipo@consultas.local',
  'colaborador1@consultas.local',
  'colaborador2@consultas.local'
]
// Administrador de plataforma que figura como quien asigna las membresías.
const ADMIN_EMAIL = 'admin@consultas.local'

const DEFAULT_CONSULTATION_COUNT = 12
const MAX_CONSULTATION_COUNT = 15

const DAY_MS = 24 * 60 * 60 * 1000

const REACTION_TYPES = Object.values(CommentReactionType)

type DemoMechanism = 'support' | 'vote' | 'survey'

interface DemoTopicTemplate {
  slug: string
  title: string
  questionText: string
  mechanism: DemoMechanism
  surveyOptions?: string[]
}

interface DemoConsultationTemplate {
  slug: string
  title: string
  summary: string
  sectionSlug: string
  format: 'single' | 'multiple'
  topics: DemoTopicTemplate[]
}

/**
 * Catálogo curado de consultas imaginadas para municipios de la Provincia de
 * Buenos Aires. Los títulos y resúmenes son fijos (temáticas reales de gestión
 * municipal); las descripciones largas y los textos de comentarios se completan
 * con Faker para dar variedad.
 */
const CONSULTATION_TEMPLATES: DemoConsultationTemplate[] = [
  {
    slug: `${DEMO_SLUG_PREFIX}la-plata-ciclovias`,
    title: 'Plan de ciclovías para el casco urbano de La Plata',
    summary: 'Buscamos ampliar la red de ciclovías en el casco y las diagonales para una movilidad más segura y sustentable.',
    sectionSlug: 'consultas-publicas',
    format: 'multiple',
    topics: [
      {
        slug: 'red-diagonales',
        title: 'Ciclovías en las diagonales',
        questionText: '¿Estás de acuerdo con priorizar la red de ciclovías sobre las diagonales?',
        mechanism: 'vote'
      },
      {
        slug: 'primer-corredor',
        title: 'Primer corredor a construir',
        questionText: '¿Qué corredor debería construirse primero?',
        mechanism: 'survey',
        surveyOptions: [
          'Diagonal 73 (centro a periferia)',
          'Avenida 7 (norte a sur)',
          'Avenida 44 (hacia la terminal)',
          'Circuito universitario'
        ]
      },
      {
        slug: 'bicicleteros-seguros',
        title: 'Estacionamientos seguros para bicicletas',
        questionText: '¿Apoyás la instalación de bicicleteros seguros en edificios públicos?',
        mechanism: 'support'
      }
    ]
  },
  {
    slug: `${DEMO_SLUG_PREFIX}moron-plaza-san-martin`,
    title: 'Remodelación de la Plaza San Martín de Morón',
    summary: 'Queremos renovar la plaza central del municipio recuperando espacios de encuentro y sombra.',
    sectionSlug: 'observatorio-obras-servicios',
    format: 'single',
    topics: [
      {
        slug: 'uso-preferido',
        title: 'Uso del nuevo espacio',
        questionText: '¿Qué uso preferís para el nuevo espacio central?',
        mechanism: 'survey',
        surveyOptions: [
          'Área de juegos infantiles',
          'Anfiteatro para eventos barriales',
          'Ferias y gastronomía',
          'Más arbolado y bancos'
        ]
      }
    ]
  },
  {
    slug: `${DEMO_SLUG_PREFIX}avellaneda-residuos`,
    title: 'Gestión de residuos y reciclaje en Avellaneda',
    summary: 'Proponemos un esquema de recolección diferenciada para reducir el enterramiento de residuos.',
    sectionSlug: 'observatorio-obras-servicios',
    format: 'multiple',
    topics: [
      {
        slug: 'recoleccion-diferenciada',
        title: 'Recolección diferenciada obligatoria',
        questionText: '¿Estás de acuerdo con implementar la recolección diferenciada obligatoria?',
        mechanism: 'vote'
      },
      {
        slug: 'dia-reciclables',
        title: 'Día de recolección de reciclables',
        questionText: '¿Qué día preferís para la recolección de materiales reciclables?',
        mechanism: 'survey',
        surveyOptions: ['Lunes', 'Miércoles', 'Viernes', 'Sábado']
      }
    ]
  },
  {
    slug: `${DEMO_SLUG_PREFIX}quilmes-presupuesto-2026`,
    title: 'Presupuesto participativo Quilmes 2026',
    summary: 'Vecinas y vecinos deciden el destino de una parte del presupuesto de obras para el próximo año.',
    sectionSlug: 'consultas-publicas',
    format: 'multiple',
    topics: [
      {
        slug: 'iluminacion-led',
        title: 'Iluminación LED en espacios públicos',
        questionText: '¿Destinar fondos al recambio a iluminación LED?',
        mechanism: 'vote'
      },
      {
        slug: 'desague-pluvial',
        title: 'Obras de desagüe pluvial',
        questionText: '¿Priorizar obras de desagüe pluvial en zonas inundables?',
        mechanism: 'vote'
      },
      {
        slug: 'obra-barrial',
        title: 'Obra barrial a priorizar',
        questionText: '¿Qué obra barrial deberíamos priorizar?',
        mechanism: 'survey',
        surveyOptions: [
          'Repavimentación de calles',
          'Nueva sala de primeros auxilios',
          'Playón deportivo',
          'Refacción de escuelas'
        ]
      }
    ]
  },
  {
    slug: `${DEMO_SLUG_PREFIX}tigre-costanera`,
    title: 'Nueva costanera peatonal en Tigre',
    summary: 'Proyecto para ampliar el paseo costero priorizando el acceso peatonal y el turismo local.',
    sectionSlug: 'audiencias-publicas',
    format: 'single',
    topics: [
      {
        slug: 'ampliacion-costanera',
        title: 'Ampliación de la costanera',
        questionText: '¿Apoyás la ampliación de la costanera peatonal?',
        mechanism: 'support'
      }
    ]
  },
  {
    slug: `${DEMO_SLUG_PREFIX}san-isidro-arbolado`,
    title: 'Plan de arbolado urbano en San Isidro',
    summary: 'Definimos qué especies nativas plantar en veredas para mejorar la sombra y la biodiversidad.',
    sectionSlug: 'dialogos',
    format: 'single',
    topics: [
      {
        slug: 'especie-nativa',
        title: 'Especie nativa para veredas',
        questionText: '¿Qué especie nativa priorizar para el arbolado de veredas?',
        mechanism: 'survey',
        surveyOptions: ['Jacarandá', 'Ceibo', 'Lapacho rosado', 'Anacahuita']
      }
    ]
  },
  {
    slug: `${DEMO_SLUG_PREFIX}lanus-cultura-barrial`,
    title: 'Agenda cultural barrial de Lanús',
    summary: 'Construimos entre todas y todos la programación cultural gratuita de los centros barriales.',
    sectionSlug: 'dialogos',
    format: 'multiple',
    topics: [
      {
        slug: 'talleres-gratuitos',
        title: 'Talleres gratuitos',
        questionText: '¿Qué talleres gratuitos te gustaría que se dicten?',
        mechanism: 'survey',
        surveyOptions: [
          'Música y percusión',
          'Teatro comunitario',
          'Fotografía',
          'Oficios y emprendimientos'
        ]
      },
      {
        slug: 'centro-cultural-joven',
        title: 'Centro cultural juvenil',
        questionText: '¿Apoyás la creación de un centro cultural para jóvenes?',
        mechanism: 'support'
      }
    ]
  },
  {
    slug: `${DEMO_SLUG_PREFIX}mar-del-plata-transporte`,
    title: 'Reordenamiento del transporte público en Mar del Plata',
    summary: 'Revisamos recorridos y carriles exclusivos para mejorar la frecuencia del transporte público.',
    sectionSlug: 'audiencias-publicas',
    format: 'multiple',
    topics: [
      {
        slug: 'carril-exclusivo',
        title: 'Carril exclusivo de colectivos',
        questionText: '¿Estás de acuerdo con extender el carril exclusivo de colectivos?',
        mechanism: 'vote'
      },
      {
        slug: 'mejora-paradas',
        title: 'Mejoras en las paradas',
        questionText: '¿Qué mejora priorizás en las paradas de colectivo?',
        mechanism: 'survey',
        surveyOptions: [
          'Refugios con techo',
          'Carteles con tiempos de espera',
          'Iluminación y seguridad',
          'Accesibilidad para sillas de ruedas'
        ]
      }
    ]
  },
  {
    slug: `${DEMO_SLUG_PREFIX}bahia-blanca-seguridad-vial`,
    title: 'Seguridad vial en avenidas de Bahía Blanca',
    summary: 'Medidas para reducir la velocidad y proteger a peatones en zonas escolares y avenidas.',
    sectionSlug: 'encuentros-regionales',
    format: 'single',
    topics: [
      {
        slug: 'reductores-velocidad',
        title: 'Reductores de velocidad',
        questionText: '¿Instalar reductores de velocidad en zonas escolares?',
        mechanism: 'vote'
      }
    ]
  },
  {
    slug: `${DEMO_SLUG_PREFIX}tandil-turismo-sustentable`,
    title: 'Desarrollo turístico sustentable de Tandil',
    summary: 'Buscamos potenciar el turismo cuidando las sierras y el patrimonio natural del municipio.',
    sectionSlug: 'encuentros-regionales',
    format: 'multiple',
    topics: [
      {
        slug: 'circuito-turistico',
        title: 'Circuito turístico a potenciar',
        questionText: '¿Qué circuito turístico deberíamos potenciar?',
        mechanism: 'survey',
        surveyOptions: [
          'Sierras y senderismo',
          'Circuito gastronómico',
          'Turismo religioso',
          'Cultura y museos'
        ]
      },
      {
        slug: 'peatonalizacion-centro',
        title: 'Peatonalización del centro',
        questionText: '¿Apoyás la peatonalización del centro los fines de semana?',
        mechanism: 'support'
      }
    ]
  },
  {
    slug: `${DEMO_SLUG_PREFIX}pilar-espacios-verdes`,
    title: 'Nuevos espacios verdes en Pilar',
    summary: 'Definimos el futuro de un predio baldío para recuperarlo como espacio verde público.',
    sectionSlug: 'observatorio-obras-servicios',
    format: 'single',
    topics: [
      {
        slug: 'predio-parque',
        title: 'Predio baldío a parque público',
        questionText: '¿Convertir el predio baldío en un parque público?',
        mechanism: 'vote'
      }
    ]
  },
  {
    slug: `${DEMO_SLUG_PREFIX}la-matanza-alumbrado`,
    title: 'Plan de alumbrado y seguridad barrial en La Matanza',
    summary: 'Priorizamos el recambio y ampliación del alumbrado público en los barrios más afectados.',
    sectionSlug: 'observatorio-obras-servicios',
    format: 'multiple',
    topics: [
      {
        slug: 'alumbrado-estaciones',
        title: 'Alumbrado en accesos a estaciones',
        questionText: '¿Priorizar el alumbrado en accesos a estaciones de tren?',
        mechanism: 'vote'
      },
      {
        slug: 'barrio-prioritario',
        title: 'Barrio prioritario',
        questionText: '¿Qué barrio necesita más iluminación con urgencia?',
        mechanism: 'survey',
        surveyOptions: [
          'San Justo',
          'Ramos Mejía',
          'González Catán',
          'Gregorio de Laferrere'
        ]
      }
    ]
  },
  {
    slug: `${DEMO_SLUG_PREFIX}berazategui-costa`,
    title: 'Recuperación de la costa de Berazategui',
    summary: 'Impulsamos el saneamiento y el acceso público a la franja costera del municipio.',
    sectionSlug: 'dialogos',
    format: 'single',
    topics: [
      {
        slug: 'saneamiento-costa',
        title: 'Saneamiento y acceso a la costa',
        questionText: '¿Apoyás el saneamiento y el acceso público a la costa?',
        mechanism: 'support'
      }
    ]
  },
  {
    slug: `${DEMO_SLUG_PREFIX}vicente-lopez-accesibilidad`,
    title: 'Accesibilidad en veredas y edificios públicos de Vicente López',
    summary: 'Trabajamos para que veredas, cruces y edificios públicos sean accesibles para todas las personas.',
    sectionSlug: 'audiencias-publicas',
    format: 'multiple',
    topics: [
      {
        slug: 'rampas-cruces',
        title: 'Rampas en cruces peatonales',
        questionText: '¿Priorizar la instalación de rampas en cruces peatonales?',
        mechanism: 'vote'
      },
      {
        slug: 'edificio-adaptar',
        title: 'Edificio público a adaptar',
        questionText: '¿Qué edificio público deberíamos adaptar primero?',
        mechanism: 'survey',
        surveyOptions: [
          'Palacio municipal',
          'Centros de salud',
          'Bibliotecas populares',
          'Polideportivos'
        ]
      }
    ]
  },
  {
    slug: `${DEMO_SLUG_PREFIX}escobar-politicas-juventud`,
    title: 'Políticas de juventud en Escobar',
    summary: 'Definimos junto a las juventudes qué actividades y beneficios impulsar en el municipio.',
    sectionSlug: 'encuentros-regionales',
    format: 'multiple',
    topics: [
      {
        slug: 'actividades-jovenes',
        title: 'Actividades para jóvenes',
        questionText: '¿Qué actividades para jóvenes deberíamos priorizar?',
        mechanism: 'survey',
        surveyOptions: [
          'Deportes y torneos',
          'Formación en oficios digitales',
          'Recitales y cultura',
          'Voluntariado ambiental'
        ]
      },
      {
        slug: 'boleto-joven',
        title: 'Boleto joven para eventos culturales',
        questionText: '¿Crear un boleto joven para eventos culturales?',
        mechanism: 'vote'
      },
      {
        slug: 'coworking-gratuito',
        title: 'Coworking gratuito para emprendedores',
        questionText: '¿Apoyás un espacio de coworking gratuito para jóvenes emprendedores?',
        mechanism: 'support'
      }
    ]
  }
]

export interface DemoSeedOptions {
  /** Cantidad de consultas demo a crear (por defecto 12, máximo 15). */
  count?: number
}

interface DemoUser {
  id: number
}

type DemoLifecycle = 'open' | 'scheduled' | 'closed'

function clampCount(requested: number | undefined): number {
  if (requested === undefined || Number.isNaN(requested)) {
    return DEFAULT_CONSULTATION_COUNT
  }
  return Math.max(1, Math.min(MAX_CONSULTATION_COUNT, Math.floor(requested)))
}

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * DAY_MS)
}

/**
 * Distribuye los estados del ciclo de vida de forma determinística para tener
 * una mezcla realista de consultas abiertas, programadas y cerradas.
 */
function lifecycleForIndex(index: number): DemoLifecycle {
  const position = index % 5
  if (position === 3) {
    return 'closed'
  }
  if (position === 4) {
    return 'scheduled'
  }
  return 'open'
}

interface ConsultationDates {
  visibility: Visibility
  resultsVisibility: ResultsVisibility
  startsAt: Date
  endsAt: Date
  publishedAt: Date | null
}

/**
 * Ventanas dentro del rango pedido: desde una semana antes de la corrida hasta
 * siete semanas hacia adelante.
 */
function buildConsultationDates(lifecycle: DemoLifecycle, now: Date): ConsultationDates {
  if (lifecycle === 'closed') {
    const startsAt = addDays(now, -faker.number.int({ min: 5, max: 7 }))
    const endsAt = addDays(now, -faker.number.int({ min: 1, max: 3 }))
    return {
      visibility: Visibility.visible,
      resultsVisibility: ResultsVisibility.public,
      startsAt,
      endsAt,
      publishedAt: startsAt
    }
  }

  if (lifecycle === 'scheduled') {
    const startsAt = addDays(now, faker.number.int({ min: 3, max: 14 }))
    const endsAt = addDays(startsAt, faker.number.int({ min: 14, max: 28 }))
    const maxEnd = addDays(now, 49)
    return {
      visibility: Visibility.visible,
      resultsVisibility: ResultsVisibility.hidden,
      startsAt,
      endsAt: endsAt > maxEnd ? maxEnd : endsAt,
      publishedAt: now
    }
  }

  const startsAt = addDays(now, -faker.number.int({ min: 1, max: 7 }))
  const endsAt = addDays(now, faker.number.int({ min: 14, max: 45 }))
  return {
    visibility: Visibility.visible,
    resultsVisibility: ResultsVisibility.participants_only,
    startsAt,
    endsAt,
    publishedAt: startsAt
  }
}

function mechanismEnum(mechanism: DemoMechanism): MechanismType {
  switch (mechanism) {
    case 'support':
      return MechanismType.support
    case 'vote':
      return MechanismType.vote
    case 'survey':
      return MechanismType.survey
  }
}

function randomVoteValue(): VoteValue {
  return faker.helpers.weightedArrayElement([
    { weight: 5, value: VoteValue.in_favor },
    { weight: 3, value: VoteValue.against },
    { weight: 2, value: VoteValue.abstain }
  ])
}

function mechanismLabel(mechanism: DemoMechanism): string {
  if (mechanism === 'support') {
    return 'Apoyo'
  }
  if (mechanism === 'vote') {
    return 'Votación'
  }
  return 'Encuesta'
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-AR')
}

function buildDescriptionMarkdown(
  template: DemoConsultationTemplate,
  dates: ConsultationDates
): string {
  const objetivoEspecifico = faker.helpers.arrayElement([
    'mejorar la calidad del espacio público',
    'reducir desigualdades territoriales entre barrios',
    'priorizar intervenciones con impacto cotidiano',
    'fortalecer la convivencia y la seguridad urbana'
  ])

  return [
    '## Descripción general',
    '',
    template.summary,
    '',
    `Esta consulta se impulsa con el objetivo de **${objetivoEspecifico}** y de ordenar prioridades de inversión municipal con criterios públicos y trazables.`,
    '',
    '### ¿Por qué esta consulta ahora?',
    '',
    faker.lorem.paragraph(),
    '',
    '### Alcance territorial',
    '',
    '- Incluye zonas céntricas y barrios periféricos.',
    '- Considera condiciones de accesibilidad, seguridad y mantenimiento.',
    '- Integra aportes de organizaciones comunitarias e instituciones locales.',
    '',
    `> Ventana prevista de participación: **${formatDate(dates.startsAt)}** a **${formatDate(dates.endsAt)}**.`,
    '',
    '### Criterios de evaluación',
    '',
    '1. Impacto social y territorial.',
    '2. Factibilidad técnica y presupuestaria.',
    '3. Equidad en la distribución de beneficios.',
    '',
    '_La información de contexto se actualiza durante el proceso cuando hay novedades técnicas o administrativas._'
  ].join('\n')
}

function buildContextMarkdown(template: DemoConsultationTemplate): string {
  const topicsSection = template.topics
    .map((topic, index) => `| ${index + 1} | ${topic.title} | ${mechanismLabel(topic.mechanism)} |`)
    .join('\n')

  return [
    '## Contexto y metodología',
    '',
    'Para facilitar una participación informada, publicamos los ejes temáticos, los mecanismos de intervención y una guía breve de lectura.',
    '',
    '### Temas habilitados en esta consulta',
    '',
    '| # | Tema | Mecanismo |',
    '|---|------|-----------|',
    topicsSection,
    '',
    '### Cómo participar',
    '',
    '- Leé cada tema y su pregunta guía.',
    '- Elegí el mecanismo de participación correspondiente.',
    '- Podés dejar comentarios para fundamentar tu postura.',
    '',
    '### Transparencia',
    '',
    'Los resultados se publican conforme al estado de la consulta y al tipo de mecanismo. Además, se incorporan informes de seguimiento cuando corresponde.',
    '',
    `Más información sobre participación ciudadana en [gobierno abierto](https://www.argentina.gob.ar/justicia/derechofacil/leysimple/gobierno-abierto).`
  ].join('\n')
}

async function ensureDemoCitizens(prisma: PrismaClient, now: Date): Promise<DemoUser[]> {
  const passwordHash = await hashSeedPassword(DEMO_PASSWORD)
  const citizens: DemoUser[] = []

  for (let i = 1; i <= DEMO_CITIZEN_COUNT; i++) {
    const email = `${DEMO_CITIZEN_EMAIL_PREFIX}${i}@consultas.local`
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const displayName = `${firstName} ${lastName}`

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        firstName,
        lastName,
        displayName,
        status: UserStatus.active,
        emailVerifiedAt: now,
        passwordHash
      },
      create: {
        email,
        firstName,
        lastName,
        displayName,
        status: UserStatus.active,
        emailVerifiedAt: now,
        passwordHash
      },
      select: { id: true }
    })

    citizens.push(user)
  }

  return citizens
}

interface CommentContainer {
  consultationId: number | null
  topicId: number | null
}

async function addReactions(
  prisma: PrismaClient,
  commentId: number,
  citizens: DemoUser[]
): Promise<void> {
  const reactorCount = faker.number.int({ min: 0, max: 4 })
  const reactors = faker.helpers.arrayElements(citizens, reactorCount)

  for (const reactor of reactors) {
    await prisma.commentReaction.create({
      data: {
        commentId,
        userId: reactor.id,
        reactionType: faker.helpers.arrayElement(REACTION_TYPES)
      }
    })
  }
}

async function createCommentTree(
  prisma: PrismaClient,
  container: CommentContainer,
  citizens: DemoUser[],
  institutionUserId: number
): Promise<void> {
  const asInstitution = faker.datatype.boolean(0.15)
  const author = asInstitution ? { id: institutionUserId } : faker.helpers.arrayElement(citizens)

  const root = await prisma.comment.create({
    data: {
      consultationId: container.consultationId,
      topicId: container.topicId,
      authorUserId: author.id,
      authorMode: asInstitution ? CommentAuthorMode.institution : CommentAuthorMode.citizen,
      body: faker.lorem.paragraph()
    },
    select: { id: true }
  })

  await addReactions(prisma, root.id, citizens)

  const replyCount = faker.number.int({ min: 0, max: 6 })
  for (let r = 0; r < replyCount; r++) {
    const replyAsInstitution = faker.datatype.boolean(0.1)
    const replyAuthor = replyAsInstitution
      ? { id: institutionUserId }
      : faker.helpers.arrayElement(citizens)

    const reply = await prisma.comment.create({
      data: {
        consultationId: container.consultationId,
        topicId: container.topicId,
        parentCommentId: root.id,
        authorUserId: replyAuthor.id,
        authorMode: replyAsInstitution ? CommentAuthorMode.institution : CommentAuthorMode.citizen,
        body: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 }))
      },
      select: { id: true }
    })

    await addReactions(prisma, reply.id, citizens)
  }
}

interface CreatedTopic {
  id: number
  mechanism: DemoMechanism
  surveyOptionIds: number[]
}

async function createParticipations(
  prisma: PrismaClient,
  topic: CreatedTopic,
  citizens: DemoUser[]
): Promise<void> {
  const participantCount = faker.number.int({
    min: Math.min(4, citizens.length),
    max: Math.min(citizens.length, 12)
  })
  const participants = faker.helpers.arrayElements(citizens, participantCount)

  for (const participant of participants) {
    if (topic.mechanism === 'support') {
      await prisma.supportParticipation.create({
        data: { topicId: topic.id, userId: participant.id }
      })
    } else if (topic.mechanism === 'vote') {
      await prisma.voteParticipation.create({
        data: { topicId: topic.id, userId: participant.id, voteValue: randomVoteValue() }
      })
    } else if (topic.mechanism === 'survey' && topic.surveyOptionIds.length > 0) {
      await prisma.surveyParticipation.create({
        data: {
          topicId: topic.id,
          userId: participant.id,
          surveyOptionId: faker.helpers.arrayElement(topic.surveyOptionIds)
        }
      })
    }
  }
}

async function createConsultationFromTemplate(
  prisma: PrismaClient,
  template: DemoConsultationTemplate,
  index: number,
  now: Date,
  context: {
    collaboratorIds: number[]
    adminId: number
    citizens: DemoUser[]
    sectionIdBySlug: Map<string, number>
  }
): Promise<void> {
  const lifecycle = lifecycleForIndex(index)
  const dates = buildConsultationDates(lifecycle, now)

  // Reparto determinístico de la administración entre las personas colaboradoras.
  // El creador rota por índice y, en una de cada tres consultas, se suma un
  // segundo colaborador como co-administrador para reflejar la gestión compartida.
  const collaboratorIds = context.collaboratorIds
  const creatorId = collaboratorIds[index % collaboratorIds.length]!
  const adminUserIds = [creatorId]
  if (collaboratorIds.length > 1 && index % 3 === 2) {
    const coAdminId = collaboratorIds[(index + 1) % collaboratorIds.length]!
    if (coAdminId !== creatorId) {
      adminUserIds.push(coAdminId)
    }
  }

  // Una de cada cinco consultas queda sin sección para reflejar que la
  // pertenencia a una sección es opcional (igual aparece en el listado general).
  const sectionId = index % 5 === 0
    ? null
    : context.sectionIdBySlug.get(template.sectionSlug) ?? null

  const consultation = await prisma.consultation.create({
    data: {
      slug: template.slug,
      title: template.title,
      summary: template.summary,
      body: [buildDescriptionMarkdown(template, dates), buildContextMarkdown(template)].join('\n\n'),
      consultationFormat:
        template.format === 'multiple' ? ConsultationFormat.multiple : ConsultationFormat.single,
      visibility: dates.visibility,
      resultsVisibility: dates.resultsVisibility,
      featured: index % 4 === 0,
      startsAt: dates.startsAt,
      endsAt: dates.endsAt,
      publishedAt: dates.publishedAt,
      sectionId,
      createdByUserId: creatorId,
      updatedByUserId: creatorId
    },
    select: { id: true }
  })

  // Membresías de administración por consulta: sin ellas ningún colaborador
  // puede gestionar la consulta ni verla en /mi-cuenta/consultas.
  for (const adminUserId of adminUserIds) {
    await prisma.consultationMembership.create({
      data: {
        consultationId: consultation.id,
        userId: adminUserId,
        role: ConsultationRole.consultation_admin,
        assignedByUserId: context.adminId
      }
    })
  }

  const createdTopics: CreatedTopic[] = []

  for (let t = 0; t < template.topics.length; t++) {
    const topicTemplate = template.topics[t]!
    const topic = await prisma.topic.create({
      data: {
        consultationId: consultation.id,
        slug: topicTemplate.slug,
        title: topicTemplate.title,
        summary: faker.lorem.sentence(),
        body: faker.lorem.paragraph(),
        questionText: topicTemplate.questionText,
        displayOrder: t,
        participationStartsAt: dates.startsAt,
        participationEndsAt: dates.endsAt,
        visibility: Visibility.visible,
        mechanismType: mechanismEnum(topicTemplate.mechanism),
        publishResultsWhenParticipationEnds: lifecycle !== 'scheduled'
      },
      select: { id: true }
    })

    const surveyOptionIds: number[] = []
    if (topicTemplate.mechanism === 'survey' && topicTemplate.surveyOptions) {
      for (let o = 0; o < topicTemplate.surveyOptions.length; o++) {
        const option = await prisma.surveyOption.create({
          data: {
            topicId: topic.id,
            label: topicTemplate.surveyOptions[o]!,
            displayOrder: o,
            isActive: true
          },
          select: { id: true }
        })
        surveyOptionIds.push(option.id)
      }
    }

    createdTopics.push({ id: topic.id, mechanism: topicTemplate.mechanism, surveyOptionIds })
  }

  // Participaciones sólo para consultas ya iniciadas (abiertas o cerradas).
  if (lifecycle !== 'scheduled') {
    for (const topic of createdTopics) {
      await createParticipations(prisma, topic, context.citizens)
    }
  }

  // Comentarios sólo para consultas iniciadas, para reflejar la conversación.
  if (lifecycle !== 'scheduled') {
    const commentCount = faker.number.int({ min: 7, max: 16 })
    for (let c = 0; c < commentCount; c++) {
      const atConsultationLevel = createdTopics.length === 0 || faker.datatype.boolean(0.4)
      const container: CommentContainer = atConsultationLevel
        ? { consultationId: consultation.id, topicId: null }
        : { consultationId: null, topicId: faker.helpers.arrayElement(createdTopics).id }

      await createCommentTree(prisma, container, context.citizens, creatorId)
    }
  }

  console.log(
    `  · ${template.slug} [${lifecycle}] — ${createdTopics.length} tema(s)`
  )
}

export async function seedConsultationsDemo(
  prisma: PrismaClient,
  options: DemoSeedOptions = {}
): Promise<void> {
  const now = new Date()
  const count = clampCount(options.count)

  // Semilla fija de Faker para que las regeneraciones sean reproducibles.
  faker.seed(20260707)

  const collaborators = await prisma.user.findMany({
    where: { email: { in: COLLABORATOR_EMAILS } },
    select: { id: true, email: true }
  })
  // Se respeta el orden de COLLABORATOR_EMAILS para que el reparto sea estable.
  const collaboratorIds = COLLABORATOR_EMAILS
    .map(email => collaborators.find(user => user.email === email)?.id)
    .filter((id): id is number => id !== undefined)
  if (collaboratorIds.length === 0) {
    throw new Error(
      `Faltan las personas colaboradoras (${COLLABORATOR_EMAILS.join(', ')}). Ejecutá el perfil "base" antes que "demo".`
    )
  }

  const admin = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true }
  })
  if (!admin) {
    throw new Error(
      `Falta el usuario ${ADMIN_EMAIL}. Ejecutá el perfil "base" antes que "demo".`
    )
  }

  const sections = await prisma.section.findMany({ select: { id: true, slug: true } })
  if (sections.length === 0) {
    throw new Error('No hay secciones. Ejecutá el perfil "institution" antes que "demo".')
  }

  const sectionIdBySlug = new Map(sections.map(s => [s.slug, s.id]))

  // Regeneración completa: borra el dataset demo previo. El borrado en cascada
  // arrastra temas, opciones, participaciones, comentarios y reacciones.
  const deleted = await prisma.consultation.deleteMany({
    where: { slug: { startsWith: DEMO_SLUG_PREFIX } }
  })
  console.log(`Regenerando demo: ${deleted.count} consulta(s) previa(s) eliminada(s).`)

  const citizens = await ensureDemoCitizens(prisma, now)

  const templates = CONSULTATION_TEMPLATES.slice(0, count)
  for (let i = 0; i < templates.length; i++) {
    await createConsultationFromTemplate(prisma, templates[i]!, i, now, {
      collaboratorIds,
      adminId: admin.id,
      citizens,
      sectionIdBySlug
    })
  }

  console.log(`Demo lista: ${templates.length} consulta(s) creada(s).`)
}
