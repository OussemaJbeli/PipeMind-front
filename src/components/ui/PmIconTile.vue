<script setup lang="ts">
withDefaults(defineProps<{
  icon: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
}>(), { color: 'var(--pm-accent)', size: 'md' })

const SIZES = { sm: 'size-9', md: 'size-11', lg: 'size-14' } as const
const ICONS = { sm: 'size-[18px]', md: 'size-5', lg: 'size-6' } as const
</script>

<template>
  <div
    class="grid shrink-0 place-items-center rounded-[var(--pm-radius)]"
    :class="SIZES[size]"
    :style="{ background: `color-mix(in srgb, ${color} 12%, transparent)` }"
  >
    <i :class="[icon, ICONS[size]]" :style="{ color }" />
  </div>
</template>
