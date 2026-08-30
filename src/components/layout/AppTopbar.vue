<script setup lang="ts">
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>

<template>
  <div class="flex flex-1 items-center justify-end gap-2">
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
