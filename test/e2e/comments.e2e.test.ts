import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { createTestPrisma, type TestPrisma } from './db'
import { api, login } from './http'

const CITIZEN_EMAIL = 'ciudadania@consultas.local'
const ADMIN_EMAIL = 'admin@consultas.local'
const DEV_PASSWORD = 'Cambiar1234'
const CITIZEN_LABEL = 'Usuario Ciudadano'

interface PublicComment {
  id: number
  containerType: 'consultation' | 'topic'
  consultationId: number | null
  topicId: number | null
  parentCommentId: number | null
  body: string
  authorMode: 'citizen' | 'institution'
  authorLabel: string | null
  reactions: { counts: Record<string, number>, mine: string[] }
  replies?: PublicComment[]
}

interface AdminComment extends PublicComment {
  moderationStatus: 'visible' | 'hidden' | 'deleted'
}

describe('Server e2e: routing anidado + comentarios (fase 6)', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  let citizenCookie: string
  let adminCookie: string
  let institutionName: string | null

  let openConsultationId: number
  let openConsultationSlug: string
  let closedConsultationId: number
  let topicId: number
  let reactionCommentId: number
  let moderationCommentId: number

  const createdConsultationIds: number[] = []

  beforeAll(async () => {
    prisma = createTestPrisma()

    const admin = await prisma.user.findUniqueOrThrow({ where: { email: ADMIN_EMAIL }, select: { id: true } })
    const citizen = await prisma.user.findUniqueOrThrow({ where: { email: CITIZEN_EMAIL }, select: { id: true } })
    const institution = await prisma.platformSettings.findFirst({ select: { name: true }, orderBy: { id: 'asc' } })
    institutionName = institution?.name ?? null

    const now = Date.now()
    const past = new Date(now - 60 * 60 * 1000)
    const future = new Date(now + 60 * 60 * 1000)

    const openConsultation = await prisma.consultation.create({
      data: {
        slug: `e2e-open-${now}`,
        title: 'Consulta abierta e2e',
        visibility: 'visible',
        publishedAt: new Date(),
        startsAt: past,
        endsAt: future,
        resultsVisibility: 'public',
        createdByUserId: admin.id
      }
    })
    openConsultationId = openConsultation.id
    openConsultationSlug = openConsultation.slug
    createdConsultationIds.push(openConsultation.id)

    const topic = await prisma.topic.create({
      data: {
        consultationId: openConsultation.id,
        slug: 'tema-e2e',
        title: 'Tema e2e',
        visibility: 'visible',
        mechanismType: 'support',
        participationStartsAt: past
      }
    })
    topicId = topic.id

    const closedConsultation = await prisma.consultation.create({
      data: {
        slug: `e2e-closed-${now}`,
        title: 'Consulta cerrada e2e',
        visibility: 'visible',
        publishedAt: new Date(),
        startsAt: new Date(now - 2 * 60 * 60 * 1000),
        endsAt: past,
        resultsVisibility: 'public',
        createdByUserId: admin.id
      }
    })
    closedConsultationId = closedConsultation.id
    createdConsultationIds.push(closedConsultation.id)

    citizenCookie = await login(CITIZEN_EMAIL, DEV_PASSWORD)
    adminCookie = await login(ADMIN_EMAIL, DEV_PASSWORD)

    // Comentarios objetivo para las suites de reacciones y moderación. Se
    // siembran vía Prisma acá (y no en un `beforeAll` anidado) porque el
    // contexto de @nuxt/test-utils sólo está disponible en el hook externo.
    const reactionComment = await prisma.comment.create({
      data: {
        consultationId: openConsultation.id,
        authorUserId: citizen.id,
        body: 'Comentario para reaccionar',
        authorMode: 'citizen'
      }
    })
    reactionCommentId = reactionComment.id

    const moderationComment = await prisma.comment.create({
      data: {
        consultationId: openConsultation.id,
        authorUserId: citizen.id,
        body: 'Comentario a moderar',
        authorMode: 'citizen'
      }
    })
    moderationCommentId = moderationComment.id
  })

  afterAll(async () => {
    if (!prisma) return
    // Limpieza en orden por dependencias (reacciones → comentarios → temas → consultas).
    const comments = await prisma.comment.findMany({
      where: {
        OR: [
          { consultationId: { in: createdConsultationIds } },
          { topic: { consultationId: { in: createdConsultationIds } } }
        ]
      },
      select: { id: true }
    })
    const commentIds = comments.map(c => c.id)
    if (commentIds.length > 0) {
      await prisma.commentReaction.deleteMany({ where: { commentId: { in: commentIds } } })
      // Borrar respuestas antes que raíces para respetar la auto-relación.
      await prisma.comment.deleteMany({ where: { id: { in: commentIds }, parentCommentId: { not: null } } })
      await prisma.comment.deleteMany({ where: { id: { in: commentIds } } })
    }
    await prisma.topic.deleteMany({ where: { consultationId: { in: createdConsultationIds } } })
    await prisma.consultation.deleteMany({ where: { id: { in: createdConsultationIds } } })
    await prisma.$disconnect()
  })

  describe('Routing anidado (fix [slugOrId])', () => {
    it('resuelve rutas anidadas por id numérico', async () => {
      const res = await api(`/api/consultations/${openConsultationId}/topics`)
      expect(res.status).toBe(200)
      expect(Array.isArray(res.data)).toBe(true)
    })

    it('resuelve la consulta por slug', async () => {
      const res = await api<{ id: number }>(`/api/consultations/${openConsultationSlug}`)
      expect(res.status).toBe(200)
      expect(res.data.id).toBe(openConsultationId)
    })

    it('resuelve la consulta por id numérico', async () => {
      const res = await api<{ id: number }>(`/api/consultations/${openConsultationId}`)
      expect(res.status).toBe(200)
      expect(res.data.id).toBe(openConsultationId)
    })

    it('lista comentarios públicos de la consulta (array)', async () => {
      const res = await api(`/api/consultations/${openConsultationId}/comments`)
      expect(res.status).toBe(200)
      expect(Array.isArray(res.data)).toBe(true)
    })

    it('devuelve 404 para una consulta inexistente por slug', async () => {
      const res = await api('/api/consultations/no-existe-jamas')
      expect(res.status).toBe(404)
    })
  })

  describe('Creación de comentarios', () => {
    it('rechaza crear sin sesión (401)', async () => {
      const res = await api(`/api/consultations/${openConsultationId}/comments`, {
        method: 'POST',
        body: { body: 'Anónimo' }
      })
      expect(res.status).toBe(401)
    })

    it('un ciudadano crea un comentario a nivel consulta (201)', async () => {
      const res = await api<PublicComment>(`/api/consultations/${openConsultationId}/comments`, {
        method: 'POST',
        cookie: citizenCookie,
        body: { body: 'Mi primer comentario' }
      })
      expect(res.status).toBe(201)
      expect(res.data.containerType).toBe('consultation')
      expect(res.data.consultationId).toBe(openConsultationId)
      expect(res.data.topicId).toBeNull()
      expect(res.data.authorMode).toBe('citizen')
      expect(res.data.authorLabel).toBe(CITIZEN_LABEL)
      expect(res.data.parentCommentId).toBeNull()
    })

    it('un ciudadano crea un comentario a nivel tema (201)', async () => {
      const res = await api<PublicComment>(`/api/consultations/${openConsultationId}/topics/${topicId}/comments`, {
        method: 'POST',
        cookie: citizenCookie,
        body: { body: 'Comentario sobre el tema' }
      })
      expect(res.status).toBe(201)
      expect(res.data.containerType).toBe('topic')
      expect(res.data.topicId).toBe(topicId)
      expect(res.data.consultationId).toBeNull()
    })

    it('permite responder a un comentario raíz (un solo nivel)', async () => {
      const root = await api<PublicComment>(`/api/consultations/${openConsultationId}/comments`, {
        method: 'POST',
        cookie: citizenCookie,
        body: { body: 'Raíz para responder' }
      })
      expect(root.status).toBe(201)

      const reply = await api<PublicComment>(`/api/consultations/${openConsultationId}/comments`, {
        method: 'POST',
        cookie: citizenCookie,
        body: { body: 'Una respuesta', parentCommentId: root.data.id }
      })
      expect(reply.status).toBe(201)
      expect(reply.data.parentCommentId).toBe(root.data.id)

      // Responder a una respuesta debe fallar (422): solo un nivel.
      const nested = await api(`/api/consultations/${openConsultationId}/comments`, {
        method: 'POST',
        cookie: citizenCookie,
        body: { body: 'Respuesta anidada', parentCommentId: reply.data.id }
      })
      expect(nested.status).toBe(422)
    })

    it('rechaza cuerpo vacío (422)', async () => {
      const res = await api(`/api/consultations/${openConsultationId}/comments`, {
        method: 'POST',
        cookie: citizenCookie,
        body: { body: '   ' }
      })
      expect(res.status).toBe(422)
    })
  })

  describe('Autoría institucional', () => {
    it('un admin puede comentar como institución', async () => {
      const res = await api<PublicComment>(`/api/consultations/${openConsultationId}/comments`, {
        method: 'POST',
        cookie: adminCookie,
        body: { body: 'Comunicado oficial', authorMode: 'institution' }
      })
      expect(res.status).toBe(201)
      expect(res.data.authorMode).toBe('institution')
      expect(res.data.authorLabel).toBe(institutionName)
    })

    it('un ciudadano no puede comentar como institución (403)', async () => {
      const res = await api(`/api/consultations/${openConsultationId}/comments`, {
        method: 'POST',
        cookie: citizenCookie,
        body: { body: 'Intento de suplantación', authorMode: 'institution' }
      })
      expect(res.status).toBe(403)
    })
  })

  describe('Reacciones', () => {
    it('agrega una reacción (201) y la contabiliza', async () => {
      const res = await api<PublicComment>(`/api/comments/${reactionCommentId}/reactions`, {
        method: 'POST',
        cookie: citizenCookie,
        body: { reactionType: 'heart' }
      })
      expect(res.status).toBe(201)
      expect(res.data.reactions.counts.heart).toBe(1)
      expect(res.data.reactions.mine).toContain('heart')
    })

    it('es idempotente al repetir la misma reacción', async () => {
      const res = await api<PublicComment>(`/api/comments/${reactionCommentId}/reactions`, {
        method: 'POST',
        cookie: citizenCookie,
        body: { reactionType: 'heart' }
      })
      expect(res.status).toBe(201)
      expect(res.data.reactions.counts.heart).toBe(1)
    })

    it('quita la reacción (204) y actualiza el conteo', async () => {
      const del = await api(`/api/comments/${reactionCommentId}/reactions`, {
        method: 'DELETE',
        cookie: citizenCookie,
        body: { reactionType: 'heart' }
      })
      expect(del.status).toBe(204)

      const check = await api<PublicComment>(`/api/comments/${reactionCommentId}`, { cookie: citizenCookie })
      expect(check.status).toBe(200)
      expect(check.data.reactions.counts.heart).toBe(0)
    })
  })

  describe('Moderación y borrado', () => {
    it('un ciudadano no puede moderar (403)', async () => {
      const res = await api(`/api/comments/${moderationCommentId}/moderation`, {
        method: 'POST',
        cookie: citizenCookie,
        body: { moderationStatus: 'hidden' }
      })
      expect(res.status).toBe(403)
    })

    it('un admin oculta el comentario y desaparece del hilo público', async () => {
      const mod = await api<AdminComment>(`/api/comments/${moderationCommentId}/moderation`, {
        method: 'POST',
        cookie: adminCookie,
        body: { moderationStatus: 'hidden' }
      })
      expect(mod.status).toBe(200)
      expect(mod.data.moderationStatus).toBe('hidden')

      const publicList = await api<PublicComment[]>(`/api/consultations/${openConsultationId}/comments`)
      expect(publicList.status).toBe(200)
      expect(publicList.data.some(c => c.id === moderationCommentId)).toBe(false)
    })

    it('el público no puede ver un comentario oculto (404) pero el admin sí', async () => {
      const asPublic = await api(`/api/comments/${moderationCommentId}`)
      expect(asPublic.status).toBe(404)

      const asAdmin = await api<AdminComment>(`/api/comments/${moderationCommentId}`, { cookie: adminCookie })
      expect(asAdmin.status).toBe(200)
      expect(asAdmin.data.moderationStatus).toBe('hidden')
    })

    it('no se puede reaccionar sobre un comentario no visible (404)', async () => {
      const res = await api(`/api/comments/${moderationCommentId}/reactions`, {
        method: 'POST',
        cookie: citizenCookie,
        body: { reactionType: 'agree' }
      })
      expect(res.status).toBe(404)
    })

    it('un admin borra el comentario (204) y el borrado es final (409)', async () => {
      const del = await api(`/api/comments/${moderationCommentId}`, { method: 'DELETE', cookie: adminCookie })
      expect(del.status).toBe(204)

      const remod = await api(`/api/comments/${moderationCommentId}/moderation`, {
        method: 'POST',
        cookie: adminCookie,
        body: { moderationStatus: 'visible' }
      })
      expect(remod.status).toBe(409)
    })
  })

  describe('Ventana de comentarios cerrada', () => {
    it('no permite comentar en una consulta cerrada (403)', async () => {
      const res = await api(`/api/consultations/${closedConsultationId}/comments`, {
        method: 'POST',
        cookie: citizenCookie,
        body: { body: 'Fuera de término' }
      })
      expect(res.status).toBe(403)
    })
  })

  describe('Bandeja de moderación (admin)', () => {
    it('devuelve items + paginación con scope=all', async () => {
      const res = await api<{ items: AdminComment[], pagination: { total: number } }>(
        `/api/consultations/${openConsultationId}/comments?scope=all`,
        { cookie: adminCookie }
      )
      expect(res.status).toBe(200)
      expect(Array.isArray(res.data.items)).toBe(true)
      expect(res.data.pagination.total).toBeGreaterThan(0)
    })

    it('filtra por estado de moderación', async () => {
      const res = await api<{ items: AdminComment[] }>(
        `/api/consultations/${openConsultationId}/comments?moderationStatus=deleted`,
        { cookie: adminCookie }
      )
      expect(res.status).toBe(200)
      expect(res.data.items.every(c => c.moderationStatus === 'deleted')).toBe(true)
    })

    it('exige topicId cuando scope=topic (422)', async () => {
      const res = await api(
        `/api/consultations/${openConsultationId}/comments?scope=topic`,
        { cookie: adminCookie }
      )
      expect(res.status).toBe(422)
    })

    it('el DTO admin expone el email del autor; el público no', async () => {
      const asAdmin = await api<{ items: (AdminComment & { authorEmail?: string })[] }>(
        `/api/consultations/${openConsultationId}/comments?scope=all`,
        { cookie: adminCookie }
      )
      expect(asAdmin.status).toBe(200)
      expect(asAdmin.data.items.every(c => typeof c.authorEmail === 'string' && c.authorEmail.length > 0)).toBe(true)

      const asPublic = await api<Record<string, unknown>[]>(`/api/consultations/${openConsultationId}/comments`)
      expect(asPublic.status).toBe(200)
      expect(asPublic.data.every(c => !('authorEmail' in c))).toBe(true)
    })
  })

  describe('Bandeja de moderación del tema (admin)', () => {
    let topicCommentId: number

    it('siembra un comentario de tema vía API pública (ventana abierta)', async () => {
      const created = await api<AdminComment>(
        `/api/consultations/${openConsultationId}/topics/${topicId}/comments`,
        {
          method: 'POST',
          cookie: citizenCookie,
          body: { body: 'Comentario de tema para moderar' }
        }
      )
      expect(created.status).toBe(201)
      topicCommentId = created.data.id
    })

    it('el admin recibe la bandeja del tema con items + paginación', async () => {
      const res = await api<{ items: (AdminComment & { authorEmail: string })[], pagination: { total: number } }>(
        `/api/consultations/${openConsultationId}/topics/${topicId}/comments`,
        { cookie: adminCookie }
      )
      expect(res.status).toBe(200)
      expect(Array.isArray(res.data.items)).toBe(true)
      expect(res.data.items.some(c => c.id === topicCommentId)).toBe(true)
      expect(res.data.pagination.total).toBeGreaterThan(0)
      expect(res.data.items.every(c => c.moderationStatus !== undefined)).toBe(true)
    })

    it('el público recibe el hilo del tema, no la bandeja', async () => {
      const res = await api<PublicComment[]>(
        `/api/consultations/${openConsultationId}/topics/${topicId}/comments`
      )
      expect(res.status).toBe(200)
      expect(Array.isArray(res.data)).toBe(true)
    })
  })
})
