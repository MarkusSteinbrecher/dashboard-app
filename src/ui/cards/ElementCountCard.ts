import { ChartCard } from '../components/ChartCard'
import type { KpiSet } from '../../kpi/types'

const COLORS = [
  '#4fc3f7', '#81c784', '#ffb74d', '#e57373',
  '#ba68c8', '#4db6ac', '#fff176', '#f06292',
]

export function createElementCountCard(
  kpis: KpiSet,
  onSegmentClick?: (type: string) => void,
): ChartCard {
  const card = new ChartCard('Element Counts', `${kpis.elementCounts.reduce((s, c) => s + c.count, 0)} total`)

  if (kpis.elementCounts.length === 0) {
    card.showEmpty('No building elements found')
    return card
  }

  const labels = kpis.elementCounts.map((c) => c.type)
  const data = kpis.elementCounts.map((c) => c.count)

  card.renderChart({
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: COLORS.slice(0, labels.length),
        borderWidth: 0,
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.parsed.x} elements`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.06)' },
          ticks: { color: '#a0a0a0' },
        },
        y: {
          grid: { display: false },
          ticks: { color: '#e0e0e0' },
        },
      },
      onClick: (_event, elements) => {
        if (elements.length > 0 && onSegmentClick) {
          onSegmentClick('Ifc' + labels[elements[0].index])
        }
      },
    },
  })

  return card
}
