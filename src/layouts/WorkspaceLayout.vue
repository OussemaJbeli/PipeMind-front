<script setup lang="ts">
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>

<template>
  <div class="min-h-screen bg-bg text-fg">
    <aside
      class="fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-sidebar transition-[width] duration-200"
      :style="{ width: ui.sidebarCollapsed ? 'var(--pm-sidebar-w-collapsed)' : 'var(--pm-sidebar-w)' }"
    >
      <slot name="sidebar">
        <AppSidebar />
      </slot>
    </aside>

    <div
      class="flex min-h-screen flex-col transition-[padding] duration-200"
      :style="{ paddingLeft: ui.sidebarCollapsed ? 'var(--pm-sidebar-w-collapsed)' : 'var(--pm-sidebar-w)' }"
    >
      <header
        class="sticky top-0 z-30 flex items-center gap-4 border-b bg-bg/85 px-6 backdrop-blur-md"
        :style="{ height: 'var(--pm-topbar-h)' }"
      >
        <slot name="topbar">
          <AppTopbar />
        </slot>
      </header>

      <main class="flex-1 px-6 py-6">
        <slot />
      </main>
    </div>

    <CommandPalette />
  </div>
</template>
