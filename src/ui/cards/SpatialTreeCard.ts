import { ChartCard } from '../components/ChartCard'
import type { KpiSet } from '../../kpi/types'

const TYPE_COLORS: Record<string, string> = {
  Wall: '#4fc3f7',
  Door: '#81c784',
  Window: '#ffb74d',
  Slab: '#e57373',
  Beam: '#ba68c8',
  Column: '#4db6ac',
  Space: '#fff176',
}

export function createSpatialTreeCard(
  kpis: KpiSet,
  onSegmentClick?: (storey: string) => void,
): ChartCard {
  const card = new ChartCard('Elements per Storey')

  if (kpis.elementsPerStorey.length === 0) {
    card.showEmpty('No spatial structure found')
    return card
  }

  // Collect all unique types across storeys
  const allTypes = new Set<string>()
  for (const s of kpis.elementsPerStorey) {
    for (const t of s.types) allTypes.add(t.type)
  }
  const typeList = Array.from(allTypes)

  const labels = kpis.elementsPerStorey.map((s) => s.storey)
  const datasets = typeList.map((type) => ({
    label: type,
    data: kpis.elementsPerStorey.map((s) => {
      const found = s.types.find((t) => t.type === type)
      return found?.count ?? 0
    }),
    backgroundColor: TYPE_COLORS[type] ?? '#888888',
    borderWidth: 0,
    borderRadius: 2,
  }))

  card.renderChart({
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { color: '#e0e0e0', boxWidth: 10, padding: 6, font: { size: 11 } },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: '#e0e0e0', maxRotation: 45 },
        },
        y: {
          stacked: true,
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
