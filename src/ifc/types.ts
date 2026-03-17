export interface ElementRecord {
  localId: number
  expressId: number | undefined
  globalId: string
  name: string | null
  typeName: string
  storeyName: string | null
  storeyGlobalId: string | null
  quantities: QuantityRecord[]
  propertySets: PropertySetRecord[]
  materialName: string | null
}

export interface QuantityRecord {
  setName: string
  name: string
  type: 'area' | 'volume' | 'length' | 'weight' | 'count'
  value: number
}

export interface PropertySetRecord {
  name: string
  properties: PropertyRecord[]
}

export interface PropertyRecord {
  name: string
  value: string | number | boolean | null
}

export interface StoreyRecord {
  globalId: string
  name: string
  elevation: number | null
  elementCount: number
}

export interface MaterialRecord {
  name: string
  category: string | null
  elementCount: number
  elementGlobalIds: string[]
}

export interface ExtractionResult {
  elements: ElementRecord[]
  storeys: StoreyRecord[]
  materials: MaterialRecord[]
  extractionTimeMs: number
  elementsByType: Map<string, ElementRecord[]>
  elementsByStorey: Map<string, ElementRecord[]>
  elementsByMaterial: Map<string, ElementRecord[]>
  globalIdToElement: Map<string, ElementRecord>
}
