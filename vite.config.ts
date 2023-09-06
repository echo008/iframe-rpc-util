import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/main.ts', import.meta.url)),
      name: 'iframeRPC',
      fileName: 'iframe-rpc',
      // formats: ['es', 'cjs', 'umd', 'iife']
    },
    // minify: false
  }
})
