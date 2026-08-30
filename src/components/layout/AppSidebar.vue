<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()

interface NavItem {
  label: string
  icon: string
  to: { name: string }
  permission?: string
  badge?: number | null
  /** Routes not yet built. Rendered disabled rather than falsely active. */
  pending?: boolean
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

// Matches the grouping in ui/workspace.png.
const groups: NavGroup[] = [
  {
    items: [
      { label: 'Home', icon: 'i-lucide-house', to: { name: 'workspace' } },
      { label: 'Projects', icon: 'i-lucide-folder', to: { name: 'workspace' }, pending: true },
      { label: 'Activity', icon: 'i-lucide-activity', to: { name: 'workspace' }, pending: true },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { label: 'Members', icon: 'i-lucide-users', to: { name: 'workspace' }, permission: 'team.manage', pending: true },
      { label: 'Integrations', icon: 'i-lucide-plug', to: { name: 'workspace' }, permission: 'projects.manage', pending: true },
      { label: 'AI Providers', icon: 'i-lucide-sparkles', to: { name: 'workspace' }, permission: 'ai.manage', pending: true },
      { label: 'Settings', icon: 'i-lucide-settings', to: { name: 'workspace' }, pending: true },
    ],
  },
]

const userMenuOpen = ref(false)
const userMenu = ref<HTMLElement | null>(null)
onClickOutside(userMenu, () => { userMenuOpen.value = false })
</script>

<template>
  <div class="flex items-center gap-2.5 px-4" :style="{ height: 'var(--pm-topbar-h)' }">
    <PmLogo class="size-7 shrink-0" />
    <span v-if="!ui.sidebarCollapsed" class="text-[17px] font-semibold">PipeMind</span>
  </div>

  <nav class="flex-1 overflow-y-auto px-3 py-2">
    <div v-for="(group, gi) in groups" :key="gi" class="mb-5">
      <p
        v-if="group.label && !ui.sidebarCollapsed"
        class="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-mute"
      >
        {{ group.label }}
      </p>

      <template v-for="item in group.items" :key="item.label">
        <RouterLink
          v-if="!item.permission || auth.can(item.permission)"
          v-slot="{ isExactActive, navigate }"
          :to="item.to"
          custom
        >
          <button
            class="mb-0.5 flex h-10 w-full items-center gap-3 rounded-[var(--pm-radius)] px-3 text-sm transition-colors"
            :class="isExactActive && !item.pending
              ? 'bg-[var(--pm-accent-dim)] font-medium text-accent'
              : item.pending
                ? 'cursor-not-allowed text-mute'
                : 'text-dim hover:bg-surface-2 hover:text-fg'"
            :disabled="item.pending"
            :title="ui.sidebarCollapsed ? item.label : undefined"
            @click="navigate"
          >
            <i :class="item.icon" class="size-[18px] shrink-0" />
            <span v-if="!ui.sidebarCollapsed" class="truncate">{{ item.label }}</span>
            <PmBadge v-if="item.badge && !ui.sidebarCollapsed" tone="danger" class="ml-auto">
              {{ item.badge }}
            </PmBadge>
          </button>
        </RouterLink>
      </template>
    </div>
  </nav>

  <div ref="userMenu" class="relative border-t p-3">
    <Transition name="menu">
      <div
        v-if="userMenuOpen"
        class="absolute bottom-[calc(100%-4px)] left-3 right-3 z-30 overflow-hidden rounded-[var(--pm-radius)] border bg-surface-2 py-1 shadow-[var(--pm-shadow-lg)]"
      >
        <button
          class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-dim transition-colors hover:bg-surface-3 hover:text-fg"
          @click="ui.toggleTheme(); userMenuOpen = false"
        >
          <i-lucide-sun-moon class="size-3.5" /> Switch theme
        </button>
        <button
          class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[var(--pm-danger)] transition-colors hover:bg-surface-3"
          @click="auth.logout(); $router.push({ name: 'login' })"
        >
          <i-lucide-log-out class="size-3.5" /> Sign out
        </button>
      </div>
    </Transition>

    <button
      class="flex w-full items-center gap-3 rounded-[var(--pm-radius)] p-2 text-left transition-colors hover:bg-surface-2"
      :aria-expanded="userMenuOpen"
      @click="userMenuOpen = !userMenuOpen"
    >
      <PmAvatar :initials="auth.initials" :src="auth.user?.avatar_url" />

      <span v-if="!ui.sidebarCollapsed" class="min-w-0 flex-1">
        <span class="block truncate text-[13px] font-medium">{{ auth.user?.name }}</span>
        <span class="block truncate text-[11px] capitalize text-dim">{{ auth.role }}</span>
      </span>

      <i-lucide-chevron-down v-if="!ui.sidebarCollapsed" class="size-4 shrink-0 text-mute" />
    </button>

    <button
      v-if="!ui.sidebarCollapsed"
      class="mt-1 flex w-full items-center gap-3 rounded-[var(--pm-radius)] px-2 py-2 text-[13px] text-mute transition-colors hover:bg-surface-2 hover:text-dim"
      @click="ui.sidebarCollapsed = true"
    >
      <i-lucide-chevrons-left class="size-4" /> Collapse
    </button>
    <button
      v-else
      class="mt-1 grid w-full place-items-center rounded-[var(--pm-radius)] py-2 text-mute transition-colors hover:bg-surface-2 hover:text-dim"
      aria-label="Expand sidebar"
      @click="ui.sidebarCollapsed = false"
    >
      <i-lucide-chevrons-right class="size-4" />
    </button>
  </div>
</template>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
