import { VueQueryPlugin } from '@tanstack/vue-query'
import FloatingVue from 'floating-vue'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router/guards'
import { setUnauthenticatedHandler } from './api/client'
import { useUiStore } from './stores/ui'

import 'nprogress/nprogress.css'
import 'floating-vue/dist/style.css'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(FloatingVue, { themes: { tooltip: { distance: 8 } } })
app.use(VueQueryPlugin, {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        retry: (failureCount, error: any) =>
          // Only retry what a retry could plausibly fix.
          Boolean(error?.retryable) && failureCount < 2,
        refetchOnWindowFocus: true,
        staleTime: 30_000,
      },
    },
  },
})

// Apply the stored theme before first paint to avoid a flash of the wrong one.
const ui = useUiStore(pinia)
ui.applyTheme()

setUnauthenticatedHandler(() => {
  if (router.currentRoute.value.meta.requiresAuth) {
    router.push({
      name: 'login',
      query: { redirect: router.currentRoute.value.fullPath },
    })
  }
})

app.mount('#app')
