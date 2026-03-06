import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    proxy: {
      // In dev, proxy /api/notion/* → https://api.notion.com/*
      // This avoids CORS issues without needing a browser extension
      '/api/notion': {
        target: 'https://api.notion.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/notion/, ''),
        secure: true,
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: "Hugo's Health App",
        short_name: 'HealthApp',
        description: 'Personal health tracking for you and your close circle',
        theme_color: '#10b981',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /\/(api\/notion|api\.notion\.com)\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'notion-api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24
              }
            }
          }
        ]
      }
    })
  ]
})
