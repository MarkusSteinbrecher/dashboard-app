import { ChartCard } from '../components/ChartCard'
import type { KpiSet } from '../../kpi/types'

const COLORS = [
  '#FF6B35', '#00D4AA', '#5B8ED8', '#A78BFA',
  '#FBBF24', '#FF4444', '#FF8555', '#00B894',
]

export function createMaterialBreakdownCard(
  kpis: KpiSet,
  onSegmentClick?: (material: string) => void,
): ChartCard {
  const card = new ChartCard('Material Distribution', `${kpis.materialBreakdown.length} materials`)

  if (kpis.materialBreakdown.length === 0) {
    card.showEmpty('No material data available')
    return card
  }

  const sorted = [...kpis.materialBreakdown].sort((a, b) => b.elementCount - a.elementCount)
  const labels = sorted.map((m) => m.material)
  const data = sorted.map((m) => m.elementCount)

  card.renderChart({
    type: 'pie',
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
          labels: { color: '#FFFFFF', boxWidth: 12, padding: 8, font: { size: 11 } },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.parsed} elements`,
          },
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
