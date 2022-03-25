import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  css: {
    modules: {
      localIdentName: '[local]_[hash:base64:5]',
      localsConvention: 'camelCaseOnly',
    }
  }
})
