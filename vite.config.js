import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'India Market Intelligence',
        short_name: 'IndiaMarket',
        description: 'Live Indian financial news — stocks, policy, trade, economy',
        theme_color: '#070d1a',
        background_color: '#070d1a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.rss2json\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'rss-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 15 },
            }
          },
          {
            urlPattern: /^https:\/\/api\.allorigins\.win\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'cors-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 15 },
            }
          }
        ]
      }
    })
  ]
})
