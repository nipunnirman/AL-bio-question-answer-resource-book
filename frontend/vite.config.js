import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/frontend/',
  server: {
    proxy: {
      '/qa': 'http://localhost:8000',
      '/api': 'http://localhost:8000',
      '/docs': 'http://localhost:8000',
      '/redoc': 'http://localhost:8000',
      '/index-pdf': 'http://localhost:8000',
    },
  },
})
