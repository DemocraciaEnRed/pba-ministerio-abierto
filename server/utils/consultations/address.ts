import { slugifyConsultationName } from '#shared/utils/consultation-url'

/** Nombre usado cuando el título no tiene caracteres aptos para la URL. */
const FALLBACK_ADDRESS_NAME = 'consulta'

/**
 * Nombre legible de la URL pública. Si quien administra no lo personalizó, se
 * genera desde el título (cortado en palabra completa).
 */
export function resolveConsultationAddressName(customName: string | undefined, title: string): string {
  if (customName) return customName
  return slugifyConsultationName(title) || FALLBACK_ADDRESS_NAME
}
