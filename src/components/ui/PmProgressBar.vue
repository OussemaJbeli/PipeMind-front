<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  value: number
  max?: number
  color?: string
  height?: number
  /** Colour by threshold instead of a fixed colour — used for budget bars. */
  threshold?: boolean
}>(), { max: 100, height: 6 })

const pct = computed(() => Math.min(100, Math.max(0, (props.value / props.max) * 100)))

const barColor = computed(() => {
  if (props.color)
    return props.color

  if (!props.threshold)
    return 'var(--pm-accent)'

  return pct.value >= 90 ? 'var(--pm-danger)' : pct.value >= 70 ? 'var(--pm-warning)' : 'var(--pm-accent)'
})
</script>

<template>
  <div
    class="w-full overflow-hidden rounded-full bg-surface-3"
    :style="{ height: `${height}px` }"
    role="progressbar"
    :aria-valuenow="value"
    :aria-valuemax="max"
  >
    <div
      class="h-full rounded-full transition-[width] duration-500"
      :style="{ width: `${pct}%`, background: barColor }"
    />
  </div>
</template>
