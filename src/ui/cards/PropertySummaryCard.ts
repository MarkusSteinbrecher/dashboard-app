import { Chart } from 'chart.js/auto'
import { ChartCard } from '../components/ChartCard'
import type { KpiSet } from '../../kpi/types'

export function createPropertySummaryCard(kpis: KpiSet): ChartCard {
  const card = new ChartCard('Property Summary')
  const { propertySummary } = kpis

  const body = card.element.querySelector('.chart-card-body')
  if (!body) return card

  // Summary counters
  const summaryGrid = document.createElement('div')
  summaryGrid.className = 'prop-summary-grid'
  summaryGrid.innerHTML = `
    <div class="prop-summary-item">
      <div class="value">${propertySummary.loadBearingCount}</div>
      <div class="label">Load Bearing</div>
    </div>
    <div class="prop-summary-item">
      <div class="value">${propertySummary.externalCount}</div>
      <div class="label">External</div>
    </div>
    <div class="prop-summary-item">
      <div class="value">${propertySummary.fireRatedCount}</div>
      <div class="label">Fire Rated</div>
    </div>
  `
  body.innerHTML = ''
  body.appendChild(summaryGrid)

  // Fire rating bar chart if data exists
  if (propertySummary.fireRatings.length > 0) {
    const canvas = document.createElement('canvas')
    body.appendChild(canvas)

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: propertySummary.fireRatings.map((r) => r.rating),
        datasets: [{
          label: 'Elements',
          data: propertySummary.fireRatings.map((r) => r.count),
          backgroundColor: '#e57373',
          borderWidth: 0,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Fire Ratings',
            color: '#666666',
            font: { size: 11 },
            align: 'start',
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#FFFFFF' },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#666666' },
          },
        },
      },
    })
  }

  return card
}
