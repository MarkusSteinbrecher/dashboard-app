import { DataTable } from '../components/DataTable'
import type { ElementRecord } from '../../ifc/types'

export class SelectionDetailCard {
  readonly element: HTMLElement
  private body: HTMLElement

  constructor() {
    this.element = document.createElement('div')
    this.element.className = 'chart-card full-width'

    const header = document.createElement('div')
    header.className = 'chart-card-header'
    header.innerHTML = `<span class="chart-card-title">Selection Details</span>`

    this.body = document.createElement('div')
    this.body.className = 'chart-card-body'
    this.showEmpty()

    this.element.appendChild(header)
    this.element.appendChild(this.body)
  }

  showElement(record: ElementRecord): void {
    this.body.innerHTML = ''

    // Element info
    const info = document.createElement('div')
    info.style.cssText = 'margin-bottom: 12px; font-size: 13px;'
    info.innerHTML = `
      <strong>${record.typeName}</strong>
      ${record.name ? ` — ${record.name}` : ''}
      <span style="color: var(--text-muted); margin-left: 8px;">${record.globalId}</span>
    `
    this.body.appendChild(info)

    // Properties table
    const rows: Record<string, unknown>[] = []
    for (const pset of record.propertySets) {
      for (const prop of pset.properties) {
        rows.push({
          set: pset.name,
          property: prop.name,
          value: prop.value ?? '',
        })
      }
    }

    // Quantities
    for (const q of record.quantities) {
      rows.push({
        set: q.setName,
        property: q.name,
        value: `${q.value.toFixed(3)} (${q.type})`,
      })
    }

    if (rows.length > 0) {
      const table = new DataTable(
        [
          { key: 'set', label: 'Set' },
          { key: 'property', label: 'Property' },
          { key: 'value', label: 'Value' },
        ],
        rows,
      )
      this.body.appendChild(table.element)
    } else {
      const empty = document.createElement('div')
      empty.className = 'chart-card-empty'
      empty.textContent = 'No properties or quantities for this element'
      this.body.appendChild(empty)
    }
  }

  showEmpty(): void {
    this.body.innerHTML = `
      <div class="chart-card-empty">Select an element in the viewer to see its properties</div>
    `
  }
}
