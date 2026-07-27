import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { createTestPrisma, type TestPrisma } from './db'
import { login } from './http'

const ADMIN_EMAIL = 'admin@consultas.local'
const COLLABORATOR_EMAIL = 'colaborador1@consultas.local'
const CITIZEN_EMAIL = 'ciudadania@consultas.local'
const DEV_PASSWORD = 'Cambiar1234'

// PNG 1x1 transparente válido (mínimo) para las subidas de prueba.
const PNG_1X1_BASE64
  = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

interface InlineAssetResponse {
  id: number
  url: string | null
  mediaType: string
}

interface UploadResult {
  status: number
  data: InlineAssetResponse | { message?: string } | null
}

async function uploadInlineImage(options: { cookie?: string } = {}): Promise<UploadResult> {
  const buffer = Buffer.from(PNG_1X1_BASE64, 'base64')
  const formData = new FormData()
  formData.append('file', new Blob([buffer], { type: 'image/png' }), 'pixel.png')

  const res = await fetch(url('/api/assets/inline'), {
    method: 'POST',
    headers: options.cookie ? { cookie: options.cookie } : {},
    body: formData
  })

  const text = await res.text()
  let data: UploadResult['data'] = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  return { status: res.status, data }
}

describe('Server e2e: subida de imágenes inline del editor', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  let adminCookie: string
  let collaboratorCookie: string
  let citizenCookie: string

  const createdAssetIds: number[] = []

  beforeAll(async () => {
    prisma = createTestPrisma()
    adminCookie = await login(ADMIN_EMAIL, DEV_PASSWORD)
    collaboratorCookie = await login(COLLABORATOR_EMAIL, DEV_PASSWORD)
    citizenCookie = await login(CITIZEN_EMAIL, DEV_PASSWORD)
  })

  afterAll(async () => {
    if (!prisma) return
    if (createdAssetIds.length > 0) {
      await prisma.asset.deleteMany({ where: { id: { in: createdAssetIds } } })
    }
    await prisma.$disconnect()
  })

  it('rechaza la subida sin sesión (401)', async () => {
    const res = await uploadInlineImage()
    expect(res.status).toBe(401)
  })

  it('rechaza la subida de un usuario ciudadano sin rol (403)', async () => {
    const res = await uploadInlineImage({ cookie: citizenCookie })
    expect(res.status).toBe(403)
  })

  it('permite subir a un administrador de plataforma (201) y devuelve la URL', async () => {
    const res = await uploadInlineImage({ cookie: adminCookie })
    expect(res.status).toBe(201)

    const data = res.data as InlineAssetResponse
    expect(data.mediaType).toBe('image')
    expect(typeof data.url).toBe('string')
    expect(data.url).toBeTruthy()
    createdAssetIds.push(data.id)
  })

  it('permite subir a una persona colaboradora (201) y persiste el asset', async () => {
    const res = await uploadInlineImage({ cookie: collaboratorCookie })
    expect(res.status).toBe(201)

    const data = res.data as InlineAssetResponse
    expect(data.url).toBeTruthy()
    createdAssetIds.push(data.id)

    const asset = await prisma.asset.findUniqueOrThrow({
      where: { id: data.id },
      select: { assetType: true, mediaType: true, storagePath: true }
    })
    expect(asset.assetType).toBe('uploaded_file')
    expect(asset.mediaType).toBe('image')
    expect(asset.storagePath).toBeTruthy()
  })
})
