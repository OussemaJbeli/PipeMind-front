<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  value: number
  size?: number
  thickness?: number
  color?: string
  showLabel?: boolean
}>(), { size: 56, thickness: 5, showLabel: true })

const clamped = computed(() => Math.min(100, Math.max(0, props.value)))
const radius = computed(() => (props.size - props.thickness) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const offset = computed(() => circumference.value * (1 - clamped.value / 100))

/** Colour encodes health so the grid is scannable without reading any number. */
const stroke = computed(() => {
  if (props.color)
    return props.color

  return clamped.value >= 95
    ? 'var(--pm-accent)'
    : clamped.value >= 85 ? 'var(--pm-warning)' : 'var(--pm-danger)'
})
</script>

<template>
  <div
    class="relative grid shrink-0 place-items-center"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="img"
    :aria-label="`${Math.round(clamped)} percent`"
  >
    <svg :width="size" :height="size" class="-rotate-90">
      <circle
        :cx="size / 2" :cy="size / 2" :r="radius"
        fill="none" stroke="var(--pm-surface-3)" :stroke-width="thickness"
      />
      <circle
        :cx="size / 2" :cy="size / 2" :r="radius"
        fill="none" :stroke="stroke" :stroke-width="thickness" stroke-linecap="round"
        :stroke-dasharray="circumference" :stroke-dashoffset="offset"
        class="transition-[stroke-dashoffset] duration-500"
      />
    </svg>

    <span
      v-if="showLabel"
      class="absolute text-[11px] font-semibold tnum"
      :style="{ color: stroke }"
    >{{ Math.round(clamped) }}%</span>
  </div>
</template>
