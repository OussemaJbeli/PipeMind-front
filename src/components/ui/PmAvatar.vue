<script setup lang="ts">
withDefaults(defineProps<{
  initials: string
  src?: string | null
  color?: string
  size?: 'sm' | 'md' | 'lg'
}>(), { color: 'var(--pm-accent)', size: 'md' })

const SIZES = { sm: 'size-7 text-[10px]', md: 'size-9 text-[11px]', lg: 'size-11 text-sm' } as const
</script>

<template>
  <img
    v-if="src"
    :src="src"
    alt=""
    class="shrink-0 rounded-full object-cover"
    :class="SIZES[size]"
  >
  <span
    v-else
    class="grid shrink-0 place-items-center rounded-full font-semibold"
    :class="SIZES[size]"
    :style="{
      background: `color-mix(in srgb, ${color} 16%, transparent)`,
      color,
    }"
    aria-hidden="true"
  >{{ initials }}</span>
</template>
