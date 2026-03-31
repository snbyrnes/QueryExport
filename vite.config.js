import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/fhir-api': {
        target: 'https://nmpc.hse.ie',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fhir-api/, '/production1/fhir'),
        secure: true
      },
      '/auth-api': {
        target: 'https://nmpc.hse.ie',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/auth-api/, '/authorisation/auth'),
        secure: true
      }
    }
  }
})
