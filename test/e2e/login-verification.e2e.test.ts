import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { createTestPrisma, type TestPrisma } from './db'
import { api } from './http'

const PASSWORD = 'Cambiar1234'

describe('Server e2e: login requiere email verificado', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  const email = `login-verif-${Date.now()}@e2e.local`

  beforeAll(async () => {
    prisma = createTestPrisma()

    const res = await api('/api/auth/register', {
      method: 'POST',
      body: {
        email,
        password: PASSWORD,
        firstName: 'Login',
        lastName: 'Verif',
        provincia: 'Buenos Aires',
        municipio: 'La Plata',
        phone: '11 12345678',
        representsInstitution: false
      }
    })
    expect(res.status).toBe(202)
  })

  afterAll(async () => {
    if (!prisma) return
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (user) {
      await prisma.verificationToken.deleteMany({ where: { userId: user.id } })
      await prisma.user.delete({ where: { id: user.id } })
    }
    await prisma.$disconnect()
  })

  it('rechaza el login si el correo no está verificado (403)', async () => {
    const res = await api<{ data?: { code?: string } }>('/api/auth/login', {
      method: 'POST',
      body: { email, password: PASSWORD }
    })
    expect(res.status).toBe(403)
    expect(res.data?.data?.code).toBe('email_not_verified')
  })

  it('permite el login una vez verificado el correo (200)', async () => {
    await prisma.user.update({
      where: { email },
      data: { emailVerifiedAt: new Date() }
    })

    const res = await api('/api/auth/login', {
      method: 'POST',
      body: { email, password: PASSWORD }
    })
    expect(res.status).toBe(200)
  })
})
