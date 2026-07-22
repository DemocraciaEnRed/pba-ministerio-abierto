import { Scrypt } from '@adonisjs/hash/drivers/scrypt'

// Replica el hashing de nuxt-auth-utils (driver Scrypt de @adonisjs/hash con
// opciones por defecto). El hash resultante está en formato PHC, así que
// `verifyPassword` del servidor lo valida sin importar los parámetros.
const scrypt = new Scrypt({})

/** Hashea una contraseña en formato compatible con nuxt-auth-utils. */
export function hashSeedPassword(plain: string): Promise<string> {
  return scrypt.make(plain)
}
