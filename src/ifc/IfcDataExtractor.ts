import type IfcStepModel from '@bldrs-ai/conway/src/ifc/ifc_step_model'
import {
  IfcWall, IfcDoor, IfcWindow, IfcSlab, IfcBeam, IfcColumn,
  IfcSpace, IfcBuildingStorey,
  IfcRelContainedInSpatialStructure,
  IfcRelDefinesByProperties,
  IfcRelAssociatesMaterial,
  IfcPropertySet,
  IfcPropertySingleValue,
  IfcElementQuantity,
  IfcQuantityArea, IfcQuantityVolume, IfcQuantityLength,
  IfcQuantityWeight, IfcQuantityCount,
  IfcMaterial,
  IfcMaterialList,
  IfcMaterialLayerSetUsage,
  IfcMaterialLayerSet,
} from '@bldrs-ai/conway/src/ifc/ifc4_gen/index'
import type {
  ElementRecord, QuantityRecord, PropertySetRecord,
  PropertyRecord, StoreyRecord, MaterialRecord, ExtractionResult,
} from './types'

const ELEMENT_TYPES = [
  { cls: IfcWall, name: 'IfcWall' },
  { cls: IfcDoor, name: 'IfcDoor' },
  { cls: IfcWindow, name: 'IfcWindow' },
  { cls: IfcSlab, name: 'IfcSlab' },
  { cls: IfcBeam, name: 'IfcBeam' },
  { cls: IfcColumn, name: 'IfcColumn' },
  { cls: IfcSpace, name: 'IfcSpace' },
] as const

export class IfcDataExtractor {
  extract(model: IfcStepModel): ExtractionResult {
    const start = performance.now()

    // Pass 1: spatial containment
    const spatialMap = new Map<number, { storeyName: string; storeyGlobalId: string }>()
    const storeyMap = new Map<string, StoreyRecord>()

    for (const rel of model.types(IfcRelContainedInSpatialStructure)) {
      try {
        const structure = rel.RelatingStructure
        if (!structure) continue
        const storeyGlobalId = structure.GlobalId
        const storeyName = structure.Name ?? `Storey ${storeyGlobalId}`

        if (!storeyMap.has(storeyGlobalId)) {
          const elevation = structure instanceof IfcBuildingStorey
            ? (structure as IfcBuildingStorey).Elevation
            : null
          storeyMap.set(storeyGlobalId, {
            globalId: storeyGlobalId,
            name: storeyName,
            elevation,
            elementCount: 0,
          })
        }

        for (const element of rel.RelatedElements) {
          const eid = element.expressID
          if (eid !== undefined) {
            spatialMap.set(eid, { storeyName, storeyGlobalId })
            storeyMap.get(storeyGlobalId)!.elementCount++
          }
        }
      } catch { /* skip malformed relations */ }
    }

    // Pass 2: properties and quantities via IfcRelDefinesByProperties
    const propertyMap = new Map<number, PropertySetRecord[]>()
    const quantityMap = new Map<number, QuantityRecord[]>()

    for (const rel of model.types(IfcRelDefinesByProperties)) {
      try {
        const propDef = rel.RelatingPropertyDefinition

        if (propDef instanceof IfcPropertySet) {
          const pset = this.extractPropertySet(propDef)
          for (const obj of rel.RelatedObjects) {
            const eid = obj.expressID
            if (eid === undefined) continue
            if (!propertyMap.has(eid)) propertyMap.set(eid, [])
            propertyMap.get(eid)!.push(pset)
          }
        } else if (propDef instanceof IfcElementQuantity) {
          const quantities = this.extractQuantities(propDef)
          for (const obj of rel.RelatedObjects) {
            const eid = obj.expressID
            if (eid === undefined) continue
            if (!quantityMap.has(eid)) quantityMap.set(eid, [])
            quantityMap.get(eid)!.push(...quantities)
          }
        }
      } catch { /* skip malformed */ }
    }

    // Pass 3: materials
    const materialMap = new Map<number, string>()
    const materialElements = new Map<string, string[]>()
    const materialCategories = new Map<string, string | null>()

    for (const rel of model.types(IfcRelAssociatesMaterial)) {
      try {
        const matName = this.extractMaterialName(rel.RelatingMaterial)
        if (!matName) continue

        if (!materialCategories.has(matName)) {
          const cat = this.extractMaterialCategory(rel.RelatingMaterial)
          materialCategories.set(matName, cat)
        }

        for (const obj of rel.RelatedObjects) {
          const eid = obj.expressID
          if (eid === undefined) continue
          materialMap.set(eid, matName)

          try {
            const gid = (obj as { GlobalId?: string }).GlobalId
            if (gid) {
              if (!materialElements.has(matName)) materialElements.set(matName, [])
              materialElements.get(matName)!.push(gid)
            }
          } catch { /* not all RelatedObjects have GlobalId */ }
        }
      } catch { /* skip malformed */ }
    }

    // Pass 4: collect elements by type
    const elements: ElementRecord[] = []
    const elementsByType = new Map<string, ElementRecord[]>()
    const elementsByStorey = new Map<string, ElementRecord[]>()
    const elementsByMaterial = new Map<string, ElementRecord[]>()
    const globalIdToElement = new Map<string, ElementRecord>()

    for (const { cls, name } of ELEMENT_TYPES) {
      const typeElements: ElementRecord[] = []

      for (const entity of model.types(cls)) {
        try {
          const eid = entity.expressID
          const globalId = entity.GlobalId
          const spatial = eid !== undefined ? spatialMap.get(eid) : undefined

          const record: ElementRecord = {
            localId: entity.localID,
            expressId: eid,
            globalId,
            name: entity.Name,
            typeName: name,
            storeyName: spatial?.storeyName ?? null,
            storeyGlobalId: spatial?.storeyGlobalId ?? null,
            quantities: eid !== undefined ? (quantityMap.get(eid) ?? []) : [],
            propertySets: eid !== undefined ? (propertyMap.get(eid) ?? []) : [],
            materialName: eid !== undefined ? (materialMap.get(eid) ?? null) : null,
          }

          elements.push(record)
          typeElements.push(record)
          globalIdToElement.set(globalId, record)

          if (record.storeyName) {
            if (!elementsByStorey.has(record.storeyName)) {
              elementsByStorey.set(record.storeyName, [])
            }
            elementsByStorey.get(record.storeyName)!.push(record)
          }

          if (record.materialName) {
            if (!elementsByMaterial.has(record.materialName)) {
              elementsByMaterial.set(record.materialName, [])
            }
            elementsByMaterial.get(record.materialName)!.push(record)
          }
        } catch { /* skip malformed entities */ }
      }

      if (typeElements.length > 0) {
        elementsByType.set(name, typeElements)
      }
    }

    // Build material records
    const materials: MaterialRecord[] = []
    for (const [name, globalIds] of materialElements) {
      materials.push({
        name,
        category: materialCategories.get(name) ?? null,
        elementCount: globalIds.length,
        elementGlobalIds: globalIds,
      })
    }

    return {
      elements,
      storeys: Array.from(storeyMap.values()).sort(
        (a, b) => (a.elevation ?? 0) - (b.elevation ?? 0),
      ),
      materials,
      extractionTimeMs: performance.now() - start,
      elementsByType,
      elementsByStorey,
      elementsByMaterial,
      globalIdToElement,
    }
  }

  private extractPropertySet(pset: IfcPropertySet): PropertySetRecord {
    const properties: PropertyRecord[] = []
    try {
      for (const prop of pset.HasProperties) {
        if (prop instanceof IfcPropertySingleValue) {
          properties.push({
            name: prop.Name ?? '',
            value: this.extractPropertyValue(prop),
          })
        }
      }
    } catch { /* skip */ }
    return { name: pset.Name ?? 'Unnamed', properties }
  }

  private extractPropertyValue(prop: IfcPropertySingleValue): string | number | boolean | null {
    try {
      const nominal = prop.NominalValue
      if (nominal === null || nominal === undefined) return null
      // Conway wraps values in typed objects; access the underlying Value
      const val = nominal as { Value?: unknown }
      if ('Value' in val) {
        const v = val.Value
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v
        return String(v)
      }
      if (typeof nominal === 'string' || typeof nominal === 'number' || typeof nominal === 'boolean') {
        return nominal
      }
      return String(nominal)
    } catch {
      return null
    }
  }

  private extractQuantities(eq: IfcElementQuantity): QuantityRecord[] {
    const result: QuantityRecord[] = []
    const setName = eq.Name ?? 'Quantities'
    try {
      for (const q of eq.Quantities) {
        if (q instanceof IfcQuantityArea) {
          result.push({ setName, name: q.Name ?? 'Area', type: 'area', value: q.AreaValue })
        } else if (q instanceof IfcQuantityVolume) {
          result.push({ setName, name: q.Name ?? 'Volume', type: 'volume', value: q.VolumeValue })
        } else if (q instanceof IfcQuantityLength) {
          result.push({ setName, name: q.Name ?? 'Length', type: 'length', value: (q as { LengthValue: number }).LengthValue })
        } else if (q instanceof IfcQuantityWeight) {
          result.push({ setName, name: q.Name ?? 'Weight', type: 'weight', value: (q as { WeightValue: number }).WeightValue })
        } else if (q instanceof IfcQuantityCount) {
          result.push({ setName, name: q.Name ?? 'Count', type: 'count', value: (q as { CountValue: number }).CountValue })
        }
      }
    } catch { /* skip */ }
    return result
  }

  private extractMaterialName(mat: unknown): string | null {
    try {
      if (mat instanceof IfcMaterial) {
        return mat.Name
      }
      if (mat instanceof IfcMaterialList) {
        const names: string[] = []
        for (const m of (mat as { Materials: IfcMaterial[] }).Materials) {
          if (m instanceof IfcMaterial) names.push(m.Name)
        }
        return names.length > 0 ? names.join(' + ') : null
      }
      if (mat instanceof IfcMaterialLayerSetUsage) {
        const layerSet = mat.ForLayerSet
        if (layerSet) {
          if (layerSet.LayerSetName) return layerSet.LayerSetName
          const names: string[] = []
          for (const layer of layerSet.MaterialLayers) {
            const m = layer.Material
            if (m) names.push(m.Name)
          }
          return names.length > 0 ? names.join(' + ') : null
        }
      }
      if (mat instanceof IfcMaterialLayerSet) {
        if (mat.LayerSetName) return mat.LayerSetName
        const names: string[] = []
        for (const layer of mat.MaterialLayers) {
          const m = layer.Material
          if (m) names.push(m.Name)
        }
        return names.length > 0 ? names.join(' + ') : null
      }
      // IfcMaterialProfileSetUsage or other — try Name
      const named = mat as { Name?: string }
      if (named.Name) return named.Name
    } catch { /* skip */ }
    return null
  }

  private extractMaterialCategory(mat: unknown): string | null {
    try {
      if (mat instanceof IfcMaterial) return mat.Category
    } catch { /* skip */ }
    return null
  }
}
