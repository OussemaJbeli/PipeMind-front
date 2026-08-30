<script setup lang="ts">
defineProps<{ content: string, placement?: string }>()
</script>

<template>
  <span v-tooltip="{ content, placement: placement ?? 'top' }" class="inline-flex">
    <slot />
  </span>
</template>
