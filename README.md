# Dashboard App

A test app for [Bldrs Share](https://github.com/bldrs-ai/Share) that displays KPI visualizations from IFC building models.

Runs as an iframe widget inside Share's side drawer, parsing IFC files independently via Conway's data-only parser and rendering charts with Chart.js.

## Development

```bash
yarn install
yarn dev      # Dev server on port 5173
yarn build    # Production build to dist/
```
