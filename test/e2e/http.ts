import { url } from '@nuxt/test-utils/e2e'

export interface ApiResponse<T = unknown> {
  status: number
  data: T
  setCookie: string[]
}

export interface ApiOptions {
  method?: string
  body?: unknown
  cookie?: string
}

/**
 * Cliente HTTP mínimo para los tests e2e. Usa `fetch` global (undici) sobre la
 * URL real del server de test, devolviendo status + body parseado sin lanzar en
 * respuestas no-2xx (así podemos afirmar sobre 401/403/404/409/422).
 */
export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
  const { method = 'GET', body, cookie } = options

  const res = await fetch(url(path), {
    method,
    headers: {
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {})
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
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

  return {
    status: res.status,
    data: data as T,
    setCookie: res.headers.getSetCookie?.() ?? []
  }
}

export interface MultipartFile {
  content: string | Uint8Array
  filename: string
  type: string
  /** Nombre de la parte (por defecto `files`). */
  field?: string
}

/**
 * POST multipart/form-data: campos de texto + archivos (cada uno en su propia
 * parte, por defecto `files`). Igual que `api`, no lanza en respuestas no-2xx.
 */
export async function postMultipart<T = unknown>(
  path: string,
  options: { fields?: Record<string, string>, files?: MultipartFile[], cookie?: string } = {}
): Promise<ApiResponse<T>> {
  const formData = new FormData()
  for (const [name, value] of Object.entries(options.fields ?? {})) {
    formData.append(name, value)
  }
  for (const file of options.files ?? []) {
    formData.append(file.field ?? 'files', new Blob([file.content], { type: file.type }), file.filename)
  }

  const res = await fetch(url(path), {
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

  return { status: res.status, data: data as T, setCookie: res.headers.getSetCookie?.() ?? [] }
}

/**
 * Inicia sesión con las credenciales dadas y devuelve el header `cookie` a
 * reenviar en las siguientes requests autenticadas.
 */
export async function login(email: string, password: string): Promise<string> {
  const res = await api('/api/auth/login', {
    method: 'POST',
    body: { email, password }
  })

  if (res.status !== 200) {
    throw new Error(`Login falló para ${email}: ${res.status} ${JSON.stringify(res.data)}`)
  }

  return res.setCookie.map(entry => entry.split(';')[0]).join('; ')
}
