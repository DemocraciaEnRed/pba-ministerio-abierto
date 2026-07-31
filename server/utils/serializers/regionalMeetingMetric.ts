export type RegionalMeetingMetricView = 'public' | 'admin'

type MetricEntity = {
  id: number
  key: string
  label: string
  value: string
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface PublicRegionalMeetingMetricDTO {
  id: number
  key: string
  label: string
  value: string
  displayOrder: number
}

export interface AdminRegionalMeetingMetricDTO extends PublicRegionalMeetingMetricDTO {
  createdAt: string
  updatedAt: string
}

export function serializeRegionalMeetingMetric(metric: MetricEntity, view: 'public'): PublicRegionalMeetingMetricDTO
export function serializeRegionalMeetingMetric(metric: MetricEntity, view: 'admin'): AdminRegionalMeetingMetricDTO
export function serializeRegionalMeetingMetric(
  metric: MetricEntity,
  view: RegionalMeetingMetricView
): PublicRegionalMeetingMetricDTO | AdminRegionalMeetingMetricDTO {
  const base: PublicRegionalMeetingMetricDTO = {
    id: metric.id,
    key: metric.key,
    label: metric.label,
    value: metric.value,
    displayOrder: metric.displayOrder
  }

  if (view === 'public') {
    return base
  }

  return {
    ...base,
    createdAt: metric.createdAt.toISOString(),
    updatedAt: metric.updatedAt.toISOString()
  }
}
