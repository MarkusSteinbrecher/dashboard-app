import { ChartCard } from '../components/ChartCard'
import type { KpiSet } from '../../kpi/types'
import { formatArea } from '../../utils/formatting'

const COLORS = [
  '#90CAF9', '#80CBC4', '#CE93D8', '#FFB74D',
  '#A5D6A7', '#EF9A9A', '#B0BEC5', '#FFF176',
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
          ticks: { color: 'rgba(255,255,255,0.7)', maxRotation: 45 },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: 'rgba(255,255,255,0.3)' },
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
