<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()
</script>

<template>
  <div class="flex flex-1 items-center justify-end gap-2.5">
    <slot name="start" />

    <!-- The workspace shell had no search affordance, so ⌘K was undiscoverable
         outside a project. The shortcut is printed for the same reason. -->
    <button
      class="mr-auto flex h-9 w-full max-w-[280px] items-center gap-2 rounded-[var(--pm-radius)] border bg-surface px-3 text-[13px] text-mute transition-colors hover:border-[color:var(--pm-text-mute)]"
      @click="ui.commandPaletteOpen = true"
    >
      <i-lucide-search class="size-3.5 shrink-0" />
      <span class="flex-1 text-left">Search anything…</span>
      <kbd class="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
    </button>

    <PmButton v-if="auth.can('projects.manage')" variant="primary">
      <i-lucide-plus class="size-4" /> Add Project
    </PmButton>

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
</template>
