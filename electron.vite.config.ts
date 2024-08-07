import { defineConfig } from 'electron-vite'
import { resolve } from 'path'

import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: ['jimp', '@nut-tree/nut-js']
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        external: ['jimp', '@nut-tree/nut-js']
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
