import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'iframeRPC',
      fileName: 'iframe-rpc',
      // formats: ['es', 'cjs', 'umd', 'iife']
    },
    // minify: false
  }
})
