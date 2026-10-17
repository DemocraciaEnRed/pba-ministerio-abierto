/** Valor admitido en una celda CSV. */
export type CsvValue = string | number | null | undefined

// Caracteres con los que Excel/LibreOffice interpretan una celda como fórmula.
const FORMULA_PREFIX = /^[=+\-@\t\r]/

/**
 * Escapa un valor para CSV: siempre entre comillas dobles, con las internas
 * duplicadas. Los textos que empiezan como fórmula se neutralizan con un
 * apóstrofo inicial para evitar inyección de fórmulas al abrir el archivo.
 */
export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return '""'
  let text = String(value)
  if (typeof value === 'string' && FORMULA_PREFIX.test(text)) {
    text = `'${text}`
  }
  return `"${text.replace(/"/g, '""')}"`
}

export function csvRow(values: CsvValue[]): string {
  return values.map(csvCell).join(',')
}

/**
 * Arma un documento CSV completo: BOM UTF-8 (para que Excel respete los
 * acentos), encabezados y filas separadas por `\r\n`.
 */
export function csvDocument(headers: string[], rows: string[]): string {
  return `\uFEFF${[csvRow(headers), ...rows].join('\r\n')}`
}

const exportDateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Argentina/Buenos_Aires'
})

/** Fecha y hora en formato corto argentino, para las columnas de fecha del CSV. */
export function formatExportDate(value: Date | null | undefined): string {
  return value ? exportDateFormatter.format(value) : ''
}
