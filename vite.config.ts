import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
      dts: 'src/types/auto-imports.d.ts',
      dirs: ['src/composables', 'src/stores'],
      vueTemplate: true,
    }),
    Components({
      dirs: ['src/components'],
      resolvers: [
        IconsResolver({ prefix: 'i', enabledCollections: ['lucide', 'simple-icons'] }),
      ],
      dts: 'src/types/components.d.ts',
    }),
    Icons({ compiler: 'vue3', autoInstall: false }),
  ],

  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },

  server: {
    port: 5173,
    // Same-origin in dev so Sanctum's cookie auth works without CORS
    // configuration, and so it matches deploying behind one domain later.
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/sanctum': { target: 'http://localhost:8000', changeOrigin: true },
      '/broadcasting': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },

  build: {
    rollupOptions: {
      output: {
        // Rolldown (Vite 8+) requires a function here, not an object map.
        // Charts are ~60 KB and only the project board needs them.
        manualChunks(id) {
          if (id.includes('chart.js') || id.includes('vue-chartjs'))
            return 'charts'

          if (id.includes('/node_modules/'))
            return 'vendor'

          return undefined
        },
      },
    },
  },
})
