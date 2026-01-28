import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'

// Copy preload.cjs to dist-electron on build
function copyPreload() {
  return {
    name: 'copy-preload',
    writeBundle() {
      if (!existsSync('dist-electron')) {
        mkdirSync('dist-electron', { recursive: true })
      }
      copyFileSync('electron/preload.cjs', 'dist-electron/preload.cjs')
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron', 'serialport', 'usb']
            }
          },
          plugins: [copyPreload()]
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  css: {
    postcss: './postcss.config.js'
  },
  build: {
    cssMinify: 'esbuild'  // Use esbuild instead of lightningcss to avoid @property warnings
  }
})
