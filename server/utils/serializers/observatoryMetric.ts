export type ObservatoryMetricView = 'public' | 'admin'

type MetricEntity = {
  id: number
  key: string
  label: string
  value: string
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface PublicObservatoryMetricDTO {
  id: number
  key: string
  label: string
  value: string
  displayOrder: number
}

export interface AdminObservatoryMetricDTO extends PublicObservatoryMetricDTO {
  createdAt: string
  updatedAt: string
}

export function serializeObservatoryMetric(metric: MetricEntity, view: 'public'): PublicObservatoryMetricDTO
export function serializeObservatoryMetric(metric: MetricEntity, view: 'admin'): AdminObservatoryMetricDTO
export function serializeObservatoryMetric(
  metric: MetricEntity,
  view: ObservatoryMetricView
): PublicObservatoryMetricDTO | AdminObservatoryMetricDTO {
  const base: PublicObservatoryMetricDTO = {
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
