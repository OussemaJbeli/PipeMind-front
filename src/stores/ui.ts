import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

type Theme = 'dark' | 'light' | 'system'

export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = useStorage('pm.sidebar', false)
  const theme = useStorage<Theme>('pm.theme', 'dark')
  const projectViewMode = useStorage<'grid' | 'list'>('pm.projectView', 'grid')
  const commandPaletteOpen = ref(false)

  const resolvedTheme = computed<'dark' | 'light'>(() => {
    if (theme.value !== 'system')
      return theme.value

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  function applyTheme() {
    document.documentElement.dataset.theme = resolvedTheme.value

    // Chart.js reads its colours once at registration, so a theme switch leaves
    // every live chart painted for the old palette until it is told to repaint.
    void import('@/components/charts/chartDefaults').then(m => m.refreshChartTheme())
  }

  function toggleTheme() {
    theme.value = resolvedTheme.value === 'dark' ? 'light' : 'dark'
  }

  // Follow the OS while on "system", and react to a manual change.
  watch(resolvedTheme, applyTheme, { immediate: false })

  return {
    sidebarCollapsed,
    theme,
    resolvedTheme,
    projectViewMode,
    commandPaletteOpen,
    applyTheme,
    toggleTheme,
  }
})
