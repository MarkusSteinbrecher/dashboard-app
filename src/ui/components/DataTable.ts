export interface DataTableColumn {
  key: string
  label: string
  numeric?: boolean
  format?: (value: unknown) => string
}

export class DataTable {
  readonly element: HTMLElement

  constructor(
    private columns: DataTableColumn[],
    private data: Record<string, unknown>[],
  ) {
    this.element = document.createElement('div')
    this.render()
  }

  private render(): void {
    const table = document.createElement('table')
    table.className = 'data-table'

    const thead = document.createElement('thead')
    const headerRow = document.createElement('tr')
    for (const col of this.columns) {
      const th = document.createElement('th')
      th.textContent = col.label
      if (col.numeric) th.className = 'numeric'
      headerRow.appendChild(th)
    }
    thead.appendChild(headerRow)
    table.appendChild(thead)

    const tbody = document.createElement('tbody')
    for (const row of this.data) {
      const tr = document.createElement('tr')
      for (const col of this.columns) {
        const td = document.createElement('td')
        if (col.numeric) td.className = 'numeric'
        const value = row[col.key]
        td.textContent = col.format ? col.format(value) : String(value ?? '')
        tr.appendChild(td)
      }
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)

    this.element.innerHTML = ''
    this.element.appendChild(table)
  }

  update(data: Record<string, unknown>[]): void {
    this.data = data
    this.render()
  }
}
