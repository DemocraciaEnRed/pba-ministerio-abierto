import * as z from 'zod'

/** Mensaje para campos requeridos que llegan ausentes (valor `undefined`). */
const REQUIRED_FIELD_MESSAGE = 'Este campo es obligatorio'

/**
 * Configura Zod para todo el proyecto:
 * - Locale español para los mensajes de error por defecto.
 * - Un mensaje claro para campos requeridos ausentes, reemplazando el genérico
 *   "Entrada inválida: se esperaba texto, recibido indefinido" (poco entendible
 *   para el ciudadano) por {@link REQUIRED_FIELD_MESSAGE}.
 *
 * Los mensajes custom definidos en cada schema siguen teniendo prioridad; esto
 * solo cubre los casos sin mensaje explícito.
 *
 * Debe invocarse en ambos runtimes (cliente y Nitro): son procesos separados.
 */
export function configureZod() {
  z.config({
    ...z.locales.es(),
    customError: (issue) => {
      // Solo el caso "campo ausente" (undefined): un type error real con otro
      // valor (p. ej. número donde se espera texto) conserva el mensaje del locale.
      if (issue.code === 'invalid_type' && issue.input === undefined) {
        return REQUIRED_FIELD_MESSAGE
      }
      return undefined
    }
  })
}
