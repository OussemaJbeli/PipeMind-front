<script setup lang="ts">
const props = defineProps<{ value: number }>()

const RADIUS = 11
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * Words, not just a number.
 *
 * "92%" alone invites false precision — it reads as a measurement when it is an
 * estimate. "High confidence · 92%" tells the reader how much weight to give it
 * before they read the number.
 */
const label = computed(() =>
  props.value >= 0.85
    ? 'High confidence'
    : props.value >= 0.6
      ? 'Moderate confidence'
      : 'Low confidence',
)

const tone = computed(() =>
  props.value >= 0.85
    ? 'var(--pm-accent)'
    : props.value >= 0.6
      ? 'var(--pm-warning)'
      : 'var(--pm-text-dim)',
)

const percent = computed(() => Math.round(props.value * 100))
</script>

<template>
  <PmTooltip content="How strongly the evidence supports this conclusion. Always check the evidence below.">
    <span class="flex items-center gap-2 text-xs" :style="{ color: tone }">
      <span class="relative grid size-7 place-items-center">
        <svg class="-rotate-90" viewBox="0 0 28 28" aria-hidden="true">
          <circle cx="14" cy="14" :r="RADIUS" fill="none" stroke="var(--pm-surface-3)" stroke-width="3" />
          <circle
            cx="14" cy="14" :r="RADIUS" fill="none" :stroke="tone" stroke-width="3"
            stroke-linecap="round"
            :stroke-dasharray="CIRCUMFERENCE"
            :stroke-dashoffset="CIRCUMFERENCE * (1 - value)"
          />
        </svg>
      </span>
      <span class="font-medium">{{ label }} · {{ percent }}%</span>
    </span>
  </PmTooltip>
</template>
