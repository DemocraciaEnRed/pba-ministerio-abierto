export type ObservatoryPublicationView = 'public' | 'admin'

type PublicationEntity = {
  id: number
  title: string
  description: string | null
  publicationYear: number
  coverAssetId: number | null
  documentAssetId: number | null
  externalUrl: string | null
  isActive: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
  /// URLs ya resueltas en el handler: el serializer es síncrono.
  coverUrl?: string | null
  downloadUrl?: string | null
}

export interface PublicObservatoryPublicationDTO {
  id: number
  title: string
  description: string | null
  publicationYear: number
  coverUrl: string | null
  downloadUrl: string | null
}

export interface AdminObservatoryPublicationDTO extends PublicObservatoryPublicationDTO {
  coverAssetId: number | null
  documentAssetId: number | null
  externalUrl: string | null
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export function serializeObservatoryPublication(
  publication: PublicationEntity,
  view: 'public'
): PublicObservatoryPublicationDTO
export function serializeObservatoryPublication(
  publication: PublicationEntity,
  view: 'admin'
): AdminObservatoryPublicationDTO
export function serializeObservatoryPublication(
  publication: PublicationEntity,
  view: ObservatoryPublicationView
): PublicObservatoryPublicationDTO | AdminObservatoryPublicationDTO {
  const base: PublicObservatoryPublicationDTO = {
    id: publication.id,
    title: publication.title,
    description: publication.description,
    publicationYear: publication.publicationYear,
    coverUrl: publication.coverUrl ?? null,
    downloadUrl: publication.downloadUrl ?? null
  }

  if (view === 'public') {
    return base
  }

  return {
    ...base,
    coverAssetId: publication.coverAssetId,
    documentAssetId: publication.documentAssetId,
    externalUrl: publication.externalUrl,
    isActive: publication.isActive,
    displayOrder: publication.displayOrder,
    createdAt: publication.createdAt.toISOString(),
    updatedAt: publication.updatedAt.toISOString()
  }
}
