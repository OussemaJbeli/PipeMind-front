<script setup lang="ts">
import { useRoute } from 'vue-router'

import { useProject } from '@/api/queries/project'
import { useRemediations } from '@/api/queries/remediation'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()

const slug = computed(() => String(route.params.slug ?? ''))
const { data: project } = useProject(slug)

// The count belongs in the navigation because a pending approval is somebody
// blocked: it is the one thing in this app that waits on a human.
const { data: remediations } = useRemediations(slug)
const pendingRemediations = computed(() => remediations.value?.pending || null)

interface NavItem {
  label: string
  icon: string
  to: { name: string, params?: Record<string, string> }
  permission?: string
  badge?: number | null
  pending?: boolean
}

// Groups match ui/project.png exactly.
const groups = computed<Array<{ label?: string, items: NavItem[] }>>(() => [
  {
    label: 'Project',
    items: [
      { label: 'Overview', icon: 'i-lucide-house', to: { name: 'project.overview', params: { slug: slug.value } } },
      { label: 'Pipelines', icon: 'i-lucide-git-branch', to: { name: 'project.pipelines', params: { slug: slug.value } } },
      { label: 'Failures', icon: 'i-lucide-triangle-alert', to: { name: 'project.failures', params: { slug: slug.value } } },
      { label: 'Analytics', icon: 'i-lucide-chart-column', to: { name: 'project.analytics', params: { slug: slug.value } } },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'AI Analyses', icon: 'i-lucide-sparkles', to: { name: 'project.analyses', params: { slug: slug.value } } },
      { label: 'Failure History', icon: 'i-lucide-history', to: { name: 'project.history', params: { slug: slug.value } } },
      { label: 'Knowledge', icon: 'i-lucide-book-open', to: { name: 'project.knowledge', params: { slug: slug.value } } },
    ],
  },
  {
    label: 'Actions',
    items: [
      { label: 'Remediation', icon: 'i-lucide-wrench', to: { name: 'project.remediation', params: { slug: slug.value } }, badge: pendingRemediations.value },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Integration', icon: 'i-lucide-plug', to: { name: 'project.integration', params: { slug: slug.value } }, permission: 'projects.manage' },
      { label: 'Project Settings', icon: 'i-lucide-settings', to: { name: 'project.settings', params: { slug: slug.value } }, permission: 'projects.manage' },
    ],
  },
])

const userMenuOpen = ref(false)
const userMenu = ref<HTMLElement | null>(null)
onClickOutside(userMenu, () => { userMenuOpen.value = false })
</script>

<template>
  <div class="flex items-center gap-2.5 px-4" :style="{ height: 'var(--pm-topbar-h)' }">
    <PmLogo class="size-7 shrink-0" />
    <span v-if="!ui.sidebarCollapsed" class="text-[17px] font-semibold">PipeMind</span>
  </div>

  <!--
    Opens the command palette rather than a dropdown of its own: the palette
    already lists every project and handles keyboard navigation, and a second
    overlay would be a second thing to keep in step.
  -->
  <button
    class="mx-3 mb-2 flex items-center gap-3 rounded-[var(--pm-radius)] border bg-surface p-3 text-left transition-colors hover:bg-surface-2"
    :class="ui.sidebarCollapsed ? 'w-[calc(100%-24px)] justify-center px-2' : 'w-[calc(100%-24px)]'"
    :title="`Switch project — ${'\u2318'}K`"
    @click="ui.commandPaletteOpen = true"
  >
    <span
      class="grid size-9 shrink-0 place-items-center rounded-[var(--pm-radius-sm)] text-xs font-semibold"
      :style="{
        background: `color-mix(in srgb, ${project?.color ?? 'var(--pm-accent)'} 18%, transparent)`,
        color: project?.color ?? 'var(--pm-accent)',
      }"
    >{{ project?.initials ?? '··' }}</span>

    <span v-if="!ui.sidebarCollapsed" class="min-w-0 flex-1">
      <span class="block truncate text-[13px] font-semibold">{{ project?.name ?? slug }}</span>
      <span class="block truncate text-[11px] text-dim">
        {{ project?.tech_stack?.join(' · ') ?? '—' }}
      </span>
    </span>

    <i-lucide-chevron-down v-if="!ui.sidebarCollapsed" class="size-4 shrink-0 text-mute" />
  </button>

  <nav class="flex-1 overflow-y-auto px-3 py-1">
    <div v-for="(group, gi) in groups" :key="gi" class="mb-4">
      <p
        v-if="group.label && !ui.sidebarCollapsed"
        class="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-mute"
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
            class="mb-0.5 flex h-9 w-full items-center gap-3 rounded-[var(--pm-radius)] px-3 text-[13px] transition-colors"
            :class="isExactActive && !item.pending
              ? 'bg-[var(--pm-accent-dim)] font-medium text-accent'
              : item.pending
                ? 'cursor-not-allowed text-mute'
                : 'text-dim hover:bg-surface-2 hover:text-fg'"
            :disabled="item.pending"
            :title="ui.sidebarCollapsed ? item.label : undefined"
            @click="navigate"
          >
            <i :class="item.icon" class="size-[17px] shrink-0" />
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
      class="mt-1 flex w-full items-center gap-3 rounded-[var(--pm-radius)] px-2 py-2 text-[13px] text-mute transition-colors hover:bg-surface-2 hover:text-dim"
      :class="ui.sidebarCollapsed && 'justify-center'"
      :aria-label="ui.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      @click="ui.sidebarCollapsed = !ui.sidebarCollapsed"
    >
      <i-lucide-chevrons-left v-if="!ui.sidebarCollapsed" class="size-4" />
      <i-lucide-chevrons-right v-else class="size-4" />
      <span v-if="!ui.sidebarCollapsed">Collapse</span>
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
