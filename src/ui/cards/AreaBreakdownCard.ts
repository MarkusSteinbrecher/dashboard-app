import { ChartCard } from '../components/ChartCard'
import type { KpiSet } from '../../kpi/types'
import { formatArea } from '../../utils/formatting'

const COLORS = [
  '#FF6B35', '#00D4AA', '#5B8ED8', '#A78BFA',
  '#FBBF24', '#FF4444', '#FF8555', '#00B894',
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
          ticks: { color: '#FFFFFF', maxRotation: 45 },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#666666' },
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
