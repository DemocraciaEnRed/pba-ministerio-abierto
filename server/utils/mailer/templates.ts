import nunjucks, { type Environment } from 'nunjucks'

let envPromise: Promise<Environment> | null = null

/**
 * Loader de nunjucks respaldado por un mapa en memoria de fuentes de templates.
 * Las fuentes se precargan desde los server assets de Nitro (`assets:emails`),
 * lo que funciona tanto en dev como en el build de producción.
 */
class MemoryLoader {
  constructor(private readonly sources: Map<string, string>) {}

  getSource(name: string) {
    const src = this.sources.get(name)
    if (src === undefined) {
      throw new Error(`Email template not found: ${name}`)
    }
    return { src, path: name, noCache: false }
  }
}

/**
 * Decodifica el contenido crudo de un asset a texto UTF-8. En dev el storage
 * devuelve un string, pero en el build de producción Nitro devuelve los assets
 * como Uint8Array/Buffer. Usar `String(raw)` sobre un Uint8Array produce la
 * lista de bytes separada por comas ("123,37,...") en vez del texto, así que
 * hay que decodificar explícitamente.
 */
function decodeSource(raw: unknown): string {
  if (typeof raw === 'string') {
    return raw
  }
  if (raw instanceof Uint8Array) {
    return new TextDecoder().decode(raw)
  }
  if (raw instanceof ArrayBuffer) {
    return new TextDecoder().decode(new Uint8Array(raw))
  }
  return String(raw)
}

async function buildEnv(): Promise<Environment> {
  const storage = useStorage('assets:emails')
  const keys = await storage.getKeys()

  const sources = new Map<string, string>()
  for (const key of keys) {
    // Las keys vienen con ':' como separador (ej. 'verify-email.njk').
    const name = key.split(':').pop()!
    const raw = await storage.getItemRaw(key)
    sources.set(name, decodeSource(raw))
  }

  return new nunjucks.Environment(new MemoryLoader(sources) as never, {
    autoescape: true
  })
}

function getEnv(): Promise<Environment> {
  if (!envPromise) {
    envPromise = buildEnv()
  }
  return envPromise
}

/** Renderiza un template (`name` sin extensión .njk) con `data`. */
export async function renderTemplate(name: string, data: Record<string, unknown>): Promise<string> {
  const env = await getEnv()
  return env.render(`${name}.njk`, data)
}
