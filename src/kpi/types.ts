export interface KpiSet {
  elementCounts: { type: string; count: number }[]
  areaByStorey: { storey: string; area: number }[]
  volumeByType: { type: string; volume: number }[]
  elementsPerStorey: {
    storey: string
    count: number
    types: { type: string; count: number }[]
  }[]
  materialBreakdown: {
    material: string
    elementCount: number
    globalIds: string[]
  }[]
  totalArea: number
  totalVolume: number
  totalLength: number
  propertySummary: {
    loadBearingCount: number
    externalCount: number
    fireRatedCount: number
    fireRatings: { rating: string; count: number }[]
  }
}
