import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { createTestPrisma, type TestPrisma } from './db'
import { api, login } from './http'

const ADMIN_EMAIL = 'admin@consultas.local'
const CITIZEN_EMAIL = 'ciudadania@consultas.local'
const DEV_PASSWORD = 'Cambiar1234'

interface PublicMetric {
  id: number
  key: string
  label: string
  value: string
  displayOrder: number
}

interface AdminMetric extends PublicMetric {
  createdAt: string
  updatedAt: string
}

describe('Server e2e: métricas del Observatorio', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  let adminCookie: string
  let citizenCookie: string
  let metricId: number

  beforeAll(async () => {
    prisma = createTestPrisma()
    adminCookie = await login(ADMIN_EMAIL, DEV_PASSWORD)
    citizenCookie = await login(CITIZEN_EMAIL, DEV_PASSWORD)

    const metric = await prisma.observatoryMetric.create({
      data: {
        key: `e2e-metrica-${Date.now()}`,
        label: 'Etiqueta inicial e2e',
        value: '10',
        displayOrder: 999
      }
    })
    metricId = metric.id
  })

  afterAll(async () => {
    await prisma.observatoryMetric.delete({ where: { id: metricId } })
    await prisma.$disconnect()
  })

  it('devuelve una vista pública sin timestamps y ordenada por displayOrder', async () => {
    const res = await api<PublicMetric[]>('/api/observatory-metrics')

    expect(res.status).toBe(200)
    expect(res.data.every(metric => !('createdAt' in metric) && !('updatedAt' in metric))).toBe(true)
    expect(res.data.map(metric => metric.displayOrder)).toEqual([...res.data]
      .sort((first, second) => first.displayOrder - second.displayOrder)
      .map(metric => metric.displayOrder))
  })

  it('rechaza la edición de una persona sin rol de plataforma', async () => {
    const res = await api(`/api/observatory-metrics/${metricId}`, {
      method: 'PATCH',
      cookie: citizenCookie,
      body: { label: 'No debería guardar', value: '0' }
    })

    expect(res.status).toBe(403)
  })

  it('valida el payload antes de autorizar o actualizar', async () => {
    const res = await api(`/api/observatory-metrics/${metricId}`, {
      method: 'PATCH',
      body: { label: '', value: '' }
    })

    expect(res.status).toBe(422)
  })

  it('permite al administrador editar valor y etiqueta sin cambiar clave ni orden', async () => {
    const res = await api<AdminMetric>(`/api/observatory-metrics/${metricId}`, {
      method: 'PATCH',
      cookie: adminCookie,
      body: { label: 'Etiqueta actualizada e2e', value: '+130' }
    })

    expect(res.status).toBe(200)
    expect(res.data).toMatchObject({
      id: metricId,
      label: 'Etiqueta actualizada e2e',
      value: '+130',
      displayOrder: 999
    })
    expect(res.data.createdAt).toEqual(expect.any(String))
    expect(res.data.updatedAt).toEqual(expect.any(String))

    const stored = await prisma.observatoryMetric.findUniqueOrThrow({ where: { id: metricId } })
    expect(stored.key).toMatch(/^e2e-metrica-/)
    expect(stored.displayOrder).toBe(999)
  })
})
