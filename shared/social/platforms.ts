/**
 * Catálogo de redes sociales soportadas en el perfil de usuario.
 *
 * Por seguridad **nunca** se almacena ni se muestra una URL provista por el
 * usuario: solo se guarda un "handle" validado con un patrón estricto por
 * plataforma, y la URL pública se arma desde una plantilla whitelist. Así se
 * elimina la superficie para inyectar enlaces maliciosos.
 *
 * Los valores de `key` deben coincidir con el enum `UserSocialPlatform`
 * (prisma/schema/01-users.prisma).
 */
export interface SocialPlatformConfig {
  key: string
  label: string
  icon: string
  /** Ejemplo de handle para el placeholder del input. */
  placeholder: string
  /** Pista breve que se muestra bajo el campo. */
  hint: string
  /** Patrón estricto que valida el handle ya normalizado. */
  pattern: RegExp
  /** Construye la URL pública a partir de un handle válido. */
  buildUrl: (handle: string) => string
}

export const SOCIAL_PLATFORMS = [
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: 'i-simple-icons-linkedin',
    placeholder: 'tu-usuario',
    hint: 'Tu identificador de linkedin.com/in/…',
    pattern: /^[a-zA-Z0-9-]{3,100}$/,
    buildUrl: (h: string) => `https://www.linkedin.com/in/${h}`
  },
  {
    key: 'x',
    label: 'X',
    icon: 'i-simple-icons-x',
    placeholder: 'tu_usuario',
    hint: 'Tu usuario de x.com, sin la arroba.',
    pattern: /^[a-zA-Z0-9_]{1,15}$/,
    buildUrl: (h: string) => `https://x.com/${h}`
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: 'i-simple-icons-instagram',
    placeholder: 'tu.usuario',
    hint: 'Tu usuario de Instagram, sin la arroba.',
    pattern: /^[a-zA-Z0-9._]{1,30}$/,
    buildUrl: (h: string) => `https://www.instagram.com/${h}`
  },
  {
    key: 'threads',
    label: 'Threads',
    icon: 'i-simple-icons-threads',
    placeholder: 'tu.usuario',
    hint: 'Tu usuario de Threads, sin la arroba.',
    pattern: /^[a-zA-Z0-9._]{1,30}$/,
    buildUrl: (h: string) => `https://www.threads.net/@${h}`
  },
  {
    key: 'mastodon',
    label: 'Mastodon',
    icon: 'i-simple-icons-mastodon',
    placeholder: 'usuario@servidor.social',
    hint: 'Tu dirección completa, con el formato usuario@servidor.',
    pattern: /^[a-zA-Z0-9_]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
    buildUrl: (h: string) => {
      const [user, instance] = h.split('@')
      return `https://${instance}/@${user}`
    }
  },
  {
    key: 'bluesky',
    label: 'Bluesky',
    icon: 'i-simple-icons-bluesky',
    placeholder: 'tu-usuario.bsky.social',
    hint: 'Tu handle de Bluesky (por ejemplo, nombre.bsky.social).',
    pattern: /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
    buildUrl: (h: string) => `https://bsky.app/profile/${h}`
  },
  {
    key: 'substack',
    label: 'Substack',
    icon: 'i-simple-icons-substack',
    placeholder: 'tu-publicacion',
    hint: 'El subdominio de tu Substack (…​.substack.com).',
    pattern: /^[a-zA-Z0-9-]{1,63}$/,
    buildUrl: (h: string) => `https://${h}.substack.com`
  },
  {
    key: 'medium',
    label: 'Medium',
    icon: 'i-simple-icons-medium',
    placeholder: 'tu-usuario',
    hint: 'Tu usuario de Medium, sin la arroba.',
    pattern: /^[a-zA-Z0-9_]{1,50}$/,
    buildUrl: (h: string) => `https://medium.com/@${h}`
  }
] as const satisfies readonly SocialPlatformConfig[]

export type SocialPlatform = typeof SOCIAL_PLATFORMS[number]['key']

export const SOCIAL_PLATFORM_KEYS = SOCIAL_PLATFORMS.map(p => p.key) as [SocialPlatform, ...SocialPlatform[]]

const BY_KEY = new Map<SocialPlatform, SocialPlatformConfig>(
  SOCIAL_PLATFORMS.map(p => [p.key, p])
)

export function getSocialPlatform(key: SocialPlatform): SocialPlatformConfig | undefined {
  return BY_KEY.get(key)
}

/** Normaliza un handle ingresado por el usuario (recorta y saca arrobas iniciales). */
export function normalizeSocialHandle(raw: string): string {
  return raw.trim().replace(/^@+/, '')
}

/** Valida un handle ya normalizado contra el patrón de su plataforma. */
export function isValidSocialHandle(platform: SocialPlatform, handle: string): boolean {
  const cfg = BY_KEY.get(platform)
  return cfg ? cfg.pattern.test(handle) : false
}

/**
 * Arma la URL pública de un handle. Devuelve `null` si el handle no supera la
 * validación de la plataforma (defensa en profundidad al serializar).
 */
export function buildSocialUrl(platform: SocialPlatform, handle: string): string | null {
  const cfg = BY_KEY.get(platform)
  if (!cfg || !cfg.pattern.test(handle)) return null
  return cfg.buildUrl(handle)
}
