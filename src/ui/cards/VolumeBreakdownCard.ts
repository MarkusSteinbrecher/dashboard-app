import { ChartCard } from '../components/ChartCard'
import type { KpiSet } from '../../kpi/types'
import { formatVolume } from '../../utils/formatting'

const COLORS = [
  '#90CAF9', '#80CBC4', '#CE93D8', '#FFB74D',
  '#A5D6A7', '#EF9A9A', '#B0BEC5', '#FFF176',
]

export function createVolumeBreakdownCard(
  kpis: KpiSet,
  onSegmentClick?: (type: string) => void,
): ChartCard {
  const card = new ChartCard('Volume by Type', formatVolume(kpis.totalVolume))

  if (kpis.volumeByType.length === 0) {
    card.showEmpty('No volume data available')
    return card
  }

  const labels = kpis.volumeByType.map((v) => v.type)
  const data = kpis.volumeByType.map((v) => v.volume)

  card.renderChart({
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: COLORS.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#2d2d2d',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: 'rgba(255,255,255,0.7)', boxWidth: 12, padding: 8, font: { size: 11 } },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${formatVolume(ctx.parsed)}`,
          },
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
