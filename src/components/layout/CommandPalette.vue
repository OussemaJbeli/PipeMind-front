<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'
import { useRouter } from 'vue-router'

import { GROUP_ICON, useCommandPalette } from '@/composables/useCommandPalette'
import { useUiStore } from '@/stores/ui'
import { useWorkspaceProjects } from '@/api/queries/workspace'

const ui = useUiStore()
const router = useRouter()
const { data: projects } = useWorkspaceProjects()

/**
 * With no query, offer the projects rather than an empty box.
 *
 * "Jump to a project" is the commonest reason to open the palette, which is why
 * the sidebar's project header opens this instead of a second dropdown
 * implementation to maintain.
 */
const fallback = computed(() => [{
  type: 'project' as const,
  label: 'Jump to a project',
  items: (projects.value ?? []).slice(0, 8).map(project => ({
    id: project.uuid,
    title: project.name,
    subtitle: project.tech_stack?.join(' · ') || project.health_status,
    color: project.color,
    route: { name: 'project.overview', params: { slug: project.slug } },
  })),
}])

const { query, groups, active, move, reset, isFetching, searching, indexOf, selected }
  = useCommandPalette(fallback)

const input = ref<HTMLInputElement | null>(null)

// ⌘K / Ctrl+K. Bound at the shell so it works from any page, and
// preventDefault because Firefox maps Ctrl+K to its own search bar.
onKeyStroke(['k', 'K'], (event) => {
  if (event.metaKey || event.ctrlKey) {
    event.preventDefault()
    ui.commandPaletteOpen = !ui.commandPaletteOpen
  }
})

onKeyStroke('Escape', () => (ui.commandPaletteOpen = false))

watch(() => ui.commandPaletteOpen, async (open) => {
  if (!open) {
    reset()

    return
  }

  await nextTick()
  input.value?.focus()
})

/**
 * With no query, offer the projects rather than an empty box.
 *
 * An empty palette is a dead end — and "switch project" is the single most
 * common reason to open it, which is why the sidebar's project header opens
 * this instead of a second dropdown implementation.
 */
function go(item: { route: { name: string, params?: Record<string, string | number> } | null }) {
  if (!item.route)
    return

  router.push(item.route)
  ui.commandPaletteOpen = false
}

onKeyStroke('ArrowDown', (e) => {
  if (ui.commandPaletteOpen) {
    e.preventDefault()
    move(1)
  }
})

onKeyStroke('ArrowUp', (e) => {
  if (ui.commandPaletteOpen) {
    e.preventDefault()
    move(-1)
  }
})

onKeyStroke('Enter', () => {
  if (ui.commandPaletteOpen && selected.value)
    go(selected.value)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="ui.commandPaletteOpen"
      class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[12vh]"
      @click.self="ui.commandPaletteOpen = false"
    >
      <div
        class="w-full max-w-xl overflow-hidden rounded-[var(--pm-radius-lg)] border bg-surface shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        <div class="flex items-center gap-3 border-b px-4">
          <i-lucide-search class="size-4 shrink-0 text-mute" />
          <input
            ref="input"
            v-model="query"
            type="text"
            placeholder="Search projects, #821, an error message…"
            class="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-mute"
            aria-autocomplete="list"
          >
          <i-lucide-loader-circle v-if="isFetching" class="size-3.5 shrink-0 animate-spin text-mute" />
          <kbd class="shrink-0 rounded border px-1.5 py-0.5 text-[10px] text-mute">esc</kbd>
        </div>

        <div class="max-h-[54vh] overflow-y-auto p-2">
          <template v-for="(group, gi) in groups" :key="group.label">
            <p class="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-mute">
              {{ group.label }}
            </p>

            <button
              v-for="(item, ii) in group.items"
              :key="item.id"
              class="flex w-full items-center gap-3 rounded-[var(--pm-radius-sm)] px-2.5 py-2 text-left transition-colors"
              :class="indexOf(gi, ii) === active ? 'bg-surface-2' : 'hover:bg-surface-2'"
              @click="go(item)"
              @mouseenter="active = indexOf(gi, ii)"
            >
              <i
                :class="GROUP_ICON[group.type] ?? 'i-lucide-circle'"
                class="size-3.5 shrink-0"
                :style="{ color: item.color ?? 'var(--pm-text-mute)' }"
              />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[13px]">{{ item.title }}</span>
                <span v-if="item.subtitle" class="block truncate text-[11px] text-mute">
                  {{ item.subtitle }}
                </span>
              </span>
              <!-- Said, not hidden: a known fix has no page of its own yet, and a
                   row that looks clickable but is not erodes trust in the rest. -->
              <span v-if="!item.route" class="shrink-0 text-[10px] text-mute">no page yet</span>
            </button>
          </template>

          <p
            v-if="searching && !groups.length && !isFetching"
            class="px-2.5 py-6 text-center text-xs text-mute"
          >
            Nothing matches “{{ query }}”.
          </p>
        </div>

        <div class="flex items-center gap-3 border-t px-4 py-2 text-[10px] text-mute">
          <span><kbd class="rounded border px-1">↑</kbd><kbd class="ml-0.5 rounded border px-1">↓</kbd> navigate</span>
          <span><kbd class="rounded border px-1">↵</kbd> open</span>
          <span class="ml-auto">⌘K to toggle</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>
