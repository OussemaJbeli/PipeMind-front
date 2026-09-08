<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { useProject } from '@/api/queries/project'
import { useProjectRealtime } from '@/composables/useProjectRealtime'
import { useWorkspaceRealtime } from '@/composables/useWorkspaceRealtime'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const route = useRoute()

// Subscribed at the layout, not per view: navigating between a project's pages
// must not tear the socket down and re-authorise it on every click.
const slug = computed(() => String(route.params.slug ?? ''))
const { data: project } = useProject(slug)

useProjectRealtime(() => project.value?.uuid)

// Also the team channel and the reconnect resync: a user can sit on a project
// page across a disconnect, and that is exactly when a resync matters.
useWorkspaceRealtime()
</script>

<template>
  <div class="min-h-screen bg-bg text-fg">
    <aside
      class="fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-sidebar transition-[width] duration-200"
      :style="{ width: ui.sidebarCollapsed ? 'var(--pm-sidebar-w-collapsed)' : 'var(--pm-sidebar-w)' }"
    >
      <ProjectSidebar />
    </aside>

    <div
      class="flex min-h-screen flex-col transition-[padding] duration-200"
      :style="{ paddingLeft: ui.sidebarCollapsed ? 'var(--pm-sidebar-w-collapsed)' : 'var(--pm-sidebar-w)' }"
    >
      <header
        class="sticky top-0 z-30 flex items-center gap-4 border-b bg-bg/85 px-6 backdrop-blur-md"
        :style="{ height: 'var(--pm-topbar-h)' }"
      >
        <ProjectTopbar />
        <ConnectionIndicator class="ml-auto shrink-0" />
      </header>

      <main class="flex-1 px-6 py-6">
        <slot />
      </main>
    </div>

    <CommandPalette />
  </div>
</template>
