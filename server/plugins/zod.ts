import { configureZod } from '#shared/zod'

/**
 * Configura Zod en el runtime de Nitro (validación en handlers de API y SSR):
 * locale español + mensaje claro para campos requeridos ausentes.
 *
 * Complementa al plugin del cliente (`app/plugins/zod.ts`): cliente y servidor
 * son runtimes separados, por lo que la configuración debe aplicarse en ambos.
 */
export default defineNitroPlugin(() => {
  configureZod()
})
