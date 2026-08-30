<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import type { ProjectCard as Project } from '@/types/api'

const props = defineProps<{ project: Project }>()

const auth = useAuthStore()
const open = ref(false)
const root = ref<HTMLElement | null>(null)

onClickOutside(root, () => { open.value = false })

const items = computed(() => [
  { label: 'Open project', icon: 'i-lucide-arrow-right', to: { name: 'project.overview', params: { slug: props.project.slug } } },
  { label: 'Pipelines', icon: 'i-lucide-git-branch', to: { name: 'project.overview', params: { slug: props.project.slug } } },
  ...(auth.can('projects.manage')
    ? [{ label: 'Settings', icon: 'i-lucide-settings', to: { name: 'project.overview', params: { slug: props.project.slug } } }]
    : []),
])
</script>

<template>
  <div ref="root" class="relative shrink-0">
    <button
      class="grid size-7 place-items-center rounded-md text-mute transition-colors hover:bg-surface-2 hover:text-fg"
      :aria-label="`Actions for ${project.name}`"
      :aria-expanded="open"
      @click="open = !open"
    >
      <i-lucide-ellipsis class="size-4" />
    </button>

    <Transition name="menu">
      <div
        v-if="open"
        class="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-[var(--pm-radius)] border bg-surface-2 py-1 shadow-[var(--pm-shadow-lg)]"
      >
        <button
          v-for="item in items"
          :key="item.label"
          class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-dim transition-colors hover:bg-surface-3 hover:text-fg"
          @click="open = false; $router.push(item.to)"
        >
          <i :class="item.icon" class="size-3.5" />
          {{ item.label }}
        </button>
      </div>
    </Transition>
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
  transform: translateY(-4px);
}
</style>
