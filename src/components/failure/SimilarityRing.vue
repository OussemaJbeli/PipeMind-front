<script setup lang="ts">
const props = defineProps<{ value: number }>()

const RADIUS = 7
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// Similarity is not confidence: a 0.6 neighbour is still worth reading, so the
// scale is neutral rather than the traffic-light treatment used for confidence.
const tone = computed(() => (props.value >= 0.8 ? 'var(--pm-accent)' : 'var(--pm-text-dim)'))
</script>

<template>
  <span class="grid size-[18px] place-items-center">
    <svg class="-rotate-90" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" :r="RADIUS" fill="none" stroke="var(--pm-surface-3)" stroke-width="2.5" />
      <circle
        cx="9" cy="9" :r="RADIUS" fill="none" :stroke="tone" stroke-width="2.5" stroke-linecap="round"
        :stroke-dasharray="CIRCUMFERENCE" :stroke-dashoffset="CIRCUMFERENCE * (1 - value)"
      />
    </svg>
  </span>
</template>
