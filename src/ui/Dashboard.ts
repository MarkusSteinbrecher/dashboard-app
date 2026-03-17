import { ShareBridge } from '../share-bridge/ShareBridge'
import { IfcModelLoader } from '../ifc/IfcModelLoader'
import { IfcDataExtractor } from '../ifc/IfcDataExtractor'
import { KpiCalculator } from '../kpi/KpiCalculator'
import type { ExtractionResult } from '../ifc/types'
import type { KpiSet } from '../kpi/types'
import { formatDuration, formatFileSize, formatNumber } from '../utils/formatting'
import { createLoadingSpinner, updateLoadingMessage } from './components/LoadingSpinner'
import { createErrorBanner } from './components/ErrorBanner'
import { ChartCard } from './components/ChartCard'
import { createElementCountCard } from './cards/ElementCountCard'
import { createAreaBreakdownCard } from './cards/AreaBreakdownCard'
import { createVolumeBreakdownCard } from './cards/VolumeBreakdownCard'
import { createSpatialTreeCard } from './cards/SpatialTreeCard'
import { createMaterialBreakdownCard } from './cards/MaterialBreakdownCard'
import { createPropertySummaryCard } from './cards/PropertySummaryCard'
import { SelectionDetailCard } from './cards/SelectionDetailCard'

export class Dashboard {
  private root: HTMLElement
  private bridge: ShareBridge
  private loader = new IfcModelLoader()
  private extractor = new IfcDataExtractor()
  private calculator = new KpiCalculator()
  private cards: ChartCard[] = []
  private selectionCard: SelectionDetailCard | null = null
  private extraction: ExtractionResult | null = null

  constructor(root: HTMLElement) {
    this.root = root
    this.bridge = new ShareBridge()
  }

  async init(): Promise<void> {
    this.showLoading('Connecting to Bldrs Share...')

    const connected = await this.bridge.waitForConnection()

    if (connected) {
      await this.loadFromShare()
    } else {
      this.showStandaloneMode()
    }
  }

  private async loadFromShare(): Promise<void> {
    this.showLoading('Fetching IFC file from Share...')
    try {
      const fileData = await this.bridge.getFileData()
      if (!fileData) {
        this.showEmpty('No model loaded. Open a model in Share to see KPIs.')
        return
      }

      this.showLoading('Parsing IFC file...')
      const loadResult = this.loader.parse(new Uint8Array(fileData))

      this.showLoading('Extracting model data...')
      const extraction = this.extractor.extract(loadResult.model)

      this.showLoading('Calculating KPIs...')
      const kpis = this.calculator.calculate(extraction)

      this.extraction = extraction
      this.render(kpis, extraction, loadResult.parseTimeMs, loadResult.fileSizeBytes)
    } catch (err) {
      this.showError(err instanceof Error ? err : new Error(String(err)))
    }
  }

  private async loadFile(file: File): Promise<void> {
    this.showLoading('Parsing IFC file...')
    try {
      const loadResult = await this.loader.loadFromFile(file)

      this.showLoading('Extracting model data...')
      const extraction = this.extractor.extract(loadResult.model)

      this.showLoading('Calculating KPIs...')
      const kpis = this.calculator.calculate(extraction)

      this.extraction = extraction
      this.render(kpis, extraction, loadResult.parseTimeMs, loadResult.fileSizeBytes)
    } catch (err) {
      this.showError(err instanceof Error ? err : new Error(String(err)))
    }
  }

  render(kpis: KpiSet, extraction: ExtractionResult, parseTimeMs: number, fileSizeBytes: number): void {
    this.destroyCards()
    this.root.innerHTML = ''

    // Header
    const header = document.createElement('div')
    header.className = 'dashboard-header'
    header.innerHTML = `
      <h1>Dashboard App</h1>
      <div class="meta">
        Parsed in ${formatDuration(parseTimeMs)} &middot;
        ${formatNumber(extraction.elements.length, 0)} elements &middot;
        ${formatFileSize(fileSizeBytes)}
      </div>
    `

    // Summary stats
    const stats = document.createElement('div')
    stats.className = 'summary-stats'
    stats.innerHTML = `
      <div class="stat">
        <span class="stat-value">${extraction.elements.length}</span>
        <span class="stat-label">Elements</span>
      </div>
      <div class="stat">
        <span class="stat-value">${extraction.storeys.length}</span>
        <span class="stat-label">Storeys</span>
      </div>
      <div class="stat">
        <span class="stat-value">${extraction.materials.length}</span>
        <span class="stat-label">Materials</span>
      </div>
      <div class="stat">
        <span class="stat-value">${extraction.elementsByType.size}</span>
        <span class="stat-label">Types</span>
      </div>
    `

    // Grid
    const grid = document.createElement('div')
    grid.className = 'dashboard-grid'

    // Row 1: Element Counts + Area
    const elementCard = createElementCountCard(kpis)
    const areaCard = createAreaBreakdownCard(kpis)
    this.cards.push(elementCard, areaCard)
    grid.appendChild(elementCard.element)
    grid.appendChild(areaCard.element)

    // Row 2: Volume + Spatial
    const volumeCard = createVolumeBreakdownCard(kpis)
    const spatialCard = createSpatialTreeCard(kpis)
    this.cards.push(volumeCard, spatialCard)
    grid.appendChild(volumeCard.element)
    grid.appendChild(spatialCard.element)

    // Row 3: Material + Property Summary
    const materialCard = createMaterialBreakdownCard(kpis)
    const propCard = createPropertySummaryCard(kpis)
    this.cards.push(materialCard, propCard)
    grid.appendChild(materialCard.element)
    grid.appendChild(propCard.element)

    // Row 4: Selection Detail (full width)
    this.selectionCard = new SelectionDetailCard()
    grid.appendChild(this.selectionCard.element)

    this.root.appendChild(header)
    this.root.appendChild(stats)
    this.root.appendChild(grid)
  }

  showLoading(message: string): void {
    const existing = this.root.querySelector('.state-container')
    if (existing) {
      updateLoadingMessage(existing as HTMLElement, message)
      return
    }
    this.root.innerHTML = ''
    this.root.appendChild(createLoadingSpinner(message))
  }

  showError(error: Error): void {
    this.root.innerHTML = ''
    this.root.appendChild(
      createErrorBanner(error.message, () => this.init()),
    )
  }

  private showEmpty(message: string): void {
    this.root.innerHTML = ''
    const container = document.createElement('div')
    container.className = 'state-container'
    container.innerHTML = `<h2>${message}</h2>`
    this.root.appendChild(container)
  }

  private showStandaloneMode(): void {
    this.root.innerHTML = ''
    const container = document.createElement('div')
    container.className = 'state-container'
    container.innerHTML = `
      <h2>Standalone Mode</h2>
      <p>Not connected to Bldrs Share. Load an IFC file directly.</p>
    `

    // Drop zone
    const dropZone = document.createElement('div')
    dropZone.className = 'drop-zone'
    dropZone.textContent = 'Drag & drop an IFC file here'

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault()
      dropZone.classList.add('drag-over')
    })
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over')
    })
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault()
      dropZone.classList.remove('drag-over')
      const file = e.dataTransfer?.files[0]
      if (file && file.name.toLowerCase().endsWith('.ifc')) {
        this.loadFile(file)
      }
    })

    // File picker
    const picker = document.createElement('div')
    picker.className = 'file-picker'
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.ifc'
    input.id = 'ifc-file-input'
    input.addEventListener('change', () => {
      const file = input.files?.[0]
      if (file) this.loadFile(file)
    })
    const label = document.createElement('label')
    label.htmlFor = 'ifc-file-input'
    label.textContent = 'Choose IFC File'
    picker.appendChild(input)
    picker.appendChild(label)

    container.appendChild(dropZone)
    container.appendChild(picker)
    this.root.appendChild(container)
  }

  private destroyCards(): void {
    for (const card of this.cards) card.destroy()
    this.cards = []
    this.selectionCard = null
  }
}
