import type { AgendaItemState } from '../../../prisma/generated/enums'

export type RegionalMeetingAgendaItemView = 'public' | 'admin'

type AgendaItemRegion = {
  id: number
  slug: string
  name: string
}

type AgendaItemEntity = {
  id: number
  location: string
  heldAt: Date
  year: number | null
  state: AgendaItemState
  highlighted: boolean
  registrationUrl: string | null
  createdAt: Date
  updatedAt: Date
  region: AgendaItemRegion
}

export interface AgendaItemRegionDTO {
  id: number
  slug: string
  name: string
}

export interface PublicRegionalMeetingAgendaItemDTO {
  id: number
  location: string
  heldAt: string
  year: number | null
  state: AgendaItemState
  highlighted: boolean
  registrationUrl: string | null
  region: AgendaItemRegionDTO
}

export interface AdminRegionalMeetingAgendaItemDTO extends PublicRegionalMeetingAgendaItemDTO {
  createdAt: string
  updatedAt: string
}

export function serializeRegionalMeetingAgendaItem(item: AgendaItemEntity, view: 'public'): PublicRegionalMeetingAgendaItemDTO
export function serializeRegionalMeetingAgendaItem(item: AgendaItemEntity, view: 'admin'): AdminRegionalMeetingAgendaItemDTO
export function serializeRegionalMeetingAgendaItem(
  item: AgendaItemEntity,
  view: RegionalMeetingAgendaItemView
): PublicRegionalMeetingAgendaItemDTO | AdminRegionalMeetingAgendaItemDTO {
  const base: PublicRegionalMeetingAgendaItemDTO = {
    id: item.id,
    location: item.location,
    heldAt: item.heldAt.toISOString(),
    year: item.year,
    state: item.state,
    highlighted: item.highlighted,
    registrationUrl: item.registrationUrl,
    region: {
      id: item.region.id,
      slug: item.region.slug,
      name: item.region.name
    }
  }

  if (view === 'public') {
    return base
  }

  return {
    ...base,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString()
  }
}
