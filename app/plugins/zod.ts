import { configureZod } from '#shared/zod'

/**
 * Configura Zod en el cliente (validación de formularios de Nuxt UI con
 * `:schema`): locale español + mensaje claro para campos requeridos ausentes.
 *
 * Complementa al plugin de Nitro (`server/plugins/zod.ts`): cliente y servidor
 * son runtimes separados, por lo que la configuración debe aplicarse en ambos.
 */
export default defineNuxtPlugin(() => {
  configureZod()
})
