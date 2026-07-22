/**
 * Convierte un texto libre en un slug apto para URLs:
 * minúsculas, sin acentos, con guiones y hasta 120 caracteres.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}
