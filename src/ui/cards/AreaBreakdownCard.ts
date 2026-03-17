import { ChartCard } from '../components/ChartCard'
import type { KpiSet } from '../../kpi/types'
import { formatArea } from '../../utils/formatting'

const COLORS = [
  '#4fc3f7', '#81c784', '#ffb74d', '#e57373',
  '#ba68c8', '#4db6ac', '#fff176', '#f06292',
]

export function createAreaBreakdownCard(
  kpis: KpiSet,
  onSegmentClick?: (storey: string) => void,
): ChartCard {
  const card = new ChartCard('Area by Storey', formatArea(kpis.totalArea))

  if (kpis.areaByStorey.length === 0) {
    card.showEmpty('No area data available')
    return card
  }

  const labels = kpis.areaByStorey.map((s) => s.storey)
  const data = kpis.areaByStorey.map((s) => s.area)

  card.renderChart({
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Area (m\u00B2)',
        data,
        backgroundColor: COLORS.slice(0, labels.length),
        borderWidth: 0,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => formatArea(ctx.parsed.y ?? 0),
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#e0e0e0', maxRotation: 45 },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.06)' },
          ticks: { color: '#a0a0a0' },
        },
      },
      onClick: (_event, elements) => {
        if (elements.length > 0 && onSegmentClick) {
          onSegmentClick(labels[elements[0].index])
        }
      },
    },
  })

  return card
}
