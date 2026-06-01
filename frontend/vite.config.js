import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 8080,
    // Allow ngrok or other external hostnames (add your ngrok host here if different)
    allowedHosts: [
      'rake-unfazed-fidelity.ngrok-free.dev'
    ],
    headers: {
      'ngrok-skip-browser-warning': 'true'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/qr-codes': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
