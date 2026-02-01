import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true, // Fail if port is in use (instead of trying another)
  },
  preview: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
          'i18n': ['i18next', 'react-i18next'],
          'state': ['zustand'],
          'export': ['jspdf', 'jspdf-autotable', 'papaparse'],
          'qr': ['qrcode.react'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
