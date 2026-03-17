# Dashboard App for Bldrs Share

## Project Overview

An iframe-based dashboard app that runs inside Bldrs Share's side drawer. Independently parses IFC files using Conway's data-only parser and renders KPI visualizations with Chart.js.

## Tech Stack

- Vite 6 + TypeScript (vanilla, no React)
- Chart.js 4 for visualizations
- @bldrs-ai/conway for IFC parsing (data-only, no WASM geometry)

## Commands

```bash
yarn dev      # Start dev server on port 5173
yarn build    # Production build to dist/
yarn preview  # Preview production build
```

## Architecture

```
ShareBridge (MessageChannel) → IfcModelLoader (Conway) → IfcDataExtractor → KpiCalculator → Dashboard UI
```

- **ShareBridge**: MessageChannel port management for parent-iframe comms. Receives raw IFC bytes via `getFileData` message.
- **IfcModelLoader**: Parses IFC via Conway's `parseDataToModel()`
- **IfcDataExtractor**: Multi-pass extraction of spatial, properties, quantities, materials
- **KpiCalculator**: Aggregates extraction into KPI metrics
- **Dashboard**: Renders 6 chart cards + selection detail panel

## Conway Import Pattern

```typescript
import IfcStepParser from '@bldrs-ai/conway/src/ifc/ifc_step_parser'
import { IfcWall, ... } from '@bldrs-ai/conway/src/ifc/ifc4_gen/index'
```

Conway's `parseHeader()` returns `[StepHeader, ParseResult]` (header first, result second).

## Integration with Share

Register in Share's `AppsRegistry.json`:
```json
{ "appName": "Dashboard App", "action": "/widgets/dashboard-app/index.html" }
```

Two modes:
- **Embedded**: Receives raw IFC file bytes via MessageChannel from Share (uses OPFS-cached file)
- **Standalone**: File picker / drag-and-drop when not in iframe
