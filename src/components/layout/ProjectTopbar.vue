<script setup lang="ts">
import { useRoute } from 'vue-router'

import { useProject } from '@/api/queries/project'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const ui = useUiStore()

const slug = computed(() => String(route.params.slug ?? ''))
const { data: project } = useProject(slug)
</script>

<template>
  <div class="flex flex-1 items-center gap-4">
    <nav aria-label="Breadcrumb" class="flex min-w-0 items-center gap-2 text-[13px]">
      <RouterLink :to="{ name: 'workspace' }" class="shrink-0 text-dim hover:text-fg">
        Projects
      </RouterLink>
      <i-lucide-chevron-right class="size-3.5 shrink-0 text-mute" />
      <span class="shrink-0 truncate text-dim">{{ project?.name ?? slug }}</span>
      <i-lucide-chevron-right class="size-3.5 shrink-0 text-mute" />
      <span class="truncate font-medium">Overview</span>
    </nav>

    <div class="ml-auto flex items-center gap-2.5">
      <button
        class="flex h-9 w-[240px] items-center gap-2 rounded-[var(--pm-radius)] border bg-surface px-3 text-[13px] text-mute transition-colors hover:bg-surface-2"
        @click="ui.commandPaletteOpen = true"
      >
        <i-lucide-search class="size-4 shrink-0" />
        <span class="flex-1 text-left">Search anything...</span>
        <kbd class="rounded border px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
      </button>

      <NotificationBell />

      <button
        class="grid size-10 place-items-center rounded-[var(--pm-radius)] text-dim transition-colors hover:bg-surface-2 hover:text-fg"
        :aria-label="`Switch to ${ui.resolvedTheme === 'dark' ? 'light' : 'dark'} theme`"
        @click="ui.toggleTheme()"
      >
        <i-lucide-moon v-if="ui.resolvedTheme === 'dark'" class="size-5" />
        <i-lucide-sun v-else class="size-5" />
      </button>
    </div>
  </div>
</template>
