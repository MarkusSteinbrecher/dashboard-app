import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
  },
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          conway: ['@bldrs-ai/conway'],
          chartjs: ['chart.js'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['@bldrs-ai/conway'],
  },
})
