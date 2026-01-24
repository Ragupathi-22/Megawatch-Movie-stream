import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'TogetherPlay',
        short_name: 'TogetherPlay',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone'
      }
    })
  ]
})
