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
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

const groups: NavGroup[] = [
  {
    items: [
      { label: 'Home', icon: 'i-lucide-house', to: { name: 'workspace' } },
    ],
  },
]
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
          v-slot="{ isActive, navigate }"
          :to="item.to"
          custom
        >
          <button
            class="mb-0.5 flex h-10 w-full items-center gap-3 rounded-[var(--pm-radius)] px-3 text-sm transition-colors"
            :class="isActive
              ? 'bg-[var(--pm-accent-dim)] font-medium text-accent'
              : 'text-dim hover:bg-surface-2 hover:text-fg'"
            @click="navigate"
          >
            <i :class="item.icon" class="size-[18px] shrink-0" />
            <span v-if="!ui.sidebarCollapsed" class="truncate">{{ item.label }}</span>
          </button>
        </RouterLink>
      </template>
    </div>
  </nav>

  <div class="border-t p-3">
    <button
      class="flex w-full items-center gap-3 rounded-[var(--pm-radius)] p-2 text-left transition-colors hover:bg-surface-2"
      @click="auth.logout()"
    >
      <span
        class="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--pm-accent-dim)] text-[11px] font-semibold text-accent"
      >{{ auth.initials }}</span>

      <span v-if="!ui.sidebarCollapsed" class="min-w-0 flex-1">
        <span class="block truncate text-[13px] font-medium">{{ auth.user?.name }}</span>
        <span class="block truncate text-[11px] capitalize text-dim">{{ auth.role }}</span>
      </span>
    </button>
  </div>
</template>
