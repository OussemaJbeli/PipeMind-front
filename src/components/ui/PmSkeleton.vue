<script setup lang="ts">
withDefaults(defineProps<{ rounded?: string }>(), { rounded: 'var(--pm-radius-sm)' })
</script>

<template>
  <div
    class="animate-pulse bg-surface-2"
    :style="{ borderRadius: rounded }"
    aria-hidden="true"
  />
</template>
