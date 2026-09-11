import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { createTestPrisma, type TestPrisma } from './db'
import { api, login } from './http'

const ADMIN_EMAIL = 'admin@consultas.local'
const CITIZEN_EMAIL = 'ciudadania@consultas.local'
const DEV_PASSWORD = 'Cambiar1234'

const WORK_GROUP_SLUG = 'plan-estrategico-infraestructura'
const PLENARY_WORK_GROUP_SLUG = 'reuniones-plenarias'

interface ContributionPayload {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  provincia?: string
  municipio?: string
  institutionId?: number
  workGroupSlug?: string
  description?: string
  enlaces?: { url: string, title?: string }[]
  hasAttachment?: boolean
  website?: string
}

interface AdminContribution {
  id: number
  email: string
  institutionId: number | null
  institutionName: string
  institutionCategoryName: string
  workGroupSlug: string
  workGroupName: string
  description: string | null
  links: { id: number, url: string, title: string | null }[]
  attachment: { filename: string | null } | null
}

interface ContributionsResponse {
  items: AdminContribution[]
  pagination: { total: number, totalPages: number }
}

interface InstitutionDTO {
  id: number
  categoryId: number
  slug: string
  name: string
  logoUrl: string | null
  websiteUrl: string | null
  isActive?: boolean
}

interface InstitutionCategoryDTO {
  id: number
  slug: string
  name: string
  isActive?: boolean
}

/** POST público multipart de un aporte (`payload` JSON + `file` opcional). */
async function postContribution(
  payload: ContributionPayload,
  options: { cookie?: string, file?: { content: string, filename: string, type: string } } = {}
): Promise<{ status: number, data: unknown }> {
  const formData = new FormData()
  formData.append('payload', JSON.stringify(payload))

  if (options.file) {
    formData.append(
      'file',
      new Blob([options.file.content], { type: options.file.type }),
      options.file.filename
    )
  }

  const res = await fetch(url('/api/observatory-contributions'), {
    method: 'POST',
    headers: options.cookie ? { cookie: options.cookie } : {},
    body: formData
  })

  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  return { status: res.status, data }
}

describe('Server e2e: aportes del Observatorio', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  let adminCookie: string
  let citizenCookie: string

  let categoryId: number
  let institutionId: number
  let inactiveInstitutionId: number
  let institutionInInactiveCategoryId: number
  let inactiveCategoryId: number

  const createdEmails: string[] = []
  const createdCategoryIds: number[] = []

  function buildPayload(overrides: ContributionPayload = {}): ContributionPayload {
    return {
      firstName: 'Ana',
      lastName: 'Pérez',
      email: `aporte-${Math.random().toString(36).slice(2)}@example.com`,
      phone: '11 12345678',
      provincia: 'Buenos Aires',
      municipio: 'La Plata',
      institutionId,
      workGroupSlug: WORK_GROUP_SLUG,
      description: 'Propuesta institucional de mejora de procesos.',
      ...overrides
    }
  }

  beforeAll(async () => {
    prisma = createTestPrisma()

    adminCookie = await login(ADMIN_EMAIL, DEV_PASSWORD)
    citizenCookie = await login(CITIZEN_EMAIL, DEV_PASSWORD)

    const suffix = Date.now()

    const category = await prisma.observatoryInstitutionCategory.create({
      data: { slug: `e2e-categoria-${suffix}`, name: 'Categoría e2e', displayOrder: 900 }
    })
    categoryId = category.id
    createdCategoryIds.push(category.id)

    const inactiveCategory = await prisma.observatoryInstitutionCategory.create({
      data: { slug: `e2e-categoria-inactiva-${suffix}`, name: 'Categoría inactiva e2e', isActive: false, displayOrder: 901 }
    })
    inactiveCategoryId = inactiveCategory.id
    createdCategoryIds.push(inactiveCategory.id)

    const institution = await prisma.observatoryInstitution.create({
      data: { categoryId: category.id, slug: `e2e-institucion-${suffix}`, name: 'Institución e2e' }
    })
    institutionId = institution.id

    const inactiveInstitution = await prisma.observatoryInstitution.create({
      data: { categoryId: category.id, slug: `e2e-institucion-inactiva-${suffix}`, name: 'Institución inactiva e2e', isActive: false }
    })
    inactiveInstitutionId = inactiveInstitution.id

    const institutionInInactiveCategory = await prisma.observatoryInstitution.create({
      data: { categoryId: inactiveCategory.id, slug: `e2e-institucion-cat-inactiva-${suffix}`, name: 'Institución en categoría inactiva e2e' }
    })
    institutionInInactiveCategoryId = institutionInInactiveCategory.id
  })

  afterAll(async () => {
    await prisma.observatoryContribution.deleteMany({ where: { email: { in: createdEmails } } })
    await prisma.observatoryInstitution.deleteMany({ where: { categoryId: { in: createdCategoryIds } } })
    await prisma.observatoryInstitutionCategory.deleteMany({ where: { id: { in: createdCategoryIds } } })
    await prisma.$disconnect()
  })

  /** Recupera un aporte por email desde el listado admin. */
  async function findContributionByEmail(email: string): Promise<AdminContribution | undefined> {
    const res = await api<ContributionsResponse>('/api/observatory-contributions?perPage=100', { cookie: adminCookie })
    return res.data.items.find(item => item.email === email)
  }

  describe('envío público', () => {
    it('acepta un aporte sin iniciar sesión y guarda el snapshot de la institución', async () => {
      const payload = buildPayload()
      createdEmails.push(payload.email!)

      const res = await postContribution(payload)
      expect(res.status).toBe(201)
      expect(res.data).toEqual({ success: true })

      const stored = await findContributionByEmail(payload.email!)
      expect(stored).toBeDefined()
      expect(stored!.institutionId).toBe(institutionId)
      expect(stored!.institutionName).toBe('Institución e2e')
      expect(stored!.institutionCategoryName).toBe('Categoría e2e')
      expect(stored!.workGroupSlug).toBe(WORK_GROUP_SLUG)
    })

    it('acepta un aporte de una persona logueada', async () => {
      const payload = buildPayload()
      createdEmails.push(payload.email!)

      const res = await postContribution(payload, { cookie: citizenCookie })
      expect(res.status).toBe(201)
    })

    it('responde éxito genérico sin persistir cuando se completa el honeypot', async () => {
      const payload = buildPayload({ website: 'http://spam.example' })
      createdEmails.push(payload.email!)

      const res = await postContribution(payload)
      expect(res.status).toBe(201)

      expect(await findContributionByEmail(payload.email!)).toBeUndefined()
    })

    it('rechaza el grupo de reuniones plenarias', async () => {
      const res = await postContribution(buildPayload({ workGroupSlug: PLENARY_WORK_GROUP_SLUG }))
      expect(res.status).toBe(422)
    })

    it('rechaza un eje de trabajo inexistente', async () => {
      const res = await postContribution(buildPayload({ workGroupSlug: 'eje-que-no-existe' }))
      expect(res.status).toBe(422)
    })

    it('exige elegir una institución', async () => {
      const res = await postContribution(buildPayload({ institutionId: undefined }))
      expect(res.status).toBe(422)
    })

    it('rechaza una institución dada de baja', async () => {
      const res = await postContribution(buildPayload({ institutionId: inactiveInstitutionId }))
      expect(res.status).toBe(422)
    })

    it('rechaza una institución cuya categoría está dada de baja', async () => {
      const res = await postContribution(buildPayload({ institutionId: institutionInInactiveCategoryId }))
      expect(res.status).toBe(422)
    })

    it('rechaza un aporte sin descripción, archivo ni enlace', async () => {
      const res = await postContribution(buildPayload({ description: undefined }))
      expect(res.status).toBe(422)
    })

    it('acepta un aporte sin descripción si trae un enlace', async () => {
      const payload = buildPayload({
        description: undefined,
        enlaces: [{ url: 'https://drive.example/documento', title: 'Documento' }]
      })
      createdEmails.push(payload.email!)

      const res = await postContribution(payload)
      expect(res.status).toBe(201)

      const stored = await findContributionByEmail(payload.email!)
      expect(stored!.description).toBeNull()
      expect(stored!.links).toHaveLength(1)
      expect(stored!.links[0]!.url).toBe('https://drive.example/documento')
    })

    it('acepta un aporte sin descripción si trae un archivo adjunto', async () => {
      const payload = buildPayload({ description: undefined, hasAttachment: true })
      createdEmails.push(payload.email!)

      const res = await postContribution(payload, {
        file: { content: '%PDF-1.4 contenido', filename: 'aporte.pdf', type: 'application/pdf' }
      })
      expect(res.status).toBe(201)

      const stored = await findContributionByEmail(payload.email!)
      expect(stored!.attachment?.filename).toBe('aporte.pdf')
    })

    it('ignora `hasAttachment` si no llegó ningún archivo', async () => {
      const res = await postContribution(buildPayload({ description: undefined, hasAttachment: true }))
      expect(res.status).toBe(422)
    })

    it('rechaza un archivo con tipo no permitido', async () => {
      const res = await postContribution(buildPayload(), {
        file: { content: 'ejecutable', filename: 'aporte.exe', type: 'application/x-msdownload' }
      })
      expect(res.status).toBe(422)
    })

    it('exige municipio cuando la provincia es Buenos Aires', async () => {
      const res = await postContribution(buildPayload({ municipio: undefined }))
      expect(res.status).toBe(422)
    })

    it('no exige municipio fuera de Buenos Aires', async () => {
      const payload = buildPayload({ provincia: 'Córdoba', municipio: undefined })
      createdEmails.push(payload.email!)

      const res = await postContribution(payload)
      expect(res.status).toBe(201)
    })
  })

  describe('lectura administrativa', () => {
    it('no permite listar aportes sin sesión', async () => {
      const res = await api('/api/observatory-contributions')
      expect(res.status).toBe(401)
    })

    it('no permite listar aportes a una persona sin rol de plataforma', async () => {
      const res = await api('/api/observatory-contributions', { cookie: citizenCookie })
      expect(res.status).toBe(403)
    })

    it('exporta un CSV con BOM UTF-8 para platform-admin', async () => {
      const res = await fetch(url('/api/observatory-contributions/export'), {
        headers: { cookie: adminCookie }
      })

      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/csv')

      const buffer = Buffer.from(await res.arrayBuffer())
      expect(buffer.subarray(0, 3)).toEqual(Buffer.from([0xEF, 0xBB, 0xBF]))
      expect(buffer.toString('utf8')).toContain('Institución')
    })

    it('no permite exportar sin rol de plataforma', async () => {
      const res = await fetch(url('/api/observatory-contributions/export'), {
        headers: { cookie: citizenCookie }
      })
      expect(res.status).toBe(403)
    })

    it('devuelve 404 al pedir el adjunto de un aporte que no lo tiene', async () => {
      const payload = buildPayload()
      createdEmails.push(payload.email!)
      await postContribution(payload)

      const stored = await findContributionByEmail(payload.email!)
      const res = await api(`/api/observatory-contributions/${stored!.id}/attachment`, { cookie: adminCookie })
      expect(res.status).toBe(404)
    })

    it('no permite descargar adjuntos sin rol de plataforma', async () => {
      const payload = buildPayload({ hasAttachment: true })
      createdEmails.push(payload.email!)
      await postContribution(payload, {
        file: { content: '%PDF-1.4 contenido', filename: 'privado.pdf', type: 'application/pdf' }
      })

      const stored = await findContributionByEmail(payload.email!)
      const res = await api(`/api/observatory-contributions/${stored!.id}/attachment`, { cookie: citizenCookie })
      expect(res.status).toBe(403)
    })
  })

  describe('catálogo de instituciones', () => {
    it('expone públicamente solo instituciones activas de categorías activas', async () => {
      const res = await api<InstitutionDTO[]>('/api/observatory-institutions')
      expect(res.status).toBe(200)

      const ids = res.data.map(institution => institution.id)
      expect(ids).toContain(institutionId)
      expect(ids).not.toContain(inactiveInstitutionId)
      expect(ids).not.toContain(institutionInInactiveCategoryId)
    })

    it('expone el catálogo completo a platform-admin', async () => {
      const res = await api<InstitutionDTO[]>('/api/observatory-institutions', { cookie: adminCookie })
      const ids = res.data.map(institution => institution.id)
      expect(ids).toContain(inactiveInstitutionId)
    })

    it('oculta públicamente las categorías dadas de baja', async () => {
      const res = await api<InstitutionCategoryDTO[]>('/api/observatory-institution-categories')
      const ids = res.data.map(category => category.id)
      expect(ids).toContain(categoryId)
      expect(ids).not.toContain(inactiveCategoryId)
    })

    it('no permite crear instituciones sin rol de plataforma', async () => {
      const res = await api('/api/observatory-institutions', {
        method: 'POST',
        cookie: citizenCookie,
        body: { categoryId, slug: 'intento-no-autorizado', name: 'Intento' }
      })
      expect(res.status).toBe(403)
    })

    it('permite a platform-admin crear, editar y dar de baja una institución', async () => {
      const slug = `e2e-abm-${Date.now()}`

      const created = await api<InstitutionDTO>('/api/observatory-institutions', {
        method: 'POST',
        cookie: adminCookie,
        body: { categoryId, slug, name: 'Institución ABM' }
      })
      expect(created.status).toBe(201)

      const renamed = await api<InstitutionDTO & { isActive: boolean }>(
        `/api/observatory-institutions/${created.data.id}`,
        { method: 'PATCH', cookie: adminCookie, body: { name: 'Institución ABM renombrada' } }
      )
      expect(renamed.status).toBe(200)
      expect(renamed.data.name).toBe('Institución ABM renombrada')

      const disabled = await api<InstitutionDTO & { isActive: boolean }>(
        `/api/observatory-institutions/${created.data.id}`,
        { method: 'PATCH', cookie: adminCookie, body: { isActive: false } }
      )
      expect(disabled.data.isActive).toBe(false)

      const publicList = await api<InstitutionDTO[]>('/api/observatory-institutions')
      expect(publicList.data.map(institution => institution.id)).not.toContain(created.data.id)
    })

    it('rechaza un slug de institución duplicado', async () => {
      const res = await api('/api/observatory-institutions', {
        method: 'POST',
        cookie: adminCookie,
        body: { categoryId, slug: `e2e-institucion-duplicado-${Date.now()}`, name: 'Duplicada' }
      })
      expect(res.status).toBe(201)

      const duplicated = await api<{ slug: string }>('/api/observatory-institutions', {
        method: 'POST',
        cookie: adminCookie,
        body: { categoryId, slug: (res.data as InstitutionDTO).slug, name: 'Duplicada otra vez' }
      })
      expect(duplicated.status).toBe(409)
    })

    it('conserva el nombre original en los aportes cuando se renombra la institución', async () => {
      const payload = buildPayload()
      createdEmails.push(payload.email!)
      await postContribution(payload)

      await api(`/api/observatory-institutions/${institutionId}`, {
        method: 'PATCH',
        cookie: adminCookie,
        body: { name: 'Institución e2e (renombrada)' }
      })

      const stored = await findContributionByEmail(payload.email!)
      expect(stored!.institutionName).toBe('Institución e2e')

      await api(`/api/observatory-institutions/${institutionId}`, {
        method: 'PATCH',
        cookie: adminCookie,
        body: { name: 'Institución e2e' }
      })
    })
  })

  describe('logo y sitio web', () => {
    /** Sube un SVG mínimo y devuelve el id del asset creado. */
    async function uploadLogo(): Promise<number> {
      const formData = new FormData()
      formData.append(
        'file',
        new Blob(['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4"></svg>'], { type: 'image/svg+xml' }),
        'logo.svg'
      )

      const res = await fetch(url('/api/assets'), {
        method: 'POST',
        headers: { cookie: adminCookie },
        body: formData
      })

      expect(res.status).toBe(201)
      const asset = (await res.json()) as { id: number }
      return asset.id
    }

    it('expone logoUrl y websiteUrl en el DTO público', async () => {
      const logoAssetId = await uploadLogo()

      await api(`/api/observatory-institutions/${institutionId}`, {
        method: 'PATCH',
        cookie: adminCookie,
        body: { logoAssetId, websiteUrl: 'https://institucion.example' }
      })

      const res = await api<InstitutionDTO[]>('/api/observatory-institutions')
      const institution = res.data.find(item => item.id === institutionId)

      expect(institution!.logoUrl).toBeTruthy()
      expect(institution!.websiteUrl).toBe('https://institucion.example')
    })

    it('permite quitar el logo y el sitio web', async () => {
      const res = await api<InstitutionDTO>(`/api/observatory-institutions/${institutionId}`, {
        method: 'PATCH',
        cookie: adminCookie,
        body: { logoAssetId: null, websiteUrl: null }
      })

      expect(res.status).toBe(200)
      expect(res.data.logoUrl).toBeNull()
      expect(res.data.websiteUrl).toBeNull()
    })

    it('rechaza un logo inexistente', async () => {
      const res = await api(`/api/observatory-institutions/${institutionId}`, {
        method: 'PATCH',
        cookie: adminCookie,
        body: { logoAssetId: 99999999 }
      })

      expect(res.status).toBe(422)
    })

    it('rechaza un sitio web con formato inválido', async () => {
      const res = await api(`/api/observatory-institutions/${institutionId}`, {
        method: 'PATCH',
        cookie: adminCookie,
        body: { websiteUrl: 'no-es-una-url' }
      })

      expect(res.status).toBe(422)
    })

    it('sirve los SVG del storage local con sandbox', async () => {
      const logoAssetId = await uploadLogo()

      const asset = await api<{ url: string | null }>(`/api/assets/${logoAssetId}`, { cookie: adminCookie })
      const logoUrl = asset.data.url

      // Con driver s3 la URL es externa y esta comprobación no aplica.
      if (!logoUrl?.startsWith('/uploads/')) return

      const res = await fetch(url(logoUrl))
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('image/svg+xml')
      expect(res.headers.get('content-security-policy')).toContain('sandbox')
      expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    })
  })
})
