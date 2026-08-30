<script setup lang="ts">
// Wired to /notifications/count once that endpoint exists (roadmaps/04 remainder).
const count = ref(0)
</script>

<template>
  <button
    class="relative grid size-10 place-items-center rounded-[var(--pm-radius)] text-dim transition-colors hover:bg-surface-2 hover:text-fg"
    :aria-label="count ? `Notifications, ${count} unread` : 'Notifications'"
  >
    <i-lucide-bell class="size-5" />
    <span
      v-if="count"
      class="absolute right-1 top-1 grid min-w-[17px] place-items-center rounded-full bg-[var(--pm-danger)] px-1 text-[10px] font-semibold text-white"
    >{{ count > 99 ? '99+' : count }}</span>
  </button>
</template>
