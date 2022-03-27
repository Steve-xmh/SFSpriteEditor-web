import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/SFSpriteEditor-web/',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      workbox: {
        globPatterns: [
          '**\/*.{js,css,html}',
          'assets/**/*'
        ],
      },
      manifest: {
        name: 'SFSpriteEditor Web',
        description: 'A tool for editing sprites from the MegaMan Star Force series (aka Ryuusei no Rockman series).',
        icons: [
          {
            src: 'icon.png',
            sizes: '144x144',
            type: 'image/png',
          },
        ]
      }
    })
  ],
  css: {
    modules: {
      localIdentName: '[local]_[hash:base64:5]',
      localsConvention: 'camelCaseOnly',
    }
  }
})
