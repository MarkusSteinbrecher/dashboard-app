import type { ExtractionResult } from '../ifc/types'
import type { KpiSet } from './types'

export class KpiCalculator {
  calculate(extraction: ExtractionResult): KpiSet {
    return {
      elementCounts: this.calcElementCounts(extraction),
      areaByStorey: this.calcAreaByStorey(extraction),
      volumeByType: this.calcVolumeByType(extraction),
      elementsPerStorey: this.calcElementsPerStorey(extraction),
      materialBreakdown: extraction.materials.map((m) => ({
        material: m.name,
        elementCount: m.elementCount,
        globalIds: m.elementGlobalIds,
      })),
      totalArea: this.sumQuantities(extraction, 'area'),
      totalVolume: this.sumQuantities(extraction, 'volume'),
      totalLength: this.sumQuantities(extraction, 'length'),
      propertySummary: this.calcPropertySummary(extraction),
    }
  }

  private calcElementCounts(e: ExtractionResult) {
    const result: { type: string; count: number }[] = []
    for (const [type, elements] of e.elementsByType) {
      result.push({ type: type.replace('Ifc', ''), count: elements.length })
    }
    return result.sort((a, b) => b.count - a.count)
  }

  private calcAreaByStorey(e: ExtractionResult) {
    const result: { storey: string; area: number }[] = []
    for (const storey of e.storeys) {
      const elements = e.elementsByStorey.get(storey.name) ?? []
      let area = 0
      for (const el of elements) {
        for (const q of el.quantities) {
          if (q.type === 'area') area += q.value
        }
      }
      if (area > 0) result.push({ storey: storey.name, area })
    }
    return result
  }

  private calcVolumeByType(e: ExtractionResult) {
    const result: { type: string; volume: number }[] = []
    for (const [type, elements] of e.elementsByType) {
      let vol = 0
      for (const el of elements) {
        for (const q of el.quantities) {
          if (q.type === 'volume') vol += q.value
        }
      }
      if (vol > 0) result.push({ type: type.replace('Ifc', ''), volume: vol })
    }
    return result.sort((a, b) => b.volume - a.volume)
  }

  private calcElementsPerStorey(e: ExtractionResult) {
    return e.storeys.map((storey) => {
      const elements = e.elementsByStorey.get(storey.name) ?? []
      const typeCounts = new Map<string, number>()
      for (const el of elements) {
        const t = el.typeName.replace('Ifc', '')
        typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1)
      }
      return {
        storey: storey.name,
        count: elements.length,
        types: Array.from(typeCounts.entries())
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count),
      }
    })
  }

  private sumQuantities(e: ExtractionResult, type: string): number {
    let total = 0
    for (const el of e.elements) {
      for (const q of el.quantities) {
        if (q.type === type) total += q.value
      }
    }
    return total
  }

  private calcPropertySummary(e: ExtractionResult) {
    let loadBearingCount = 0
    let externalCount = 0
    let fireRatedCount = 0
    const fireRatings = new Map<string, number>()

    for (const el of e.elements) {
      for (const pset of el.propertySets) {
        for (const prop of pset.properties) {
          const name = prop.name.toLowerCase()
          if (name === 'loadbearing' && prop.value === true) loadBearingCount++
          if (name === 'isexternal' && prop.value === true) externalCount++
          if (name === 'firerating' && prop.value) {
            fireRatedCount++
            const rating = String(prop.value)
            fireRatings.set(rating, (fireRatings.get(rating) ?? 0) + 1)
          }
        }
      }
    }

    return {
      loadBearingCount,
      externalCount,
      fireRatedCount,
      fireRatings: Array.from(fireRatings.entries())
        .map(([rating, count]) => ({ rating, count }))
        .sort((a, b) => b.count - a.count),
    }
  }
}
