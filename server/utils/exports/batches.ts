/**
 * Recorre un listado en tandas por cursor de `id` descendente (de lo más
 * reciente a lo más antiguo). `fetch` recibe el último id visto (o
 * `undefined` en la primera tanda) y la cantidad a traer.
 */
export async function* iterateExportBatchesById<T extends { id: number }>(
  fetch: (cursor: number | undefined, take: number) => Promise<T[]>,
  batchSize: number
): AsyncGenerator<T[]> {
  let cursor: number | undefined
  while (true) {
    const batch = await fetch(cursor, batchSize)
    if (batch.length === 0) return
    yield batch
    if (batch.length < batchSize) return
    cursor = batch[batch.length - 1]!.id
  }
}

/** Condición de `id` para la tanda siguiente. */
export function exportCursorWhere(cursor: number | undefined): { id?: { lt: number } } {
  return cursor === undefined ? {} : { id: { lt: cursor } }
}
