import * as z from 'zod'

// Query de historial transversal de participaciones del usuario autenticado.
export const MyParticipationsQuerySchema = z.object({
  page: z.coerce.number().int('La página debe ser un entero').min(1, 'La página mínima es 1').default(1),
  perPage: z.coerce.number().int('La cantidad debe ser un entero').min(1, 'La cantidad mínima es 1').max(100, 'La cantidad máxima es 100').default(20)
})

export type MyParticipationsQueryInput = z.output<typeof MyParticipationsQuerySchema>
