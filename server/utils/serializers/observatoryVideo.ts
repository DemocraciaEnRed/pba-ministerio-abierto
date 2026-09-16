import { extractYoutubeId, youtubeEmbedUrl, youtubeThumbnailUrl, youtubeWatchUrl } from '#shared/utils/youtube'

export type ObservatoryVideoView = 'public' | 'admin'

type VideoEntity = {
  id: number
  title: string
  youtubeUrl: string
  videoDate: Date | null
  isActive: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface PublicObservatoryVideoDTO {
  id: number
  title: string
  videoDate: string | null
  youtubeUrl: string
  thumbnailUrl: string | null
  embedUrl: string | null
}

export interface AdminObservatoryVideoDTO extends PublicObservatoryVideoDTO {
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

// La fecha se emite como `AAAA-MM-DD` (columna DATE, sin hora).
function toDateString(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null
}

export function serializeObservatoryVideo(
  video: VideoEntity,
  view: 'public'
): PublicObservatoryVideoDTO
export function serializeObservatoryVideo(
  video: VideoEntity,
  view: 'admin'
): AdminObservatoryVideoDTO
export function serializeObservatoryVideo(
  video: VideoEntity,
  view: ObservatoryVideoView
): PublicObservatoryVideoDTO | AdminObservatoryVideoDTO {
  const videoId = extractYoutubeId(video.youtubeUrl)

  const base: PublicObservatoryVideoDTO = {
    id: video.id,
    title: video.title,
    videoDate: toDateString(video.videoDate),
    youtubeUrl: videoId ? youtubeWatchUrl(videoId) : video.youtubeUrl,
    thumbnailUrl: videoId ? youtubeThumbnailUrl(videoId) : null,
    embedUrl: videoId ? youtubeEmbedUrl(videoId) : null
  }

  if (view === 'public') {
    return base
  }

  return {
    ...base,
    isActive: video.isActive,
    displayOrder: video.displayOrder,
    createdAt: video.createdAt.toISOString(),
    updatedAt: video.updatedAt.toISOString()
  }
}
