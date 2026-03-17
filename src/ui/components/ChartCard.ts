import { Chart, type ChartConfiguration } from 'chart.js/auto'

export class ChartCard {
  readonly element: HTMLElement
  private canvas: HTMLCanvasElement
  private chart: Chart | null = null

  constructor(
    private title: string,
    private subtitle?: string,
  ) {
    this.element = document.createElement('div')
    this.element.className = 'chart-card'

    const header = document.createElement('div')
    header.className = 'chart-card-header'
    header.innerHTML = `
      <span class="chart-card-title">${this.title}</span>
      ${this.subtitle ? `<span class="chart-card-subtitle">${this.subtitle}</span>` : ''}
    `

    const body = document.createElement('div')
    body.className = 'chart-card-body'

    this.canvas = document.createElement('canvas')
    body.appendChild(this.canvas)

    this.element.appendChild(header)
    this.element.appendChild(body)
  }

  renderChart(config: ChartConfiguration): void {
    if (this.chart) {
      this.chart.destroy()
    }
    this.chart = new Chart(this.canvas, config)
  }

  showEmpty(message: string): void {
    const body = this.element.querySelector('.chart-card-body')
    if (body) {
      body.innerHTML = `<div class="chart-card-empty">${message}</div>`
    }
  }

  setFullWidth(): void {
    this.element.classList.add('full-width')
  }

  destroy(): void {
    if (this.chart) {
      this.chart.destroy()
      this.chart = null
    }
  }
}
