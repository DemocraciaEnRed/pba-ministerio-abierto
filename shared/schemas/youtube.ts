import * as z from 'zod'
import { extractYoutubeVideoId } from '#shared/media/youtube'

const youtubeUrlField = z
  .string()
  .trim()
  .min(1, 'Ingresá la URL del video')
  .refine(value => extractYoutubeVideoId(value) !== null, 'Ingresá una URL válida de YouTube')

export const YoutubeEmbedSchema = z.object({
  url: youtubeUrlField
})

export type YoutubeEmbedInput = z.output<typeof YoutubeEmbedSchema>
