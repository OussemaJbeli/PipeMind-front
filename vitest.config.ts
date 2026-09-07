import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import { defineConfig } from 'vitest/config'

/**
 * Mirrors the app's plugin set.
 *
 * Without AutoImport and Components here, mounting any real component fails with
 * "ref is not defined" — because the app relies on auto-imports that only exist
 * in the Vite build. That is why no component in this project had ever been
 * unit-tested: the harness could not load one.
 *
 * Kept in step with vite.config.ts by hand. A divergence shows up immediately as
 * a failing mount, which is a loud enough signal.
 */
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
      dts: false,
      dirs: ['src/composables', 'src/stores'],
      vueTemplate: true,
    }),
    Components({
      dirs: ['src/components'],
      resolvers: [
        IconsResolver({ prefix: 'i', enabledCollections: ['lucide', 'simple-icons'] }),
      ],
      dts: false,
    }),
    Icons({ compiler: 'vue3', autoInstall: false }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.spec.ts'],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Views are thin composition over tested components and hooks; measuring
      // them mostly rewards mounting pages rather than asserting behaviour.
      exclude: ['src/views/**', 'src/types/**', 'src/main.ts', 'dist/**'],
    },
  },
})
