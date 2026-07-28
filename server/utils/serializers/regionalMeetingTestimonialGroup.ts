export type RegionalMeetingTestimonialGroupView = 'public' | 'admin'

type TestimonialGroupRegion = {
  id: number
  slug: string
  name: string
}

type TestimonialEntity = {
  id: number
  body: string
  authorName: string
  municipality: string
  displayOrder: number
}

type TestimonialGroupEntity = {
  id: number
  name: string
  municipality: string
  heldAt: Date
  regionId: number | null
  createdAt: Date
  updatedAt: Date
  region: TestimonialGroupRegion | null
  testimonials: TestimonialEntity[]
}

export interface TestimonialGroupRegionDTO {
  id: number
  slug: string
  name: string
}

export interface RegionalMeetingTestimonialDTO {
  id: number
  body: string
  authorName: string
  municipality: string
}

export interface PublicRegionalMeetingTestimonialGroupDTO {
  id: number
  name: string
  municipality: string
  heldAt: string
  region: TestimonialGroupRegionDTO | null
  testimonials: RegionalMeetingTestimonialDTO[]
}

export interface AdminRegionalMeetingTestimonialGroupDTO extends PublicRegionalMeetingTestimonialGroupDTO {
  regionId: number | null
  createdAt: string
  updatedAt: string
}

function serializeTestimonial(testimonial: TestimonialEntity): RegionalMeetingTestimonialDTO {
  return {
    id: testimonial.id,
    body: testimonial.body,
    authorName: testimonial.authorName,
    municipality: testimonial.municipality
  }
}

export function serializeRegionalMeetingTestimonialGroup(group: TestimonialGroupEntity, view: 'public'): PublicRegionalMeetingTestimonialGroupDTO
export function serializeRegionalMeetingTestimonialGroup(group: TestimonialGroupEntity, view: 'admin'): AdminRegionalMeetingTestimonialGroupDTO
export function serializeRegionalMeetingTestimonialGroup(
  group: TestimonialGroupEntity,
  view: RegionalMeetingTestimonialGroupView
): PublicRegionalMeetingTestimonialGroupDTO | AdminRegionalMeetingTestimonialGroupDTO {
  const base: PublicRegionalMeetingTestimonialGroupDTO = {
    id: group.id,
    name: group.name,
    municipality: group.municipality,
    heldAt: group.heldAt.toISOString(),
    region: group.region
      ? { id: group.region.id, slug: group.region.slug, name: group.region.name }
      : null,
    testimonials: group.testimonials.map(serializeTestimonial)
  }

  if (view === 'public') {
    return base
  }

  return {
    ...base,
    regionId: group.regionId,
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString()
  }
}
