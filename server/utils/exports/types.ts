import type { DataExportKind } from '~~/prisma/generated/enums'
import type { CsvValue } from './csv'

/** Datos con los que se genera una exportación (persistidos en `DataExport`). */
export interface DataExportInput<F = unknown> {
  consultationId: number | null
  filters: F
}

/** Descripción legible y filtros normalizados de una exportación. */
export interface DataExportDescription<F = unknown> {
  /** Título legible del alcance (se guarda en el registro). */
  title: string
  /** Base del nombre de archivo, sin fecha ni extensión. */
  filenameBase: string
  /** Filtros normalizados a persistir (por ejemplo, con el tema ya resuelto). */
  filters: F
}

/**
 * Definición de un tipo de exportación: alcance de autorización, descripción y
 * generador de filas por tandas (para no cargar todo en memoria).
 */
export interface DataExportDefinition<F = unknown> {
  kind: DataExportKind
  /** `consultation`: requiere gestionar la consulta. `platform`: platform-admin. */
  scope: 'consultation' | 'platform'
  headers: string[]
  /**
   * Valida las precondiciones (consulta existente, formulario habilitado, etc.)
   * y describe la exportación. Lanza errores HTTP si no se puede exportar.
   */
  describe: (input: DataExportInput<F>) => Promise<DataExportDescription<F>>
  /** Recorre las filas en tandas, de la más reciente a la más antigua. */
  rows: (input: DataExportInput<F>, batchSize: number) => AsyncGenerator<CsvValue[][]>
}

/** Tipo auxiliar para declarar definiciones con filtros tipados. */
export function defineDataExport<F>(definition: DataExportDefinition<F>): DataExportDefinition<F> {
  return definition
}
