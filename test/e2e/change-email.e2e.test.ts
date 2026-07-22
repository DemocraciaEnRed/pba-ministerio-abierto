import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { createHash, randomBytes } from 'node:crypto'
import { createTestPrisma, type TestPrisma } from './db'
import { api, login } from './http'

const CITIZEN_EMAIL = 'ciudadania@consultas.local'
const ADMIN_EMAIL = 'admin@consultas.local'
const DEV_PASSWORD = 'Cambiar1234'

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

describe('Server e2e: cambio de email', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  let citizenCookie: string
  const createdUserIds: number[] = []

  beforeAll(async () => {
    prisma = createTestPrisma()
    citizenCookie = await login(CITIZEN_EMAIL, DEV_PASSWORD)
  })

  afterAll(async () => {
    if (!prisma) return
    // Tokens de cambio creados durante los tests (para el ciudadano y los usuarios dedicados).
    await prisma.verificationToken.deleteMany({ where: { type: 'email_change' } })
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
    }
    await prisma.$disconnect()
  })

  describe('Solicitud (POST /api/me/change-email)', () => {
    it('rechaza sin sesión (401)', async () => {
      const res = await api('/api/me/change-email', {
        method: 'POST',
        body: { newEmail: 'nuevo@e2e.local', currentPassword: DEV_PASSWORD }
      })
      expect(res.status).toBe(401)
    })

    it('rechaza con contraseña incorrecta (422)', async () => {
      const res = await api('/api/me/change-email', {
        method: 'POST',
        cookie: citizenCookie,
        body: { newEmail: `nuevo-${Date.now()}@e2e.local`, currentPassword: 'incorrecta' }
      })
      expect(res.status).toBe(422)
    })

    it('rechaza si el nuevo email ya está en uso (422)', async () => {
      const res = await api('/api/me/change-email', {
        method: 'POST',
        cookie: citizenCookie,
        body: { newEmail: ADMIN_EMAIL, currentPassword: DEV_PASSWORD }
      })
      expect(res.status).toBe(422)
    })

    it('crea el token de cambio sin modificar el email todavía (200)', async () => {
      const newEmail = `nuevo-${Date.now()}@e2e.local`
      const res = await api('/api/me/change-email', {
        method: 'POST',
        cookie: citizenCookie,
        body: { newEmail, currentPassword: DEV_PASSWORD }
      })
      expect(res.status).toBe(200)

      const citizen = await prisma.user.findUniqueOrThrow({
        where: { email: CITIZEN_EMAIL },
        select: { id: true, email: true }
      })
      // El email actual no cambia hasta confirmar.
      expect(citizen.email).toBe(CITIZEN_EMAIL)

      const token = await prisma.verificationToken.findFirst({
        where: { userId: citizen.id, type: 'email_change', consumedAt: null },
        orderBy: { id: 'desc' }
      })
      expect(token?.newEmail).toBe(newEmail)
    })
  })

  describe('Confirmación (POST /api/auth/change-email)', () => {
    it('rechaza un token inválido (400)', async () => {
      const res = await api('/api/auth/change-email', {
        method: 'POST',
        body: { token: 'token-inexistente' }
      })
      expect(res.status).toBe(400)
    })

    it('confirma el cambio y actualiza el email y su verificación', async () => {
      const originalEmail = `orig-${Date.now()}@e2e.local`
      const targetEmail = `target-${Date.now()}@e2e.local`

      const user = await prisma.user.create({
        data: { email: originalEmail, displayName: 'E2E Cambio', status: 'active' }
      })
      createdUserIds.push(user.id)

      const rawToken = randomBytes(32).toString('hex')
      await prisma.verificationToken.create({
        data: {
          userId: user.id,
          type: 'email_change',
          tokenHash: hashToken(rawToken),
          newEmail: targetEmail,
          expiresAt: new Date(Date.now() + 60_000)
        }
      })

      const res = await api('/api/auth/change-email', {
        method: 'POST',
        body: { token: rawToken }
      })
      expect(res.status).toBe(200)

      const updated = await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { email: true, emailVerifiedAt: true }
      })
      expect(updated.email).toBe(targetEmail)
      expect(updated.emailVerifiedAt).not.toBeNull()
    })

    it('rechaza reutilizar un token ya consumido (400)', async () => {
      const originalEmail = `orig2-${Date.now()}@e2e.local`
      const targetEmail = `target2-${Date.now()}@e2e.local`

      const user = await prisma.user.create({
        data: { email: originalEmail, displayName: 'E2E Cambio 2', status: 'active' }
      })
      createdUserIds.push(user.id)

      const rawToken = randomBytes(32).toString('hex')
      await prisma.verificationToken.create({
        data: {
          userId: user.id,
          type: 'email_change',
          tokenHash: hashToken(rawToken),
          newEmail: targetEmail,
          expiresAt: new Date(Date.now() + 60_000)
        }
      })

      const first = await api('/api/auth/change-email', { method: 'POST', body: { token: rawToken } })
      expect(first.status).toBe(200)

      const second = await api('/api/auth/change-email', { method: 'POST', body: { token: rawToken } })
      expect(second.status).toBe(400)
    })
  })
})
